const CLUB_LOGO_PATH = '/images/club/logocañito.png';
const CLUB_NAME = 'Club Deportivo';

export function exportRowsToPdf(
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  subtitle?: string,
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

  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}${CLUB_LOGO_PATH}`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><title>${escape(title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, Arial, sans-serif;
    padding: 28px 32px;
    color: #1a1a1a;
    background: #fff;
    max-width: 1100px;
    margin: 0 auto;
  }
  .report-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 3px solid #7c0613;
  }
  .report-header img {
    height: 72px;
    width: auto;
    object-fit: contain;
  }
  .report-header .titles h1 {
    font-size: 22px;
    color: #7c0613;
    margin: 0 0 4px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .report-header .titles .club {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #666;
    margin: 0;
  }
  .report-header .titles .meta {
    font-size: 12px;
    color: #888;
    margin: 6px 0 0;
  }
  .subtitle {
    font-size: 13px;
    color: #444;
    background: #faf5f5;
    border-left: 4px solid #7c0613;
    padding: 10px 14px;
    margin-bottom: 18px;
    border-radius: 0 6px 6px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border-radius: 8px;
    overflow: hidden;
  }
  thead th {
    background: linear-gradient(180deg, #7c0613 0%, #5a040e 100%);
    color: #fff;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.04em;
    padding: 10px 12px;
    text-align: left;
    border: none;
  }
  tbody td {
    border: 1px solid #e8e8e8;
    padding: 8px 12px;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody tr:hover { background: #fff8f8; }
  .footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #eee;
    font-size: 10px;
    color: #999;
    text-align: center;
  }
  @media print {
    body { padding: 12px 16px; }
    .report-header img { height: 60px; }
    table { box-shadow: none; }
    tbody tr:hover { background: inherit; }
  }
</style></head><body>
<header class="report-header">
  <img src="${logoUrl}" alt="${escape(CLUB_NAME)}" onerror="this.style.display='none'"/>
  <div class="titles">
    <p class="club">${escape(CLUB_NAME)}</p>
    <h1>${escape(title)}</h1>
    <p class="meta">Generado: ${new Date().toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })}</p>
  </div>
</header>
${subtitle ? `<p class="subtitle">${escape(subtitle)}</p>` : ''}
<table>
  <thead><tr>${headHtml}</tr></thead>
  <tbody>${bodyHtml || `<tr><td colspan="${headers.length}">Sin registros</td></tr>`}</tbody>
</table>
<p class="footer">Documento interno · ${escape(CLUB_NAME)}</p>
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

export function exportRowsToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const escapeCell = (v: unknown) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function formatDateBo(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-BO');
}

export function formatTimeBo(value?: string | Date | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 5);
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

/** Presente / tardanza → vino; ausente → no vino */
export function attendanceCameLabel(status?: string) {
  if (status === 'PRESENT' || status === 'LATE') return 'Sí';
  if (status === 'ABSENT') return 'No';
  return '—';
}
