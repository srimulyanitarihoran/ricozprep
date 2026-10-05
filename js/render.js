// Everything that draws to the page
import { isEmpty, rowKey } from './state.js';

const $ = (id) => document.getElementById(id);
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function analyse(ds) {
  const seen = new Set();
  let emptyCells = 0;
  const dupFlags = ds.rows.map((row) => {
    ds.headers.forEach((h) => { if (isEmpty(row[h])) emptyCells++; });
    const key = rowKey(row, ds.headers);
    const isDup = seen.has(key);
    seen.add(key);
    return isDup;
  });
  return { emptyCells, dupFlags, dupCount: dupFlags.filter(Boolean).length };
}

export function renderAll(ds, columnTypes) {
  const { emptyCells, dupFlags, dupCount } = analyse(ds);
  const stat = (n, label, warn) => `<div><b class="${warn && n ? 'warn' : ''}">${n}</b><span>${label}</span></div>`;

  $('summary').innerHTML =
    stat(ds.rows.length, 'Rows') + stat(ds.headers.length, 'Columns') +
    stat(emptyCells, 'Empty cells', true) + stat(dupCount, 'Duplicate rows', true);

  $('table-head').innerHTML = ds.headers.map((h) => {
    const info = columnTypes && columnTypes[h];
    const badge = info && info.type !== 'text' ? ` <span class="type-badge type-${info.type}">${info.type}</span>` : '';
    return `<th>${escapeHtml(h)}${badge}</th>`;
  }).join('');

  $('table-body').innerHTML = ds.rows.slice(0, 200).map((row, i) =>
    `<tr class="${dupFlags[i] ? 'dup' : ''}">` +
    ds.headers.map((h) => {
      if (isEmpty(row[h])) return '<td class="empty">empty</td>';
      const info = columnTypes && columnTypes[h];
      const mismatch = info && info.mismatchCheck && info.mismatchCheck(row[h]);
      return `<td class="${mismatch ? 'mismatch' : ''}">${escapeHtml(String(row[h]))}</td>`;
    }).join('') +
    '</tr>'
  ).join('');
}

export const showApp = () => { $('tool-app').style.display = 'block'; };
export const setLog = (msg) => { $('log').textContent = msg; };

// Draws one dropdown row per column in the newly uploaded second file,
// letting the user pick which existing column it matches (or add it as new).
export function renderMappingRows(sourceHeaders, targetHeaders) {
  $('mapping-app').style.display = 'block';
  $('mapping-body').innerHTML = sourceHeaders.map((sh, i) => {
    const options = ['<option value="">— Add as new column —</option>']
      .concat(targetHeaders.map((th) => {
        const guess = th.toLowerCase() === sh.toLowerCase() ? ' selected' : '';
        return `<option value="${escapeHtml(th)}"${guess}>${escapeHtml(th)}</option>`;
      }));
    return `<tr><td>${escapeHtml(sh)}</td><td><select data-source="${escapeHtml(sh)}" id="map-${i}">${options.join('')}</select></td></tr>`;
  }).join('');
}

export function readMapping(sourceHeaders) {
  const mapping = {};
  sourceHeaders.forEach((sh, i) => {
    const el = document.getElementById(`map-${i}`);
    mapping[sh] = el && el.value ? el.value : null;
  });
  return mapping;
}
