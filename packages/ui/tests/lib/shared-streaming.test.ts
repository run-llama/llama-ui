import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';
import { SharedStreamingManager, StreamSubscriber, StreamExecutor } from '../../src/lib/shared-streaming';

interface TestEvent {
  id: number;
  data: string;
  timestamp: number;
}

describe('SharedStreamingManager', () => {
  let manager: SharedStreamingManager<TestEvent>;
  let mockExecutor: MockedFunction<StreamExecutor<TestEvent>>;
  let mockSubscriber: StreamSubscriber<TestEvent>;

  beforeEach(() => {
    manager = new SharedStreamingManager<TestEvent>();
    
    mockSubscriber = {
      onStart: vi.fn(),
      onData: vi.fn(),
      onError: vi.fn(),
      onFinish: vi.fn(),
      onComplete: vi.fn(),
    };

    mockExecutor = vi.fn();
  });

  afterEach(() => {
    manager.closeAllStreams();
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should create new stream when none exists', async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: 'event1', timestamp: 1000 },
        { id: 2, data: 'event2', timestamp: 2000 },
      ];

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        testEvents.forEach(event => subscriber.onData?.(event));
        subscriber.onFinish?.(testEvents);
        return testEvents;
      });

      const { promise } = manager.subscribe('test-stream', mockSubscriber, mockExecutor);
      const events = await promise;

      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(mockSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(mockSubscriber.onData).toHaveBeenCalledTimes(2);
      expect(mockSubscriber.onFinish).toHaveBeenCalledWith(testEvents);
      expect(events).toEqual(testEvents);
    });

    it('should return current events without subscribing', () => {
      expect(manager.getStreamEvents('non-existent')).toEqual([]);
      expect(manager.isStreamActive('non-existent')).toBe(false);
      expect(manager.getSubscriberCount('non-existent')).toBe(0);
    });
  });

  describe('Stream sharing and reuse', () => {
    it('should reuse existing stream for same key', async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: 'shared-event1', timestamp: 1000 },
        { id: 2, data: 'shared-event2', timestamp: 2000 },
      ];

      // Mock a slow executor that we can control
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        
        // Send events gradually with proper Promise synchronization
        await new Promise(resolve => {
          setTimeout(() => {
            subscriber.onData?.(testEvents[0]);
            resolve(undefined);
          }, 10);
        });
        
        await new Promise(resolve => {
          setTimeout(() => {
            subscriber.onData?.(testEvents[1]);
            resolve(undefined);
          }, 60); // After the 50ms delay for second subscriber
        });
        
        const events = await executorPromise;
        subscriber.onFinish?.(events);
        return events;
      });

      // Start first subscription
      const subscriber1 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onComplete: vi.fn(),
      };
      const { promise: promise1 } = manager.subscribe('shared-stream', subscriber1, mockExecutor);

      // Wait a bit then start second subscription (should reuse)
      await new Promise(resolve => setTimeout(resolve, 50)); // More realistic timing
      
      const subscriber2 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onComplete: vi.fn(),
      };
      
      const { promise: promise2 } = manager.subscribe('shared-stream', subscriber2, mockExecutor);

      // Executor should only be called once
      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(manager.getSubscriberCount('shared-stream')).toBe(2);

      // Second subscriber should get historical events immediately
      expect(subscriber2.onStart).toHaveBeenCalledTimes(1);
      expect(subscriber2.onData).toHaveBeenCalledTimes(1); // Should get first event
      
      // Complete the stream
      resolveExecutor!(testEvents);
      
      const [events1, events2] = await Promise.all([promise1, promise2]);

      // Both should receive the same events
      expect(events1).toEqual(testEvents);
      expect(events2).toEqual(testEvents);
      
      // Both subscribers should have received all events
      expect(subscriber1.onData).toHaveBeenCalledTimes(2);
      expect(subscriber2.onData).toHaveBeenCalledTimes(2);
      expect(subscriber1.onFinish).toHaveBeenCalledWith(testEvents);
      expect(subscriber2.onFinish).toHaveBeenCalledWith(testEvents);
    });


    it('should handle subscriber joining after stream was released/cleaned up', async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: 'released-event', timestamp: 1000 },
      ];

      // Use a fresh manager instance to avoid any test interference
      const isolatedManager = new SharedStreamingManager<TestEvent>();
      
      // Create separate mock executor for this test to avoid interference
      const releasedTestExecutor = vi.fn();
      releasedTestExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        subscriber.onData?.(testEvents[0]);
        subscriber.onFinish?.(testEvents);
        return testEvents;
      });

      // Create and complete a stream with single subscriber first
      const originalSubscriber = { ...mockSubscriber };
      
      const { promise: originalPromise } = isolatedManager.subscribe('released-stream', originalSubscriber, releasedTestExecutor);
      
      // Wait for stream to complete (which triggers cleanup)
      await originalPromise;
      
      // Verify stream was cleaned up after completion
      expect(isolatedManager.isStreamActive('released-stream')).toBe(false);
      expect(isolatedManager.getSubscriberCount('released-stream')).toBe(0);
      expect(releasedTestExecutor).toHaveBeenCalledTimes(1);

      // Now a new subscriber tries to join the released stream - should create new stream
      const newSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onComplete: vi.fn(),
      };

      const { promise: newPromise } = isolatedManager.subscribe('released-stream', newSubscriber, releasedTestExecutor);
      const newEvents = await newPromise;

      // Should create a completely new stream execution (2nd call total)
      expect(releasedTestExecutor).toHaveBeenCalledTimes(2); // Once for original, once for new
      expect(newSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(newSubscriber.onData).toHaveBeenCalledWith(testEvents[0]);
      expect(newSubscriber.onFinish).toHaveBeenCalledWith(testEvents);
      expect(newEvents).toEqual(testEvents);
      
      // After completion, stream should be cleaned up again (this is expected behavior)
      expect(isolatedManager.isStreamActive('released-stream')).toBe(false);
      expect(isolatedManager.getSubscriberCount('released-stream')).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle executor errors and notify all subscribers', async () => {
      const testError = new Error('Stream execution failed');
      
      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        throw testError;
      });

      const subscriber1 = { ...mockSubscriber };
      const subscriber2 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onComplete: vi.fn(),
      };

      // Start both subscriptions
      const { promise: promise1 } = manager.subscribe('error-stream', subscriber1, mockExecutor);
      const { promise: promise2 } = manager.subscribe('error-stream', subscriber2, mockExecutor);

      // Wait for completion
      await expect(promise1).rejects.toThrow(testError);
      await expect(promise2).rejects.toThrow(testError);

      // Both subscribers should be notified of error
      expect(subscriber1.onError).toHaveBeenCalledWith(testError);
      expect(subscriber2.onError).toHaveBeenCalledWith(testError);
      expect(subscriber1.onComplete).toHaveBeenCalledTimes(1);
      expect(subscriber2.onComplete).toHaveBeenCalledTimes(1);

      // Stream should be cleaned up
      expect(manager.isStreamActive('error-stream')).toBe(false);
    });

    it('should handle subscriber callback errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const faultySubscriber = {
        onStart: vi.fn(() => { throw new Error('onStart error'); }),
        onData: vi.fn(() => { throw new Error('onData error'); }),
        onFinish: vi.fn(() => { throw new Error('onFinish error'); }),
      };

      const goodSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onFinish: vi.fn(),
      };

      const testEvents: TestEvent[] = [{ id: 1, data: 'test', timestamp: 1000 }];

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        subscriber.onData?.(testEvents[0]);
        subscriber.onFinish?.(testEvents);
        return testEvents;
      });

      const { promise: promise1 } = manager.subscribe('faulty-stream', faultySubscriber, mockExecutor);
      const { promise: promise2 } = manager.subscribe('faulty-stream', goodSubscriber, mockExecutor);

      const [events1, events2] = await Promise.all([promise1, promise2]);

      // Both should complete despite faulty subscriber
      expect(events1).toEqual(testEvents);
      expect(events2).toEqual(testEvents);
      
      // Good subscriber should work normally
      expect(goodSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(goodSubscriber.onData).toHaveBeenCalledWith(testEvents[0]);
      expect(goodSubscriber.onFinish).toHaveBeenCalledWith(testEvents);

      // Console errors should be logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Subscription management', () => {
    it('should handle unsubscribe correctly', async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise;
      });

      const { unsubscribe } = manager.subscribe('unsubscribe-stream', mockSubscriber, mockExecutor);
      
      expect(manager.getSubscriberCount('unsubscribe-stream')).toBe(1);
      
      // Unsubscribe
      unsubscribe();
      
      expect(manager.getSubscriberCount('unsubscribe-stream')).toBe(0);
      expect(manager.isStreamActive('unsubscribe-stream')).toBe(false);

      // Complete the executor (should not affect anything)
      resolveExecutor!([]);
    });

    it('should handle external abort signal', async () => {
      const abortController = new AbortController();
      
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise;
      });

      const subscriptionPromise = manager.subscribe('abort-stream', mockSubscriber, mockExecutor, abortController.signal);
      
      expect(manager.getSubscriberCount('abort-stream')).toBe(1);
      
      // Abort externally
      abortController.abort();
      
      // Should clean up
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for cleanup
      expect(manager.getSubscriberCount('abort-stream')).toBe(0);

      // Complete the executor
      resolveExecutor!([]);
      await subscriptionPromise;
    });

    it('should handle external signal cleanup during unsubscribe', async () => {
      const abortController = new AbortController();
      
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise;
      });

      // Subscribe with external signal
      const { unsubscribe } = manager.subscribe('cleanup-stream', mockSubscriber, mockExecutor, abortController.signal);
      
      expect(manager.getSubscriberCount('cleanup-stream')).toBe(1);
      
      // Manually unsubscribe (this should trigger external signal cleanup)
      unsubscribe();
      
      expect(manager.getSubscriberCount('cleanup-stream')).toBe(0);
      expect(manager.isStreamActive('cleanup-stream')).toBe(false);

      // Verify that aborting the already cleaned-up signal doesn't cause issues
      abortController.abort();

      // Complete the executor
      resolveExecutor!([]);
    });

    it('should handle multiple subscribers unsubscribing', async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise;
      });

      const subscription1 = manager.subscribe('multi-unsub-stream', mockSubscriber, mockExecutor);
      const subscription2 = manager.subscribe('multi-unsub-stream', { ...mockSubscriber }, mockExecutor);
      const subscription3 = manager.subscribe('multi-unsub-stream', { ...mockSubscriber }, mockExecutor);

      expect(manager.getSubscriberCount('multi-unsub-stream')).toBe(3);

      // Unsubscribe one by one
      subscription1.unsubscribe();
      expect(manager.getSubscriberCount('multi-unsub-stream')).toBe(2);
      expect(manager.isStreamActive('multi-unsub-stream')).toBe(true);

      subscription2.unsubscribe();
      expect(manager.getSubscriberCount('multi-unsub-stream')).toBe(1);
      expect(manager.isStreamActive('multi-unsub-stream')).toBe(true);

      subscription3.unsubscribe();
      expect(manager.getSubscriberCount('multi-unsub-stream')).toBe(0);
      expect(manager.isStreamActive('multi-unsub-stream')).toBe(false);

      // Complete the executor
      resolveExecutor!([]);
    });



    it('should handle errors in subscriber onError callbacks during executor errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Stream execution failed');
      
      const faultyErrorSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(() => { throw new Error('onError callback failed'); }), // This will trigger line 238-239
        onFinish: vi.fn(),
        onComplete: vi.fn(),
      };

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        throw testError;
      });

      const { promise } = manager.subscribe('faulty-error-stream', faultyErrorSubscriber, mockExecutor);

      // Wait for completion - should handle the onError callback error gracefully
      await expect(promise).rejects.toThrow(testError);

      // Should have logged the subscriber callback error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in subscriber onError:', expect.any(Error));
      
      // Stream should still be cleaned up
      expect(manager.isStreamActive('faulty-error-stream')).toBe(false);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Stream management', () => {
    it('should force close streams', async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise;
      });

      manager.subscribe('force-close-stream', mockSubscriber, mockExecutor);
      
      expect(manager.isStreamActive('force-close-stream')).toBe(true);
      
      manager.closeStream('force-close-stream');
      
      expect(manager.isStreamActive('force-close-stream')).toBe(false);
      expect(manager.getSubscriberCount('force-close-stream')).toBe(0);

      // Complete the executor
      resolveExecutor!([]);
    });

    it('should close all streams', async () => {
      let resolveExecutor1: ((events: TestEvent[]) => void) | undefined;
      let resolveExecutor2: ((events: TestEvent[]) => void) | undefined;
      
      const executorPromise1 = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor1 = resolve;
      });
      
      const executorPromise2 = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor2 = resolve;
      });

      const mockExecutor1 = vi.fn().mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise1;
      });

      const mockExecutor2 = vi.fn().mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        return await executorPromise2;
      });

      manager.subscribe('stream-1', mockSubscriber, mockExecutor1);
      manager.subscribe('stream-2', { ...mockSubscriber }, mockExecutor2);
      
      expect(manager.isStreamActive('stream-1')).toBe(true);
      expect(manager.isStreamActive('stream-2')).toBe(true);
      
      manager.closeAllStreams();
      
      expect(manager.isStreamActive('stream-1')).toBe(false);
      expect(manager.isStreamActive('stream-2')).toBe(false);

      // Complete the executors
      resolveExecutor1!([]);
      resolveExecutor2!([]);
    });
  });

  describe('Edge cases', () => {
    it('should handle already aborted external signal', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const { promise } = manager.subscribe('aborted-stream', mockSubscriber, mockExecutor, abortController.signal);
      const events = await promise;
      
      expect(mockExecutor).not.toHaveBeenCalled();
      expect(events).toEqual([]);
      expect(manager.isStreamActive('aborted-stream')).toBe(false);
    });

    it('should handle already aborted external signal when joining existing stream', async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: 'existing-stream-event', timestamp: 1000 },
      ];

      // First, create an active stream
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        subscriber.onData?.(testEvents[0]);
        return await executorPromise;
      });

      const firstSubscription = manager.subscribe('existing-aborted-stream', mockSubscriber, mockExecutor);
      
      // Now try to join with an already aborted signal
      const abortController = new AbortController();
      abortController.abort();
      
      const abortedSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onFinish: vi.fn(),
        onComplete: vi.fn(),
      };

      // This should trigger the `externalSignal.aborted` path in subscribeToExistingStream (lines 148-149)
      const { promise: abortedPromise } = manager.subscribe('existing-aborted-stream', abortedSubscriber, mockExecutor, abortController.signal);
      
      // The aborted subscriber should be immediately unsubscribed
      expect(manager.getSubscriberCount('existing-aborted-stream')).toBe(1); // Only the first subscriber remains
      
      // Complete the first stream
      resolveExecutor!(testEvents);
      await firstSubscription.promise;
      await abortedPromise;
      
      // The aborted subscriber should have received start and historical events
      // but then been immediately unsubscribed  
      expect(abortedSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(abortedSubscriber.onData).toHaveBeenCalledWith(testEvents[0]);
    });


    it('should handle concurrent subscriptions to same stream', async () => {
      let startExecutor: (() => void) | undefined;
      const executorStarted = new Promise<void>((resolve) => {
        startExecutor = resolve;
      });

      mockExecutor.mockImplementation(async (subscriber: StreamSubscriber<TestEvent>, _signal: AbortSignal) => {
        subscriber.onStart?.();
        await executorStarted;
        const events = [{ id: 1, data: 'concurrent', timestamp: 1000 }];
        subscriber.onData?.(events[0]);
        subscriber.onFinish?.(events);
        return events;
      });

      // Start multiple subscriptions simultaneously
      const { promise: promise1 } = manager.subscribe('concurrent-stream', mockSubscriber, mockExecutor);
      const { promise: promise2 } = manager.subscribe('concurrent-stream', { ...mockSubscriber }, mockExecutor);
      const { promise: promise3 } = manager.subscribe('concurrent-stream', { ...mockSubscriber }, mockExecutor);

      // Should only create one executor
      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(manager.getSubscriberCount('concurrent-stream')).toBe(3);

      // Complete the stream
      startExecutor!();

      const results = await Promise.all([promise1, promise2, promise3]);
      
      // All should get the same result
      results.forEach(events => {
        expect(events).toEqual([{ id: 1, data: 'concurrent', timestamp: 1000 }]);
      });
    });
  });
});