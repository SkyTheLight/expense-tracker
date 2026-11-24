export const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

function parseAmount(amount) {
  if (typeof amount === 'number') {
    return amount;
  }
  if (typeof amount === 'string' && amount.trim() !== '') {
    return Number(amount);
  }
  return Number.NaN;
}

export function validateExpense({ description, amount, category }) {
  if (typeof description !== 'string' || description.trim() === '') {
    return { valid: false, error: 'Description is required.' };
  }

  const numericAmount = parseAmount(amount);
  if (Number.isNaN(numericAmount)) {
    return { valid: false, error: 'Amount must be a number.' };
  }
  if (numericAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero.' };
  }
  if (!CATEGORIES.includes(category)) {
    return { valid: false, error: 'Category is invalid.' };
  }

  return { valid: true, error: null };
}

export function calculateTotal(expenses) {
  return roundCurrency(expenses.reduce((total, expense) => total + expense.amount, 0));
}

export function calculateByCategory(expenses) {
  const totals = {};
  expenses.forEach((expense) => {
    totals[expense.category] = roundCurrency((totals[expense.category] ?? 0) + expense.amount);
  });
  return totals;
}

export function filterByCategory(expenses, category) {
  if (category === 'All') {
    return expenses;
  }
  return expenses.filter((expense) => expense.category === category);
}
