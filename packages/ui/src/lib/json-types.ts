/**
 * Shared JSON types used across the UI package
 */

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JsonObject
  | JSONValue[];

// Extended JSON-like shapes used internally in UI layer
export type PrimitiveValue = string | number | boolean | null | undefined;
export type JsonValue = JSONValue | PrimitiveValue | JsonValue[] | object;
export type JsonObject = { [k: string]: JsonValue };
export type JsonShape<T> = { [K in keyof T]: JsonValue };
