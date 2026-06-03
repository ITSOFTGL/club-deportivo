/** Tarifa mensual efectiva del alumno (override o categoría con descuento %). */
export function getStudentMonthlyFee(student: {
  monthlyFeeOverride?: number | null;
  discountPercent?: number | null;
  category?: { monthlyPrice?: number | null } | null;
}): number {
  const base =
    student.monthlyFeeOverride != null && student.monthlyFeeOverride > 0
      ? student.monthlyFeeOverride
      : (student.category?.monthlyPrice ?? 0);
  const discount = student.discountPercent ?? 0;
  if (
    student.monthlyFeeOverride == null &&
    discount > 0
  ) {
    return Math.round(base * (1 - discount / 100) * 100) / 100;
  }
  return Math.round(base * 100) / 100;
}
