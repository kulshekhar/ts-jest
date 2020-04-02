import { Thing } from "./main";

// See the Thing definition.  Changing the type definition should result in a compile failure here.
export const thing: Thing = { a: 1 };
function doTheThing() {
  return 1 + 2;
}

it("should do the thing", () => {
  expect(doTheThing()).toEqual(3);
});
