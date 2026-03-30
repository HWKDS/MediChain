import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MediChain header', () => {
  render(<App />);
  const headerElement = screen.getByText(/MediChain/i);
  expect(headerElement).toBeInTheDocument();
});
