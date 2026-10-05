// Reads a CSV or Excel file and resolves { headers, rows }
export function parseFile(file) {
  const name = file.name.toLowerCase();

  return new Promise((resolve, reject) => {
    if (name.endsWith('.csv')) {
      window.Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve({ headers: res.meta.fields || [], rows: res.data }),
        error: reject,
      });
    } else if (/\.xlsx?$/.test(name)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        resolve({ headers: rows.length ? Object.keys(rows[0]) : [], rows });
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Please upload a .csv, .xlsx or .xls file.'));
    }
  });
}
