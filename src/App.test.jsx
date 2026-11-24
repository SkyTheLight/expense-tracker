import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App.jsx';

afterEach(cleanup);

function addExpense({ description, amount, category = 'Food' }) {
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: description } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: category } });
  fireEvent.click(screen.getByRole('button', { name: 'Add expense' }));
}

describe('Expense Tracker UI', () => {
  it('adds an expense and shows the correct total', () => {
    render(<App />);

    addExpense({ description: 'Groceries', amount: '120.50' });

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$120.50');
    expect(screen.getByText(/food:/i)).toHaveTextContent('$120.50');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  it('shows the correct per-category subtotals', () => {
    render(<App />);

    addExpense({ description: 'Groceries', amount: '120', category: 'Food' });
    addExpense({ description: 'Bus pass', amount: '50', category: 'Transport' });
    addExpense({ description: 'Dinner', amount: '30', category: 'Food' });

    expect(screen.getByText(/food:/i)).toHaveTextContent('$150.00');
    expect(screen.getByText(/transport:/i)).toHaveTextContent('$50.00');
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$200.00');
  });

  it('shows an error for invalid input and clears it after a valid submission', () => {
    render(<App />);

    addExpense({ description: '', amount: '10' });
    expect(screen.getByRole('alert')).toHaveTextContent(/description is required/i);
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$0.00');

    addExpense({ description: 'Coffee', amount: '0' });
    expect(screen.getByRole('alert')).toHaveTextContent(/greater than zero/i);
    expect(screen.queryByText('Coffee')).not.toBeInTheDocument();

    addExpense({ description: 'Coffee', amount: '5' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$5.00');
  });

  it('deletes an expense and recalculates the summary', () => {
    render(<App />);

    addExpense({ description: 'Coffee', amount: '5' });
    addExpense({ description: 'Train', amount: '20', category: 'Transport' });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Coffee' }));

    expect(screen.queryByText('Coffee')).not.toBeInTheDocument();
    expect(screen.getByText('Train')).toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$20.00');
    expect(screen.queryByText(/food:/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Train' }));

    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$0.00');
  });

  it('filters the list by category and restores it with All', () => {
    render(<App />);

    addExpense({ description: 'Groceries', amount: '120', category: 'Food' });
    addExpense({ description: 'Bus pass', amount: '50', category: 'Transport' });

    fireEvent.change(screen.getByLabelText('Filter by category'), { target: { value: 'Transport' } });

    expect(screen.getByText('Bus pass')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
    expect(screen.getByText(/total spent/i)).toHaveTextContent('$170.00');
    expect(screen.getByText(/food:/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filter by category'), { target: { value: 'All' } });

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Bus pass')).toBeInTheDocument();
  });
});
