// Turns the working dataset into a downloadable CSV
export function downloadCsv(ds, filename = 'ricozprep_cleaned.csv') {
  const csv = window.Papa.unparse({ fields: ds.headers, data: ds.rows.map((r) => ds.headers.map((h) => r[h] ?? '')) });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
