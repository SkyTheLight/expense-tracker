import { describe, expect, it } from 'vitest';
import {
  calculateByCategory,
  calculateTotal,
  filterByCategory,
  validateExpense,
} from './expenses.js';

const FOOD = { description: 'Groceries', amount: 120, category: 'Food' };
const TRANSPORT = { description: 'Bus pass', amount: 50, category: 'Transport' };

describe('validateExpense', () => {
  it('accepts a correct expense with a numeric amount', () => {
    expect(validateExpense({ description: 'Groceries', amount: '120', category: 'Food' }))
      .toEqual({ valid: true, error: null });
  });

  it('rejects an empty description', () => {
    const result = validateExpense({ description: '   ', amount: 10, category: 'Food' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/description is required/i);
  });

  it('rejects NaN and missing amounts', () => {
    const notANumber = validateExpense({ description: 'Groceries', amount: 'abc', category: 'Food' });
    const missing = validateExpense({ description: 'Groceries', amount: undefined, category: 'Food' });

    expect(notANumber.valid).toBe(false);
    expect(notANumber.error).toMatch(/amount must be a number/i);
    expect(missing.valid).toBe(false);
    expect(missing.error).toMatch(/amount must be a number/i);
  });

  it('rejects zero and negative amounts', () => {
    const zero = validateExpense({ description: 'Groceries', amount: 0, category: 'Food' });
    const negative = validateExpense({ description: 'Groceries', amount: -5, category: 'Food' });

    expect(zero.valid).toBe(false);
    expect(zero.error).toMatch(/greater than zero/i);
    expect(negative.valid).toBe(false);
    expect(negative.error).toMatch(/greater than zero/i);
  });

  it('rejects an unsupported category', () => {
    const result = validateExpense({ description: 'Groceries', amount: 10, category: 'Unknown' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/category is invalid/i);
  });

  it('treats 0.01 as the smallest valid amount and 0 as invalid', () => {
    expect(validateExpense({ description: 'Coffee', amount: 0.01, category: 'Food' }).valid)
      .toBe(true);
    expect(validateExpense({ description: 'Coffee', amount: 0, category: 'Food' }).valid)
      .toBe(false);
  });
});

describe('calculateTotal', () => {
  it('sums multiple expenses', () => {
    expect(calculateTotal([FOOD, TRANSPORT, { ...FOOD, amount: 30 }])).toBe(200);
  });

  it('returns zero for an empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('rounds floating point sums to cents', () => {
    expect(calculateTotal([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
  });
});

describe('calculateByCategory', () => {
  it('groups and sums mixed categories', () => {
    const expenses = [FOOD, TRANSPORT, { ...FOOD, amount: 30 }];
    expect(calculateByCategory(expenses)).toEqual({ Food: 150, Transport: 50 });
  });

  it('returns an empty object for an empty array', () => {
    expect(calculateByCategory([])).toEqual({});
  });
});

describe('filterByCategory', () => {
  it('returns only expenses from the requested category', () => {
    expect(filterByCategory([FOOD, TRANSPORT], 'Transport')).toEqual([TRANSPORT]);
  });

  it('returns every expense for All', () => {
    const expenses = [FOOD, TRANSPORT];
    expect(filterByCategory(expenses, 'All')).toBe(expenses);
  });
});
