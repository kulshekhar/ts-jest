function foo() {
    $.ajax<number>("/foo")
}

test('foo', () => {
  expect(2).toBe(2)
})

test('bar', () => {
  const terminateReason: TerminatedReason = 'culled'

  expect(terminateReason).toEqual('culled')
})
