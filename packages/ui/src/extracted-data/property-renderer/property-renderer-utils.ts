export const formatFieldName = (key: string): string => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const isPropertyChanged = (
  changedPaths: Set<string> | undefined,
  keyPath: string[]
): boolean => {
  if (!changedPaths) return false;
  const pathString = keyPath.join(".");
  return changedPaths.has(pathString);
};

export const isArrayOfObjects = (value: unknown[]): boolean => {
  return (
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    !Array.isArray(value[0])
  );
};

export const shouldShowKeyOnSeparateLine = (value: unknown): boolean => {
  return (
    (Array.isArray(value) && isArrayOfObjects(value)) ||
    (typeof value === "object" && value !== null && !Array.isArray(value))
  );
};
