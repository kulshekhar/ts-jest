import { range } from "lodash";

describe("test8", () => {
  test.each(range(0, 100))("%i", () => {
    expect(true).toBe(true);
  });
});
