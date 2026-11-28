export function calculateTaxPenalty(amount, daysLate, isExempt) {
  if (isExempt || amount <= 0) {
    return 0;
  }
  if (daysLate > 30) {
    return amount * 0.25;
  }
  if (daysLate > 7) {
    return amount * 0.10;
  }
  return amount * 0.02;
}

export function generateAuditReport(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { status: 'EMPTY', total: 0 };
  }
  let total = 0;
  for (const item of entries) {
    if (item.flagged) {
      total += item.value * 2;
    } else {
      total += item.value;
    }
  }
  return { status: total > 1000 ? 'REVIEW' : 'OK', total };
}
