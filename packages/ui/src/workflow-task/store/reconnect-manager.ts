export type TaskStatus = "running" | "complete" | "failed" | undefined;

export interface SchedulerHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id: any;
}

export interface Scheduler {
  schedule(fn: () => void, delayMs: number): SchedulerHandle;
  cancel(handle: SchedulerHandle | null | undefined): void;
}

export interface ReconnectManagerOptions {
  scheduler: Scheduler;
  getTaskStatus: (taskId: string) => TaskStatus;
  isSubscribed: (taskId: string) => boolean;
  onSubscribe: (taskId: string) => void;
  baseMs?: number;
  maxMs?: number;
}

export function computeBackoffDelayMs(
  attempt: number,
  baseMs: number = 500,
  maxMs: number = 30000
): number {
  const n = Math.max(1, Math.floor(attempt));
  const delay = baseMs * 2 ** (n - 1);
  return Math.min(delay, maxMs);
}

export function isIgnorableStreamError(error: Error): boolean {
  if (error.name === "AbortError") return true;
  if (error.name === "TypeError" && error.message.includes("network error")) {
    return true;
  }
  if (error.message.includes("Stream aborted")) return true;
  return false;
}

interface RetryStateEntry {
  attempt: number;
  handle: SchedulerHandle | null;
}

export class ReconnectManager {
  private readonly scheduler: Scheduler;
  private readonly getTaskStatus: (taskId: string) => TaskStatus;
  private readonly isSubscribed: (taskId: string) => boolean;
  private readonly onSubscribe: (taskId: string) => void;
  private readonly baseMs: number;
  private readonly maxMs: number;

  private readonly retryState = new Map<string, RetryStateEntry>();

  constructor(options: ReconnectManagerOptions) {
    this.scheduler = options.scheduler;
    this.getTaskStatus = options.getTaskStatus;
    this.isSubscribed = options.isSubscribed;
    this.onSubscribe = options.onSubscribe;
    this.baseMs = options.baseMs ?? 500;
    this.maxMs = options.maxMs ?? 30000;
  }

  clear(taskId: string): void {
    const entry = this.retryState.get(taskId);
    if (entry?.handle) {
      this.scheduler.cancel(entry.handle);
    }
    this.retryState.delete(taskId);
  }

  reset(taskId: string): void {
    const entry = this.retryState.get(taskId) ?? { attempt: 0, handle: null };
    // Cancel any pending attempt when resetting
    if (entry.handle) {
      this.scheduler.cancel(entry.handle);
    }
    this.retryState.set(taskId, { attempt: 0, handle: null });
  }

  handleStreamStart(taskId: string): void {
    this.reset(taskId);
  }

  handleStreamFinish(taskId: string): void {
    this.clear(taskId);
  }

  handleStreamError(taskId: string, error: Error): boolean {
    if (isIgnorableStreamError(error)) {
      return false;
    }
    const status = this.getTaskStatus(taskId);
    if (status !== "running") {
      // Not running anymore; caller should mark failure if desired
      this.clear(taskId);
      return false;
    }
    this.scheduleNext(taskId);
    return true;
  }

  scheduleNext(taskId: string): void {
    const status = this.getTaskStatus(taskId);
    if (status !== "running") return;
    if (this.isSubscribed(taskId)) return;

    const current = this.retryState.get(taskId) ?? { attempt: 0, handle: null };
    if (current.handle) {
      this.scheduler.cancel(current.handle);
    }

    const nextAttempt = current.attempt + 1;
    const delay = computeBackoffDelayMs(nextAttempt, this.baseMs, this.maxMs);

    const handle = this.scheduler.schedule(() => {
      // If already subscribed, no-op
      if (this.isSubscribed(taskId)) return;

      try {
        this.onSubscribe(taskId);
      } catch (err) {
        // Swallow to avoid crashing scheduler; next tick will be rescheduled separately if desired
      }
    }, delay);

    this.retryState.set(taskId, { attempt: nextAttempt, handle });
  }
}

