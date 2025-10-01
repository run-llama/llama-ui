import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Run cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock EventSource for Node.js environment (used in streaming tests)
class MockEventSource {
  url: string;
  listeners: Record<string, Set<(e: any) => void>> = {
    message: new Set(),
    error: new Set(),
  };
  static CLOSED = 2;
  readyState = 0;
  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (e: any) => void) {
    this.listeners[type]?.add(cb);
  }

  removeEventListener(type: string, cb: (e: any) => void) {
    this.listeners[type]?.delete(cb);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }
}

// Set global EventSource
(globalThis as any).EventSource = MockEventSource;
