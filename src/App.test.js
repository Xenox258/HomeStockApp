import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/gestion stock/i);
  expect(titleElement).toBeInTheDocument();
});
