export function exportRowsToPdf(
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const escape = (v: unknown) =>
    String(v ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const headHtml = headers.map((h) => `<th>${escape(h)}</th>`).join('');
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escape(title)}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; color: #7c0613; margin-bottom: 8px; }
  p.meta { font-size: 12px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f3f4f6; }
  tr:nth-child(even) { background: #fafafa; }
  @media print { body { padding: 12px; } }
</style></head><body>
<h1>${escape(title)}</h1>
<p class="meta">Generado: ${new Date().toLocaleString('es-BO')}</p>
<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Permite ventanas emergentes para exportar PDF');
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function formatDateBo(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-BO');
}
