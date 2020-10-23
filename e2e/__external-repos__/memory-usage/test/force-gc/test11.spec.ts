import { range } from "lodash";

describe("test11", () => {
  afterAll(() => {
    global.gc();
  })

  test.each(range(0, 100))("%i", () => {
    expect(true).toBe(true);
  });
});
