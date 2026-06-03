export function getStudentMonthlyFee(student: {
  monthlyFeeOverride?: number | null;
  discountPercent?: number | null;
  category?: { monthlyPrice?: number | null };
  categoryMonthlyPrice?: number;
  effectiveMonthlyFee?: number;
}): number {
  if (student.effectiveMonthlyFee != null) {
    return student.effectiveMonthlyFee;
  }
  const categoryPrice =
    student.category?.monthlyPrice ?? student.categoryMonthlyPrice ?? 0;
  if (student.monthlyFeeOverride != null && student.monthlyFeeOverride > 0) {
    return Math.round(student.monthlyFeeOverride * 100) / 100;
  }
  const discount = student.discountPercent ?? 0;
  if (discount > 0) {
    return Math.round(categoryPrice * (1 - discount / 100) * 100) / 100;
  }
  return Math.round(categoryPrice * 100) / 100;
}
