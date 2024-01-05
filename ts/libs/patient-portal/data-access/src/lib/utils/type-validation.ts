export const isTruthyOrError = <T>(value: T | undefined | null): T => {
  if (!value) {
    throw new Error('expected given value to be truthy');
  }

  return value;
};
