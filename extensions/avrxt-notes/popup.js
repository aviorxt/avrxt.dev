const API_BASE = 'https://www.avrxt.dev';
const $ = (id) => document.getElementById(id);
const connectView = $('connect-view'); const captureView = $('capture-view');
let currentTab = { title: '', url: '', selection: '' };

function setStatus(id, message, tone = '') { const target = $(id); target.textContent = message; target.className = `status ${tone}`; }
function show(connected) { connectView.hidden = connected; captureView.hidden = !connected; $('settings').hidden = !connected; }
function readableError(error) { return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.'; }

async function selectedText(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: () => window.getSelection()?.toString() || '' });
    return typeof result === 'string' ? result : '';
  } catch { return ''; }
}

async function loadTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab.title = tab?.title || ''; currentTab.url = /^https?:/.test(tab?.url || '') ? tab.url : '';
  currentTab.selection = tab?.id ? await selectedText(tab.id) : '';
  $('source-title').textContent = currentTab.title || 'Current browser tab';
  $('title').value = currentTab.title || '';
}

async function connect() {
  $('connect').disabled = true; setStatus('connect-status', 'Opening secure Discord connection…');
  try {
    const redirectUri = chrome.identity.getRedirectURL('avrxt-notes');
    const url = new URL('/api/notes-extension/authorize', API_BASE); url.searchParams.set('redirect_uri', redirectUri);
    const result = await chrome.identity.launchWebAuthFlow({ url: url.toString(), interactive: true });
    const token = result ? new URL(result).searchParams.get('token') : null;
    if (!token) throw new Error('AVRXT did not return an extension session.');
    await chrome.storage.local.set({ avrxtNotesToken: token }); show(true); await loadTab();
  } catch (error) { setStatus('connect-status', readableError(error), 'error'); }
  finally { $('connect').disabled = false; }
}

async function save() {
  const { avrxtNotesToken: token } = await chrome.storage.local.get('avrxtNotesToken');
  if (!token) { show(false); return; }
  $('save').disabled = true; setStatus('save-status', 'Saving note…');
  try {
    const response = await fetch(`${API_BASE}/api/notes-extension`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: $('title').value, content: $('content').value, folderId: $('folder').value, tags: $('tags').value.split(',').map((tag) => tag.trim()).filter(Boolean), isPinned: $('pin').checked, pageTitle: currentTab.title, pageUrl: currentTab.url, selection: currentTab.selection }) });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) { await chrome.storage.local.remove('avrxtNotesToken'); show(false); throw new Error('Your session expired. Connect again to continue.'); }
    if (!response.ok) throw new Error(body.error === 'NOTE_CAPTURE_FAILED' ? 'AVRXT could not save this note.' : body.error || 'Could not save this note.');
    setStatus('save-status', 'Saved to AVRXT Notes.', 'success'); $('content').value = '';
  } catch (error) { setStatus('save-status', readableError(error), 'error'); }
  finally { $('save').disabled = false; }
}

$('connect').addEventListener('click', () => void connect()); $('save').addEventListener('click', () => void save());
$('settings').addEventListener('click', async () => { await chrome.storage.local.remove('avrxtNotesToken'); show(false); setStatus('connect-status', 'Disconnected from this browser.'); });
(async () => { const { avrxtNotesToken } = await chrome.storage.local.get('avrxtNotesToken'); show(Boolean(avrxtNotesToken)); if (avrxtNotesToken) await loadTab(); })();
