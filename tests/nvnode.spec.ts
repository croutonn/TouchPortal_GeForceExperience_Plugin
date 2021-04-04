import NvNodeClient from '../src/nvnode'

describe('NvNode API Client', () => {
  let nv: NvNodeClient
  beforeAll(() => {
    nv = new NvNodeClient()
    return nv.ready()
  })
  afterAll(() => {
    nv.dispose()
  })

  test('getRecord', async () => {
    const result = await nv.getRecord()
    expect(typeof result).toBe('boolean')
  })
})
