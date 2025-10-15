import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockedFunction,
} from "vitest";
import {
  SharedStreamingManager,
  StreamSubscriber,
  StreamExecutor,
} from "../../src/lib/shared-streaming";

interface TestEvent {
  id: number;
  data: string;
  timestamp: number;
}

describe("SharedStreamingManager", () => {
  let manager: SharedStreamingManager<TestEvent>;
  let mockExecutor: MockedFunction<StreamExecutor<TestEvent>>;
  let mockSubscriber: StreamSubscriber<TestEvent>;

  let mockCanceler: MockedFunction<() => Promise<void>>;

  beforeEach(() => {
    manager = new SharedStreamingManager<TestEvent>();

    mockSubscriber = {
      onStart: vi.fn(),
      onData: vi.fn(),
      onError: vi.fn(),
      onSuccess: vi.fn(),
      onComplete: vi.fn(),
    };

    mockExecutor = vi.fn();
    mockCanceler = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    manager.closeAllStreams();
    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("should create new stream when none exists", async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: "event1", timestamp: 1000 },
        { id: 2, data: "event2", timestamp: 2000 },
      ];

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          testEvents.forEach((event) => subscriber.onData?.(event));
          subscriber.onSuccess?.(testEvents);
          return testEvents;
        }
      );

      const { promise } = manager.subscribe(
        "test-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );
      const events = await promise;

      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(mockSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(mockSubscriber.onData).toHaveBeenCalledTimes(2);
      expect(mockSubscriber.onSuccess).toHaveBeenCalledWith(testEvents);
      expect(events).toEqual(testEvents);
    });

    it("should return current events without subscribing", () => {
      expect(manager.getStreamEvents("non-existent")).toEqual([]);
      expect(manager.isStreamActive("non-existent")).toBe(false);
      expect(manager.getSubscriberCount("non-existent")).toBe(0);
    });
  });

  describe("Stream sharing and reuse", () => {
    it("should reuse existing stream for same key", async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: "shared-event1", timestamp: 1000 },
        { id: 2, data: "shared-event2", timestamp: 2000 },
      ];

      // Mock a slow executor that we can control
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();

          // Send events gradually with proper Promise synchronization
          await new Promise((resolve) => {
            setTimeout(() => {
              subscriber.onData?.(testEvents[0]);
              resolve(undefined);
            }, 10);
          });

          await new Promise((resolve) => {
            setTimeout(() => {
              subscriber.onData?.(testEvents[1]);
              resolve(undefined);
            }, 60); // After the 50ms delay for second subscriber
          });

          const events = await executorPromise;
          subscriber.onSuccess?.(events);
          return events;
        }
      );

      // Start first subscription
      const subscriber1 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onSucceed: vi.fn(),
        onComplete: vi.fn(),
      };
      const { promise: promise1 } = manager.subscribe(
        "shared-stream",
        subscriber1,
        mockExecutor,
        mockCanceler
      );

      // Wait a bit then start second subscription (should reuse)
      await new Promise((resolve) => setTimeout(resolve, 50)); // More realistic timing

      const subscriber2 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onSucceed: vi.fn(),
        onComplete: vi.fn(),
      };

      const { promise: promise2 } = manager.subscribe(
        "shared-stream",
        subscriber2,
        mockExecutor,
        mockCanceler
      );

      // Executor should only be called once
      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(manager.getSubscriberCount("shared-stream")).toBe(2);

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
      expect(subscriber1.onSucceed).toHaveBeenCalledWith(testEvents);
      expect(subscriber2.onSucceed).toHaveBeenCalledWith(testEvents);
    });

    it("should handle subscriber joining after stream was released/cleaned up", async () => {
      const testEvents: TestEvent[] = [
        { id: 1, data: "released-event", timestamp: 1000 },
      ];

      // Use a fresh manager instance to avoid any test interference
      const isolatedManager = new SharedStreamingManager<TestEvent>();

      // Create separate mock executor for this test to avoid interference
      const releasedTestExecutor = vi.fn();
      releasedTestExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          subscriber.onData?.(testEvents[0]);
          subscriber.onSuccess?.(testEvents);
          return testEvents;
        }
      );

      // Create and complete a stream with single subscriber first
      const originalSubscriber = { ...mockSubscriber };
      const testCanceler = vi.fn().mockResolvedValue(undefined);

      const { promise: originalPromise } = isolatedManager.subscribe(
        "released-stream",
        originalSubscriber,
        releasedTestExecutor,
        testCanceler
      );

      // Wait for stream to complete (which triggers cleanup)
      await originalPromise;

      // Verify stream was cleaned up after completion
      expect(isolatedManager.isStreamActive("released-stream")).toBe(false);
      expect(isolatedManager.getSubscriberCount("released-stream")).toBe(0);
      expect(releasedTestExecutor).toHaveBeenCalledTimes(1);

      // Now a new subscriber tries to join the released stream - should create new stream
      const newSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onSucceed: vi.fn(),
        onComplete: vi.fn(),
      };

      const { promise: newPromise } = isolatedManager.subscribe(
        "released-stream",
        newSubscriber,
        releasedTestExecutor,
        testCanceler
      );
      const newEvents = await newPromise;

      // Should create a completely new stream execution (2nd call total)
      expect(releasedTestExecutor).toHaveBeenCalledTimes(2); // Once for original, once for new
      expect(newSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(newSubscriber.onData).toHaveBeenCalledWith(testEvents[0]);
      expect(newSubscriber.onSucceed).toHaveBeenCalledWith(testEvents);
      expect(newEvents).toEqual(testEvents);

      // After completion, stream should be cleaned up again (this is expected behavior)
      expect(isolatedManager.isStreamActive("released-stream")).toBe(false);
      expect(isolatedManager.getSubscriberCount("released-stream")).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle executor errors and notify all subscribers", async () => {
      const testError = new Error("Stream execution failed");

      // Use a delay to allow both subscribers to register before error
      let triggerError: (() => void) | undefined;
      const errorTrigger = new Promise<void>((resolve) => {
        triggerError = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          await errorTrigger; // Wait for both subscribers to join
          throw testError;
        }
      );

      const subscriber1 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onSucceed: vi.fn(),
        onComplete: vi.fn(),
      };
      const subscriber2 = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(),
        onSucceed: vi.fn(),
        onComplete: vi.fn(),
      };

      // Start both subscriptions
      const { promise: promise1 } = manager.subscribe(
        "error-stream",
        subscriber1,
        mockExecutor,
        mockCanceler
      );
      const { promise: promise2 } = manager.subscribe(
        "error-stream",
        subscriber2,
        mockExecutor,
        mockCanceler
      );

      // Ensure both subscribers joined
      expect(manager.getSubscriberCount("error-stream")).toBe(2);

      // Trigger the error
      triggerError!();

      // Wait for completion
      await expect(promise1).rejects.toThrow(testError);
      await expect(promise2).rejects.toThrow(testError);

      // Both subscribers should be notified of error
      expect(subscriber1.onError).toHaveBeenCalledWith(testError);
      expect(subscriber2.onError).toHaveBeenCalledWith(testError);
      expect(subscriber1.onComplete).toHaveBeenCalledTimes(1);
      expect(subscriber2.onComplete).toHaveBeenCalledTimes(1);

      // Stream should be cleaned up
      expect(manager.isStreamActive("error-stream")).toBe(false);
    });

    it("should handle subscriber callback errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const faultySubscriber = {
        onStart: vi.fn(() => {
          throw new Error("onStart error");
        }),
        onData: vi.fn(() => {
          throw new Error("onData error");
        }),
        onSucceed: vi.fn(() => {
          throw new Error("onSucceed error");
        }),
      };

      const goodSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onSucceed: vi.fn(),
      };

      const testEvents: TestEvent[] = [
        { id: 1, data: "test", timestamp: 1000 },
      ];

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          subscriber.onData?.(testEvents[0]);
          subscriber.onSuccess?.(testEvents);
          return testEvents;
        }
      );

      const { promise: promise1 } = manager.subscribe(
        "faulty-stream",
        faultySubscriber,
        mockExecutor,
        mockCanceler
      );
      const { promise: promise2 } = manager.subscribe(
        "faulty-stream",
        goodSubscriber,
        mockExecutor,
        mockCanceler
      );

      const [events1, events2] = await Promise.all([promise1, promise2]);

      // Both should complete despite faulty subscriber
      expect(events1).toEqual(testEvents);
      expect(events2).toEqual(testEvents);

      // Good subscriber should work normally
      expect(goodSubscriber.onStart).toHaveBeenCalledTimes(1);
      expect(goodSubscriber.onData).toHaveBeenCalledWith(testEvents[0]);
      expect(goodSubscriber.onSucceed).toHaveBeenCalledWith(testEvents);

      // Console errors should be logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Subscription management", () => {
    it("should handle unsubscribe correctly", async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          return await executorPromise;
        }
      );

      const { unsubscribe } = manager.subscribe(
        "unsubscribe-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );

      expect(manager.getSubscriberCount("unsubscribe-stream")).toBe(1);

      // Unsubscribe
      unsubscribe();

      expect(manager.getSubscriberCount("unsubscribe-stream")).toBe(0);
      expect(manager.isStreamActive("unsubscribe-stream")).toBe(false);

      // Complete the executor (should not affect anything)
      resolveExecutor!([]);
    });

    it("should handle cancel operation", async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          return await executorPromise;
        }
      );

      const { cancel } = manager.subscribe(
        "cancel-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );

      expect(manager.getSubscriberCount("cancel-stream")).toBe(1);

      // Cancel the stream
      await cancel();

      // Should clean up
      expect(manager.getSubscriberCount("cancel-stream")).toBe(0);
      expect(manager.isStreamActive("cancel-stream")).toBe(false);
      expect(mockCanceler).toHaveBeenCalledTimes(1);

      // Complete the executor
      resolveExecutor!([]);
    });

    it("should handle disconnect operation", async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          return await executorPromise;
        }
      );

      const { disconnect } = manager.subscribe(
        "disconnect-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );

      expect(manager.getSubscriberCount("disconnect-stream")).toBe(1);

      // Disconnect (unsubscribe all)
      disconnect();

      expect(manager.getSubscriberCount("disconnect-stream")).toBe(0);
      expect(manager.isStreamActive("disconnect-stream")).toBe(false);

      // Complete the executor
      resolveExecutor!([]);
    });

    it("should handle multiple subscribers unsubscribing", async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          return await executorPromise;
        }
      );

      const subscription1 = manager.subscribe(
        "multi-unsub-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );
      const subscription2 = manager.subscribe(
        "multi-unsub-stream",
        { ...mockSubscriber },
        mockExecutor,
        mockCanceler
      );
      const subscription3 = manager.subscribe(
        "multi-unsub-stream",
        { ...mockSubscriber },
        mockExecutor,
        mockCanceler
      );

      expect(manager.getSubscriberCount("multi-unsub-stream")).toBe(3);

      // Unsubscribe one by one
      subscription1.unsubscribe();
      expect(manager.getSubscriberCount("multi-unsub-stream")).toBe(2);
      expect(manager.isStreamActive("multi-unsub-stream")).toBe(true);

      subscription2.unsubscribe();
      expect(manager.getSubscriberCount("multi-unsub-stream")).toBe(1);
      expect(manager.isStreamActive("multi-unsub-stream")).toBe(true);

      subscription3.unsubscribe();
      expect(manager.getSubscriberCount("multi-unsub-stream")).toBe(0);
      expect(manager.isStreamActive("multi-unsub-stream")).toBe(false);

      // Complete the executor
      resolveExecutor!([]);
    });

    it("should handle errors in subscriber onError callbacks during executor errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const testError = new Error("Stream execution failed");

      const faultyErrorSubscriber = {
        onStart: vi.fn(),
        onData: vi.fn(),
        onError: vi.fn(() => {
          throw new Error("onError callback failed");
        }),
        onSucceed: vi.fn(),
        onComplete: vi.fn(),
      };

      // Use a small delay to ensure proper async execution
      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          await Promise.resolve(); // Let microtasks complete
          throw testError;
        }
      );

      const { promise } = manager.subscribe(
        "faulty-error-stream",
        faultyErrorSubscriber,
        mockExecutor,
        mockCanceler
      );

      // Wait for completion - should handle the onError callback error gracefully
      await expect(promise).rejects.toThrow(testError);

      // Should have logged the subscriber callback error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in subscriber onError:",
        expect.any(Error)
      );

      // Stream should still be cleaned up
      expect(manager.isStreamActive("faulty-error-stream")).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Stream management", () => {
    it("should force close streams", async () => {
      let resolveExecutor: ((events: TestEvent[]) => void) | undefined;
      const executorPromise = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          return await executorPromise;
        }
      );

      manager.subscribe(
        "force-close-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );

      expect(manager.isStreamActive("force-close-stream")).toBe(true);

      manager.closeStream("force-close-stream");

      expect(manager.isStreamActive("force-close-stream")).toBe(false);
      expect(manager.getSubscriberCount("force-close-stream")).toBe(0);

      // Complete the executor
      resolveExecutor!([]);
    });

    it("should close all streams", async () => {
      let resolveExecutor1: ((events: TestEvent[]) => void) | undefined;
      let resolveExecutor2: ((events: TestEvent[]) => void) | undefined;

      const executorPromise1 = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor1 = resolve;
      });

      const executorPromise2 = new Promise<TestEvent[]>((resolve) => {
        resolveExecutor2 = resolve;
      });

      const mockExecutor1 = vi
        .fn()
        .mockImplementation(
          async (
            subscriber: StreamSubscriber<TestEvent>,
            _signal: AbortSignal
          ) => {
            subscriber.onStart?.();
            return await executorPromise1;
          }
        );

      const mockExecutor2 = vi
        .fn()
        .mockImplementation(
          async (
            subscriber: StreamSubscriber<TestEvent>,
            _signal: AbortSignal
          ) => {
            subscriber.onStart?.();
            return await executorPromise2;
          }
        );

      manager.subscribe(
        "stream-1",
        mockSubscriber,
        mockExecutor1,
        mockCanceler
      );
      manager.subscribe(
        "stream-2",
        { ...mockSubscriber },
        mockExecutor2,
        mockCanceler
      );

      expect(manager.isStreamActive("stream-1")).toBe(true);
      expect(manager.isStreamActive("stream-2")).toBe(true);

      manager.closeAllStreams();

      expect(manager.isStreamActive("stream-1")).toBe(false);
      expect(manager.isStreamActive("stream-2")).toBe(false);

      // Complete the executors
      resolveExecutor1!([]);
      resolveExecutor2!([]);
    });
  });

  describe("Edge cases", () => {
    it("should handle concurrent subscriptions to same stream", async () => {
      let startExecutor: (() => void) | undefined;
      const executorStarted = new Promise<void>((resolve) => {
        startExecutor = resolve;
      });

      mockExecutor.mockImplementation(
        async (
          subscriber: StreamSubscriber<TestEvent>,
          _signal: AbortSignal
        ) => {
          subscriber.onStart?.();
          await executorStarted;
          const events = [{ id: 1, data: "concurrent", timestamp: 1000 }];
          subscriber.onData?.(events[0]);
          subscriber.onSuccess?.(events);
          return events;
        }
      );

      // Start multiple subscriptions simultaneously
      const { promise: promise1 } = manager.subscribe(
        "concurrent-stream",
        mockSubscriber,
        mockExecutor,
        mockCanceler
      );
      const { promise: promise2 } = manager.subscribe(
        "concurrent-stream",
        { ...mockSubscriber },
        mockExecutor,
        mockCanceler
      );
      const { promise: promise3 } = manager.subscribe(
        "concurrent-stream",
        { ...mockSubscriber },
        mockExecutor,
        mockCanceler
      );

      // Should only create one executor
      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(manager.getSubscriberCount("concurrent-stream")).toBe(3);

      // Complete the stream
      startExecutor!();

      const results = await Promise.all([promise1, promise2, promise3]);

      // All should get the same result
      results.forEach((events) => {
        expect(events).toEqual([
          { id: 1, data: "concurrent", timestamp: 1000 },
        ]);
      });
    });
  });
});
