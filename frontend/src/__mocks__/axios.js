// Minimal axios mock for Jest to avoid parsing ESM axios package
const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  defaults: { withCredentials: false },
};

module.exports = mockAxios;
