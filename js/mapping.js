// Field mapping: merge a second dataset into the working one by aligning columns
import { state } from './state.js';

let pendingSource = null; // { headers, rows } from the second file, before mapping is confirmed

export function stageSecondSource(headers, rows) {
  pendingSource = { headers, rows };
}

export function getPendingSource() {
  return pendingSource;
}

export function clearPendingSource() {
  pendingSource = null;
}

// Merge pendingSource into state.working using a mapping: { sourceHeader: targetHeaderOrNull }
// targetHeaderOrNull === null means "add as a new column" using the source header's own name.
export function mergeWithMapping(mapping) {
  const ds = state.working;
  const src = pendingSource;
  if (!ds || !src) return 'Nothing to merge.';

  // Work out every target header this merge will touch, adding new ones to ds.headers
  const usedTargets = new Set();
  Object.entries(mapping).forEach(([sourceHeader, target]) => {
    const finalTarget = target || sourceHeader;
    usedTargets.add(finalTarget);
    if (!ds.headers.includes(finalTarget)) ds.headers.push(finalTarget);
  });

  // Build new rows from the second file, placing each value under its mapped column
  const newRows = src.rows.map((srcRow) => {
    const row = {};
    ds.headers.forEach((h) => { row[h] = ''; });
    Object.entries(mapping).forEach(([sourceHeader, target]) => {
      const finalTarget = target || sourceHeader;
      row[finalTarget] = srcRow[sourceHeader] ?? '';
    });
    return row;
  });

  // Existing rows may be missing brand-new columns — backfill with empty strings
  ds.rows.forEach((row) => { ds.headers.forEach((h) => { if (!(h in row)) row[h] = ''; }); });

  ds.rows = ds.rows.concat(newRows);
  clearPendingSource();
  return `Merged ${newRows.length} rows from the second file into ${usedTargets.size} column(s).`;
}
