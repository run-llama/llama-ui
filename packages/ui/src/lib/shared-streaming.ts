/**
 * Shared Streaming Utility
 *
 * Provides transparent request deduplication and sharing for streaming operations.
 * Multiple subscribers to the same stream will share a single underlying connection,
 * improving performance and reducing server load.
 */

export interface StreamSubscriber<TEvent> {
  onStart?: () => void;
  onData?: (event: TEvent) => void;
  onError?: (error: Error) => void;
  onFinish?: (allEvents: TEvent[]) => void;
  onComplete?: () => void; // Called when stream ends (success or error)
}

export interface StreamExecutor<TEvent> {
  (
    subscriber: StreamSubscriber<TEvent>,
    signal: AbortSignal
  ): Promise<TEvent[]>;
}

interface SharedStreamState<TEvent> {
  // Stream control
  controller: AbortController;
  promise: Promise<TEvent[]>;

  // Subscriber management
  subscribers: Set<StreamSubscriber<TEvent>>;

  // Event storage
  events: TEvent[];
  isCompleted: boolean;
  error: Error | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SharedStreamingManager<TEvent = any> {
  private activeStreams = new Map<string, SharedStreamState<TEvent>>();

  /**
   * Subscribe to a shared stream identified by key.
   * If stream already exists, reuses it and sends historical events.
   * If stream doesn't exist, creates a new one using the executor.
   *
   * @param streamKey - Unique identifier for the stream
   * @param subscriber - Event handlers for the stream
   * @param executor - Function that performs the actual streaming
   * @param externalSignal - Optional abort signal from caller
   * @returns Promise that resolves with all events and unsubscribe function
   */
  subscribe(
    streamKey: string,
    subscriber: StreamSubscriber<TEvent>,
    executor: StreamExecutor<TEvent>,
    externalSignal?: AbortSignal
  ): {
    promise: Promise<TEvent[]>;
    unsubscribe: () => void;
  } {
    const existingStream = this.activeStreams.get(streamKey);
    if (existingStream) {
      return this.subscribeToExistingStream(
        streamKey,
        existingStream,
        subscriber,
        externalSignal
      );
    }

    return this.createNewStream(
      streamKey,
      subscriber,
      executor,
      externalSignal
    );
  }

  /**
   * Get current events for a stream without subscribing
   */
  getStreamEvents(streamKey: string): TEvent[] {
    const stream = this.activeStreams.get(streamKey);
    return stream ? [...stream.events] : [];
  }

  /**
   * Check if a stream is currently active
   */
  isStreamActive(streamKey: string): boolean {
    return this.activeStreams.has(streamKey);
  }

  /**
   * Get number of subscribers for a stream
   */
  getSubscriberCount(streamKey: string): number {
    const stream = this.activeStreams.get(streamKey);
    return stream ? stream.subscribers.size : 0;
  }

  /**
   * Force close a stream and all its subscribers
   */
  closeStream(streamKey: string): void {
    const stream = this.activeStreams.get(streamKey);
    if (stream) {
      stream.controller.abort();
      this.cleanupStream(streamKey);
    }
  }

  /**
   * Close all active streams
   */
  closeAllStreams(): void {
    for (const streamKey of this.activeStreams.keys()) {
      this.closeStream(streamKey);
    }
  }

  private subscribeToExistingStream(
    streamKey: string,
    stream: SharedStreamState<TEvent>,
    subscriber: StreamSubscriber<TEvent>,
    externalSignal?: AbortSignal
  ): { promise: Promise<TEvent[]>; unsubscribe: () => void } {
    // Add subscriber to existing stream
    stream.subscribers.add(subscriber);

    // Send historical events to new subscriber
    try {
      subscriber.onStart?.();

      for (const event of stream.events) {
        subscriber.onData?.(event);
      }

      // If stream already completed, notify subscriber
      if (stream.isCompleted) {
        if (stream.error) {
          subscriber.onError?.(stream.error);
        } else {
          subscriber.onFinish?.(stream.events);
        }
        subscriber.onComplete?.();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error sending historical events to subscriber:", error);
    }

    // Handle external abort signal
    const handleExternalAbort = () => {
      this.unsubscribe(streamKey, subscriber);
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        this.unsubscribe(streamKey, subscriber);
      } else {
        externalSignal.addEventListener("abort", handleExternalAbort);
      }
    }

    const unsubscribe = () => {
      if (externalSignal) {
        externalSignal.removeEventListener("abort", handleExternalAbort);
      }
      this.unsubscribe(streamKey, subscriber);
    };

    return {
      promise: stream.promise,
      unsubscribe,
    };
  }

  private createNewStream(
    streamKey: string,
    subscriber: StreamSubscriber<TEvent>,
    executor: StreamExecutor<TEvent>,
    externalSignal?: AbortSignal
  ): { promise: Promise<TEvent[]>; unsubscribe: () => void } {
    const controller = new AbortController();
    const subscribers = new Set([subscriber]);
    const events: TEvent[] = [];

    const streamState: SharedStreamState<TEvent> = {
      controller,
      promise: Promise.resolve([]), // Will be replaced below
      subscribers,
      events,
      isCompleted: false,
      error: null,
    };

    // Store stream state
    this.activeStreams.set(streamKey, streamState);

    // Handle external abort signal
    const handleExternalAbort = () => {
      this.unsubscribe(streamKey, subscriber);
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        this.unsubscribe(streamKey, subscriber);
        return { promise: Promise.resolve([]), unsubscribe: () => {} };
      }
      externalSignal.addEventListener("abort", handleExternalAbort);
    }

    // Create composite subscriber that distributes events to all subscribers
    const compositeSubscriber: StreamSubscriber<TEvent> = {
      onStart: () => {
        streamState.subscribers.forEach((sub) => {
          try {
            sub.onStart?.();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error in subscriber onStart:", error);
          }
        });
      },

      onData: (event: TEvent) => {
        events.push(event);
        streamState.subscribers.forEach((sub) => {
          try {
            sub.onData?.(event);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error in subscriber onData:", error);
          }
        });
      },

      onError: (error: Error) => {
        streamState.error = error;
        streamState.isCompleted = true;

        streamState.subscribers.forEach((sub) => {
          try {
            sub.onError?.(error);
            sub.onComplete?.();
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error in subscriber onError:", err);
          }
        });

        this.cleanupStream(streamKey);
      },

      onFinish: (allEvents: TEvent[]) => {
        streamState.isCompleted = true;

        streamState.subscribers.forEach((sub) => {
          try {
            sub.onFinish?.(allEvents);
            sub.onComplete?.();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error in subscriber onFinish:", error);
          }
        });

        this.cleanupStream(streamKey);
      },
    };

    // Execute the actual streaming
    const streamPromise = this.executeStream(
      executor,
      compositeSubscriber,
      controller.signal
    );
    streamState.promise = streamPromise;

    const unsubscribe = () => {
      if (externalSignal) {
        externalSignal.removeEventListener("abort", handleExternalAbort);
      }
      this.unsubscribe(streamKey, subscriber);
    };

    return {
      promise: streamPromise,
      unsubscribe,
    };
  }

  private async executeStream(
    executor: StreamExecutor<TEvent>,
    subscriber: StreamSubscriber<TEvent>,
    signal: AbortSignal
  ): Promise<TEvent[]> {
    try {
      return await executor(subscriber, signal);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // Call subscriber.onError to distribute error to all subscribers
      subscriber.onError?.(err);
      throw err;
    }
  }

  private unsubscribe(
    streamKey: string,
    subscriber: StreamSubscriber<TEvent>
  ): void {
    const stream = this.activeStreams.get(streamKey);
    if (!stream) return;

    stream.subscribers.delete(subscriber);

    // If no more subscribers, abort the stream
    if (stream.subscribers.size === 0) {
      try {
        stream.controller.abort();
      } catch {
        // Ignore abort errors
      }
      this.cleanupStream(streamKey);
    }
  }

  private cleanupStream(streamKey: string): void {
    this.activeStreams.delete(streamKey);
  }
}

// Global instance for workflow streaming
export const workflowStreamingManager = new SharedStreamingManager();
