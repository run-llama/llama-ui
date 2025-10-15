/* eslint-disable @typescript-eslint/no-unused-vars */
interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

class ConsoleLogger implements ILogger {
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  debug(message: string, ...args: any[]) {
    console.debug(`[${this.name}] ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    console.info(`[${this.name}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[${this.name}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[${this.name}] ${message}`, ...args);
  }
}

// TODO: replace to production logger in the future. Or allow caller to inject their own logger.
class NoOpLogger implements ILogger {
  debug(_message: string, ..._args: any[]) {
    // no-op
  }

  info(_message: string, ..._args: any[]) {
    // no-op
  }

  warn(_message: string, ..._args: any[]) {
    // no-op
  }

  error(_message: string, ..._args: any[]) {
    // no-op
  }
}

const isDevelopment = process?.env?.NODE_ENV === "development";

export const logger: ILogger = isDevelopment
  ? new ConsoleLogger("llama-ui")
  : new NoOpLogger();
