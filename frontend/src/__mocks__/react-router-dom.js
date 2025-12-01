// Minimal mock for react-router-dom used in tests
const React = require('react');

module.exports = {
  BrowserRouter: ({ children }) => React.createElement('div', {}, children),
  Routes: ({ children }) => React.createElement('div', {}, children),
  Route: ({ element }) => React.createElement('div', {}, element),
  Link: ({ children, to }) => React.createElement('a', { href: to || '#' }, children),
  Navigate: ({ to }) => React.createElement('div', {}, `Navigate:${to}`),
  useNavigate: () => () => {},
};
