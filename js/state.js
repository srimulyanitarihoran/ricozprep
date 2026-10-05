// Shared dataset state and small helpers
export const state = { original: null, working: null };

export const isEmpty = (v) => v == null || String(v).trim() === '';
export const rowKey = (row, headers) => headers.map((h) => String(row[h] ?? '')).join('\u241F');
export const cloneDataset = (ds) => ({ headers: [...ds.headers], rows: ds.rows.map((r) => ({ ...r })) });

export function setDataset(headers, rows) {
  state.original = { headers, rows };
  state.working = cloneDataset(state.original);
}

export function resetDataset() {
  if (state.original) state.working = cloneDataset(state.original);
}
