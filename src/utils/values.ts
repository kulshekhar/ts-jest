// to avoid dependencies we have our own Object.values()
export default function values<T>(obj: Record<any, T>): T[] {
  return Object.keys(obj).reduce(
    (array, key) => [...array, obj[key]],
    [] as T[],
  );
}
