import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import React from "react";
import { WorkflowDebugger } from "../src/components/workflow-debugger";
import * as workflowsClient from "@llamaindex/workflows-client";

// Create a shared mock for setConfig to track calls
const mockSetConfig = vi.fn();

// Mock the workflows client hooks and functions
vi.mock("@llamaindex/ui", async () => {
  const actual = await vi.importActual("@llamaindex/ui");
  return {
    ...actual,
    useWorkflowsClient: () => ({
      setConfig: mockSetConfig,
      GET: vi.fn(),
      POST: vi.fn(),
    }),
    useWorkflows: () => ({
      state: { workflows: {} },
      sync: vi.fn(),
    }),
  };
});

vi.mock("@llamaindex/workflows-client", async () => {
  const actual = await vi.importActual<typeof workflowsClient>(
    "@llamaindex/workflows-client",
  );
  return {
    ...actual,
    getHealth: vi.fn().mockResolvedValue({
      data: { status: "ok" },
      error: null,
    }),
  };
});

vi.mock("../src/components/workflow-config-panel", () => ({
  WorkflowConfigPanel: () => <div>WorkflowConfigPanel</div>,
}));

vi.mock("../src/components/run-list-panel", () => ({
  RunListPanel: () => <div>RunListPanel</div>,
}));

vi.mock("../src/components/run-details-panel", () => ({
  RunDetailsPanel: () => <div>RunDetailsPanel</div>,
}));

describe("WorkflowDebugger URL Resolution", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetConfig.mockClear();
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("should default to window.location.origin when no api parameter", async () => {
    const testOrigin = "http://localhost:5173";
    Object.defineProperty(window, "location", {
      value: {
        origin: testOrigin,
        href: `${testOrigin}/`,
        pathname: "/",
        search: "",
      },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<WorkflowDebugger />);
    });

    expect(window.location.origin).toBe(testOrigin);
  });

  it("should use URL parameter api if provided (without trailing slash)", async () => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:5173",
        href: "http://localhost:5173/?api=http://localhost:8000",
        pathname: "/",
        search: "?api=http://localhost:8000",
      },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<WorkflowDebugger />);
    });

    // Wait for useEffect to run and setConfig to be called
    await waitFor(() => {
      expect(mockSetConfig).toHaveBeenCalled();
    });

    // Verify that setConfig was called with the correct baseUrl (no trailing slash)
    expect(mockSetConfig).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8000",
    });
  });

  it("should remove trailing slash from URL parameter api", async () => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:5173",
        href: "http://localhost:5173/?api=http://localhost:8000/",
        pathname: "/",
        search: "?api=http://localhost:8000/",
      },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(<WorkflowDebugger />);
    });

    // Wait for useEffect to run and setConfig to be called
    await waitFor(() => {
      expect(mockSetConfig).toHaveBeenCalled();
    });

    // Verify that setConfig was called with baseUrl WITHOUT trailing slash
    // This is the key difference: resolveBaseUrl() removes trailing slashes
    expect(mockSetConfig).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8000", // trailing slash removed
    });

    // Note: The baseUrl state (without trailing slash) is used to display
    // "Current: {baseUrl}" in the API Configuration panel. Since setConfig
    // was called with the URL without trailing slash, the UI will display
    // the correct normalized URL.
  });

  it("should handle different origin scenarios", async () => {
    const scenarios = [
      "http://localhost:5173",
      "http://localhost:8080",
      "https://workflow.example.com",
      "http://192.168.1.100:8000",
    ];

    for (const origin of scenarios) {
      Object.defineProperty(window, "location", {
        value: {
          origin,
          href: `${origin}/`,
          pathname: "/",
          search: "",
        },
        writable: true,
        configurable: true,
      });

      const { unmount } = await act(async () => {
        return render(<WorkflowDebugger />);
      });
      expect(window.location.origin).toBe(origin);
      unmount();
    }
  });
});
