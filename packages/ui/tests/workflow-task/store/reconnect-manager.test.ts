import { describe, it, expect, beforeEach } from "vitest";
import {
  ReconnectManager,
  type Scheduler,
  type SchedulerHandle,
  computeBackoffDelayMs,
  isIgnorableStreamError,
} from "../../../src/workflow-task/store/reconnect-manager";

class FakeScheduler implements Scheduler {
  private now = 0;
  private queue: Array<{ at: number; fn: () => void; handle: SchedulerHandle & { canceled?: boolean } }> = [];

  schedule(fn: () => void, delayMs: number): SchedulerHandle {
    const handle: SchedulerHandle & { canceled?: boolean } = { id: Symbol("h") };
    this.queue.push({ at: this.now + Math.max(0, delayMs), fn, handle });
    // Keep queue ordered by time
    this.queue.sort((a, b) => a.at - b.at);
    return handle;
  }

  cancel(handle: SchedulerHandle | null | undefined): void {
    if (!handle) return;
    // Mark canceled; we'll skip on run
    const entry = this.queue.find((q) => q.handle === handle);
    if (entry) entry.handle.canceled = true;
  }

  advanceBy(ms: number): void {
    const target = this.now + ms;
    // Drain tasks up to target time
    while (true) {
      // Find earliest task not after target
      const idx = this.queue.findIndex((q) => q.at <= target);
      if (idx === -1) break;
      const [task] = this.queue.splice(idx, 1);
      this.now = task.at;
      if (!task.handle.canceled) {
        task.fn();
      }
    }
    this.now = target;
  }
}

describe("ReconnectManager", () => {
  let scheduler: FakeScheduler;
  let statusMap: Map<string, "running" | "complete" | "failed">;
  let activeSubs: Set<string>;
  let subscribed: string[];

  beforeEach(() => {
    scheduler = new FakeScheduler();
    statusMap = new Map();
    activeSubs = new Set();
    subscribed = [];
  });

  const makeManager = () =>
    new ReconnectManager({
      scheduler,
      getTaskStatus: (id) => statusMap.get(id),
      isSubscribed: (id) => activeSubs.has(id),
      onSubscribe: (id) => {
        subscribed.push(id);
        activeSubs.add(id);
      },
      baseMs: 100,
      maxMs: 5000,
    });

  it("computes exponential backoff with cap", () => {
    expect(computeBackoffDelayMs(1, 100, 1000)).toBe(100);
    expect(computeBackoffDelayMs(2, 100, 1000)).toBe(200);
    expect(computeBackoffDelayMs(3, 100, 1000)).toBe(400);
    expect(computeBackoffDelayMs(4, 100, 1000)).toBe(800);
    expect(computeBackoffDelayMs(5, 100, 1000)).toBe(1000);
    expect(computeBackoffDelayMs(10, 100, 1000)).toBe(1000);
  });

  it("identifies ignorable stream errors", () => {
    expect(isIgnorableStreamError(new Error("Stream aborted by user"))).toBe(true);
    const abortError = new Error("whatever");
    abortError.name = "AbortError";
    expect(isIgnorableStreamError(abortError)).toBe(true);
    const typeError = new Error("some network error occurred");
    typeError.name = "TypeError";
    expect(isIgnorableStreamError(typeError)).toBe(true);
    expect(isIgnorableStreamError(new Error("Other error"))).toBe(false);
  });

  it("schedules reconnect when running and not subscribed", () => {
    const m = makeManager();
    statusMap.set("t1", "running");

    const scheduled = m.handleStreamError("t1", new Error("boom"));
    expect(scheduled).toBe(true);

    // Initially not subscribed
    expect(activeSubs.has("t1")).toBe(false);

    // Advance 100ms (attempt 1)
    scheduler.advanceBy(100);
    expect(activeSubs.has("t1")).toBe(true);
    expect(subscribed).toEqual(["t1"]);
  });

  it("does not schedule when task is not running", () => {
    const m = makeManager();
    statusMap.set("t2", "failed");
    const scheduled = m.handleStreamError("t2", new Error("boom"));
    expect(scheduled).toBe(false);
    scheduler.advanceBy(1000);
    expect(subscribed).toEqual([]);
  });

  it("increases delay with attempts and respects clear/reset", () => {
    const m = makeManager();
    statusMap.set("t3", "running");

    // first error schedules at 100ms
    m.handleStreamError("t3", new Error("e1"));
    scheduler.advanceBy(99);
    expect(subscribed).toEqual([]);
    scheduler.advanceBy(1);
    expect(subscribed).toEqual(["t3"]);

    // unsubscribe scenario: clear and mark unsubscribed
    m.handleStreamFinish("t3");
    activeSubs.delete("t3");
    statusMap.set("t3", "running");

    // second error should schedule at 200ms (attempt 2)
    m.handleStreamError("t3", new Error("e2"));
    scheduler.advanceBy(199);
    expect(subscribed).toEqual(["t3"]);
    scheduler.advanceBy(1);
    expect(subscribed).toEqual(["t3", "t3"]);

    // onStart should reset attempts back to 0
    m.handleStreamStart("t3");
    activeSubs.delete("t3");

    // next error after reset returns to 100ms
    m.handleStreamError("t3", new Error("e3"));
    scheduler.advanceBy(100);
    expect(subscribed).toEqual(["t3", "t3", "t3"]);
  });

  it("ignorable errors do not schedule", () => {
    const m = makeManager();
    statusMap.set("t4", "running");
    const e = new Error("Stream aborted");
    const scheduled = m.handleStreamError("t4", e);
    expect(scheduled).toBe(false);
    scheduler.advanceBy(1000);
    expect(subscribed).toEqual([]);
  });
});

