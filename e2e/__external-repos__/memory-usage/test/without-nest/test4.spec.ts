import { range } from "lodash";

describe("test4", () => {
  test.each(range(0, 100))("%i", () => {
    expect(true).toBe(true);
  });
});
