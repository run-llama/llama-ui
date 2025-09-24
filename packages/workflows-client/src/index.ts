/**
 * @llamaindex/workflows-client
 *
 * TypeScript client for LlamaIndex Workflows server.
 *
 * @license MIT
 */

// Re-export everything from generated code
export * from './generated';
export { createClient, createConfig } from './generated/client';
export type { Client, Config } from './generated/client';
export { client } from './generated/client.gen';

// Export version from package.json
export { version as VERSION } from '../package.json';
