module.exports = {
  createClient: jest.fn(() => ({
    authorize: jest.fn(),
    verify: jest.fn(),
    refresh: jest.fn(),
    exchange: jest.fn(),
  })),
}
