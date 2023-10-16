export function isTypeOfOne<T>(
  value: unknown,
  ...options: (new (...args: any[]) => T)[]
): value is T {
  return options.some((option) => value instanceof option);
}
