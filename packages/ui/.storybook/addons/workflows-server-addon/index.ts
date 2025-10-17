import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import http from "node:http";

// Local addon preset that augments Vite config to start/stop the external
// Python workflow server alongside Storybook (Vite dev server lifecycle).
//
// Usage in .storybook/main.ts:
// addons: [
//   ..., path.resolve(__dirname, './addons/workflows-server-addon')
// ]

function waitForHealth(url: string, retries = 50, intervalMs = 200): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          clearInterval(timer);
          res.resume();
          resolve();
        } else {
          res.resume();
          if (attempts >= retries) {
            clearInterval(timer);
            reject(new Error(`WorkflowServer health check failed with status ${res.statusCode}`));
          }
        }
      });
      req.on("error", (err) => {
        if (attempts >= retries) {
          clearInterval(timer);
          reject(err);
        }
      });
      req.end();
    }, intervalMs);
  });
}

async function startWorkflowServer() {
  const port = "8000";
  const host = "127.0.0.1";
  const baseUrl = `http://${host}:${port}`;
  const serverDir = path.resolve(__dirname, "../../../..", "server-py");
  console.log(`[workflows-server-addon] Starting WorkflowServer at ${baseUrl}`);
  console.log(`[workflows-server-addon] Server directory: ${serverDir}`);
  let child: ChildProcess | undefined;
  try {
    child = spawn("uv", ["run", "main.py"], {
      cwd: serverDir,
      stdio: "inherit",
      env: { ...process.env, PORT: String(port) },
    });
  } catch (err) {
    throw new Error(`Failed to start WorkflowServer: ${err}`);
  }

  await waitForHealth(`${baseUrl}/health`);
  // eslint-disable-next-line no-console
  console.log(`[workflows-server-addon] Server healthy at ${baseUrl}`);

  const cleanup = () => {
    try {
      if (child && !child.killed) child.kill("SIGTERM");
    } catch {}
  };
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);
  process.once("exit", cleanup);
}

startWorkflowServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`[workflows-server-addon] Failed to start server: ${err?.message || err}`);
  process.exit(1);
});

export default {};


