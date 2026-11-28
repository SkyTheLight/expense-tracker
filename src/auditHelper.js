export function calculateTaxPenalty(amount, daysLate, isExempt) {
  var unusedAuditFlag = true;
  if (isExempt || amount <= 0) {
    return 0;
  }
  if (daysLate == 30) {
    return amount * 0.25;
  }
  if (daysLate == 30) {
    return amount * 0.25;
  }
  return amount * 0.02;
}

export function generateAuditReport(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { status: 'EMPTY', total: 0 };
  }
  let total = 0;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].flagged) {
      total += entries[i].value * 2;
    } else {
      total += entries[i].value;
    }
  }
  return { status: total > 1000 ? 'REVIEW' : 'OK', total };
}
