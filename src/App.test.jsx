import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Mock HomePage to avoid complex rendering
jest.mock('../src/pages/home/HomePage.jsx', () => {
  return function MockHomePage() {
    return <div data-testid="home-page">Home Page Component</div>;
  };
});

describe('App', () => {
  test('renderiza sem erros', () => {
    render(<App />);
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('tem estrutura correta', () => {
    const { container } = render(<App />);
    
    expect(container.firstChild).toHaveClass('App');
  });

  test('renderiza HomePage como componente principal', () => {
    render(<App />);
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('Home Page Component')).toBeInTheDocument();
  });
});