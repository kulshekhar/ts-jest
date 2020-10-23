import { range } from "lodash";

describe("test9", () => {
  afterAll(() => {
    global.gc();
  })

  test.each(range(0, 100))("%i", () => {
    expect(true).toBe(true);
  });
});
