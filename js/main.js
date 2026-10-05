// Entry point: connects the page controls to the modules
import { state, setDataset, resetDataset } from './state.js';
import { parseFile } from './parser.js';
import { removeDuplicates, removeEmptyRows, titleCaseText } from './cleaners.js';
import { renderAll, showApp, setLog, renderMappingRows, readMapping } from './render.js';
import { downloadCsv } from './exporter.js';
import { stageSecondSource, getPendingSource, mergeWithMapping } from './mapping.js';
import { detectAllColumns, isMismatch } from './enrichment.js';
import { initAuthModal } from './auth.js';

initAuthModal();

const $ = (id) => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('file-input');
const dropzone2 = $('dropzone2');
const fileInput2 = $('file-input-2');

// Re-detects column types on every render, so new/merged columns get picked up too
function render() {
  const detected = detectAllColumns(state.working);
  const columnTypes = {};
  Object.entries(detected).forEach(([header, info]) => {
    columnTypes[header] = { ...info, mismatchCheck: (v) => isMismatch(v, info.type) };
  });
  renderAll(state.working, columnTypes);
}

async function handleFile(file) {
  try {
    const { headers, rows } = await parseFile(file);
    setDataset(headers, rows);
    showApp();
    render();
    setLog(`Loaded ${rows.length} rows and ${headers.length} columns.`);
  } catch (err) {
    alert(err.message || 'Could not read that file.');
  }
}

function runAction(action) {
  if (!state.working) return;
  setLog(action(state.working));
  render();
}

// Upload
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => e.target.files[0] && handleFile(e.target.files[0]));
['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', (e) => e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]));

// Toolbar
$('btn-dedupe').addEventListener('click', () => runAction(removeDuplicates));
$('btn-empty').addEventListener('click', () => runAction(removeEmptyRows));
$('btn-case').addEventListener('click', () => runAction(titleCaseText));
$('btn-reset').addEventListener('click', () => runAction(() => { resetDataset(); return 'Reset to the original data.'; }));
$('btn-download').addEventListener('click', () => state.working && downloadCsv(state.working));

// Second-file upload, for field mapping
async function handleSecondFile(file) {
  try {
    const { headers, rows } = await parseFile(file);
    stageSecondSource(headers, rows);
    renderMappingRows(headers, state.working.headers);
  } catch (err) {
    alert(err.message || 'Could not read that file.');
  }
}

dropzone2.addEventListener('click', () => fileInput2.click());
fileInput2.addEventListener('change', (e) => e.target.files[0] && handleSecondFile(e.target.files[0]));
['dragenter', 'dragover'].forEach((ev) => dropzone2.addEventListener(ev, (e) => { e.preventDefault(); dropzone2.classList.add('drag'); }));
['dragleave', 'drop'].forEach((ev) => dropzone2.addEventListener(ev, (e) => { e.preventDefault(); dropzone2.classList.remove('drag'); }));
dropzone2.addEventListener('drop', (e) => e.dataTransfer.files[0] && handleSecondFile(e.dataTransfer.files[0]));

$('btn-merge').addEventListener('click', () => {
  const src = getPendingSource();
  if (!src) return;
  const mapping = readMapping(src.headers);
  setLog(mergeWithMapping(mapping));
  render();
  $('mapping-app').style.display = 'none';
});
