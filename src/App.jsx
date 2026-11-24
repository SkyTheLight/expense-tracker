import { useRef, useState } from 'react';
import {
  CATEGORIES,
  calculateByCategory,
  calculateTotal,
  filterByCategory,
  validateExpense,
} from './expenses.js';
import './App.css';

const EMPTY_FORM = { description: '', amount: '', category: 'Food' };
const CATEGORY_OPTIONS = CATEGORIES.map((category) => (
  <option key={category} value={category}>{category}</option>
));

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState(null);
  const nextId = useRef(1);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validation = validateExpense(form);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const newExpense = {
      id: nextId.current,
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
    };
    nextId.current += 1;
    setExpenses((current) => [...current, newExpense]);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const handleDelete = (id) => {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
  };

  const total = calculateTotal(expenses);
  const subtotalEntries = Object.entries(calculateByCategory(expenses));
  const visibleExpenses = filterByCategory(expenses, filter);

  return (
    <main className="app">
      <h1>Expense Tracker</h1>

      <section className="card" aria-labelledby="add-heading">
        <h2 id="add-heading">Add an expense</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              name="description"
              type="text"
              value={form.description}
              onChange={handleFieldChange}
            />
          </div>
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={handleFieldChange}
            />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleFieldChange}>
              {CATEGORY_OPTIONS}
            </select>
          </div>
          <button type="submit">Add expense</button>
          {error !== null && <p className="error" role="alert">{error}</p>}
        </form>
      </section>

      <section className="card" aria-labelledby="summary-heading">
        <h2 id="summary-heading">Summary</h2>
        <p className="total">Total spent: <strong>{formatCurrency(total)}</strong></p>
        {subtotalEntries.length > 0 && (
          <ul className="subtotals">
            {subtotalEntries.map(([category, subtotal]) => (
              <li key={category}>{category}: {formatCurrency(subtotal)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="list-heading">
        <h2 id="list-heading">Expenses</h2>
        <div className="field">
          <label htmlFor="filter">Filter by category</label>
          <select id="filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="All">All</option>
            {CATEGORY_OPTIONS}
          </select>
        </div>
        {visibleExpenses.length === 0 ? (
          <p className="empty">No expenses yet.</p>
        ) : (
          <ul className="expense-list">
            {visibleExpenses.map((expense) => (
              <li key={expense.id}>
                <span className="description">{expense.description}</span>
                <span className="category">{expense.category}</span>
                <span className="amount">{formatCurrency(expense.amount)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  aria-label={`Delete ${expense.description}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
