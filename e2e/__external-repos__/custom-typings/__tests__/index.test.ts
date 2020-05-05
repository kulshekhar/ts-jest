import $ from "jquery"

function foo() {
    $.ajax<number>("/foo")
}

test("foo", () => {
  expect(2).toBe(2)
})
