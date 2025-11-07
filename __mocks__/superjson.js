// Mock for superjson to avoid ESM import issues in Jest
module.exports = {
  serialize: (value) => ({ json: value, meta: undefined }),
  deserialize: (payload) => payload.json,
  stringify: (value) => JSON.stringify(value),
  parse: (string) => JSON.parse(string),
  registerClass: () => {},
  registerSymbol: () => {},
  registerCustom: () => {},
  allowErrorProps: () => {},
  default: {
    serialize: (value) => ({ json: value, meta: undefined }),
    deserialize: (payload) => payload.json,
    stringify: (value) => JSON.stringify(value),
    parse: (string) => JSON.parse(string),
  },
}
