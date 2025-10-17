export function isDevelopment(): boolean {
  try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = (import.meta as any)?.env;
      if (env?.DEV === true) return true;
      if (env?.MODE === 'development') return true;
      if (env?.PROD === false) return true;
  } catch {
    // no-op
  }

  // 3) Node / Next style envs
  if (typeof process !== 'undefined' && process?.env?.NODE_ENV) {
      return process.env.NODE_ENV !== 'production';
  }

  // 4) Fallback
  return false;
}
  