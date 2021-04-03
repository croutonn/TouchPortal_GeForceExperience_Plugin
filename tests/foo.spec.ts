import foo from '../src/foo'

describe('Foo', () => {
  it('Should return output correctly', () => {
    const result = foo(false)
    expect(result).toBe(true)
  })
})
