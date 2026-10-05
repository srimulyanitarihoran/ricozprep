// Cleansing actions. Each one edits the dataset and returns a short message.
import { isEmpty, rowKey } from './state.js';

export function removeDuplicates(ds) {
  const seen = new Set();
  const before = ds.rows.length;
  ds.rows = ds.rows.filter((row) => {
    const key = rowKey(row, ds.headers);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return `Removed ${before - ds.rows.length} duplicate rows.`;
}

export function removeEmptyRows(ds) {
  const before = ds.rows.length;
  ds.rows = ds.rows.filter((row) => !ds.headers.every((h) => isEmpty(row[h])));
  return `Removed ${before - ds.rows.length} empty rows.`;
}

export function titleCaseText(ds) {
  let changed = 0;
  ds.rows.forEach((row) =>
    ds.headers.forEach((h) => {
      const v = row[h];
      if (typeof v !== 'string' || !v.trim() || !isNaN(Number(v))) return;
      const fixed = v.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      if (fixed !== v) { row[h] = fixed; changed++; }
    })
  );
  return `Fixed casing in ${changed} cells.`;
}
