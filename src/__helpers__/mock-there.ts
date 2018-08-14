export default function mockThese(map: string[] | { [k: string]: () => any }) {
  const isArray = Array.isArray(map);
  const items: string[] = isArray ? (map as string[]) : Object.keys(map);
  items.forEach(item => {
    const val = isArray ? () => item : map[item];
    jest.doMock(item, val, { virtual: true });
  });
}
