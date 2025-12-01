import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TigerTix header', () => {
  render(<App />);
  // target the page heading specifically
  const header = screen.getByRole('heading', { name: /TigerTix/i });
  expect(header).toBeInTheDocument();
});
