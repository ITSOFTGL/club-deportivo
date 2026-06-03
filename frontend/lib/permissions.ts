/** Solo Super Admin puede eliminar registros. */
export function canDeleteRecords(role?: string): boolean {
  return role === 'SUPER_ADMIN';
}

/** Suma total de recaudación / ingresos en dashboard y reportes financieros. */
export function canViewRevenueTotals(role?: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'COLLECTOR';
}
