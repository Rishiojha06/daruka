import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders application header and title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /weekend ride/i })).toBeInTheDocument();
  });

  it('renders mandatory beta disclaimer', () => {
    render(<App />);
    expect(screen.getByRole('note', { name: /beta disclaimer/i })).toBeInTheDocument();
    expect(screen.getByText(/motorcycle routes and arrival estimates/i)).toBeInTheDocument();
  });
});
