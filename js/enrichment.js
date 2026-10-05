// Data enrichment: detect each column's likely type and flag values that don't fit it
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+()\d][\d\s().-]{6,}$/,
  date: /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})$/,
  number: /^-?\d+(\.\d+)?$/,
};

const TYPE_ORDER = ['email', 'date', 'phone', 'number'];

function matches(type, value) {
  return PATTERNS[type].test(String(value).trim());
}

// Looks at every non-empty value in a column and picks the type that fits
// the largest share of them (at least 60%), otherwise calls it plain text.
export function detectColumnType(rows, header) {
  const values = rows.map((r) => r[header]).filter((v) => v != null && String(v).trim() !== '');
  if (!values.length) return { type: 'text', confidence: 0 };

  let best = { type: 'text', confidence: 0 };
  TYPE_ORDER.forEach((type) => {
    const hits = values.filter((v) => matches(type, v)).length;
    const confidence = hits / values.length;
    if (confidence > best.confidence && confidence >= 0.6) best = { type, confidence };
  });
  return best;
}

export function detectAllColumns(ds) {
  const result = {};
  ds.headers.forEach((h) => { result[h] = detectColumnType(ds.rows, h); });
  return result;
}

// For a single cell: is it a mismatch worth flagging, given its column's detected type?
export function isMismatch(value, columnType) {
  if (columnType === 'text' || value == null || String(value).trim() === '') return false;
  return !matches(columnType, value);
}
