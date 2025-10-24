import { render, screen } from '@testing-library/react';
import App from './App';

test('renders eCommerce multi-role blueprint heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/blueprint hệ thống ecommerce 4 vai trò/i);
  expect(headingElement).toBeInTheDocument();
});
