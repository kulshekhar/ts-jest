import { range } from "lodash";

describe("test12", () => {
  test.each(range(0, 100))("%i", () => {
    expect(true).toBe(true);
  });
});
