async function fetchJSON(url, options) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function el(sel, root = document) { return root.querySelector(sel); }
function fmtDate(iso) { try { return new Date(iso).toLocaleString(); } catch { return ''; } }

async function loadNotes() {
  const notes = await fetchJSON('/api/notes');
  const list = el('#notes');
  list.innerHTML = '';
  for (const n of notes) {
    const tpl = el('#note-item').content.cloneNode(true);
    const li = tpl.querySelector('.note');
    const title = tpl.querySelector('.note-title');
    const content = tpl.querySelector('.note-content');
    const saveBtn = tpl.querySelector('.save');
    const delBtn = tpl.querySelector('.delete');
    const timestamps = tpl.querySelector('.timestamps');

    title.value = n.title || '';
    content.value = n.content || '';
    timestamps.textContent = `Created: ${fmtDate(n.createdAt)}  |  Updated: ${fmtDate(n.updatedAt)}`;

    saveBtn.addEventListener('click', async () => {
      const updated = await fetchJSON(`/api/notes/${n.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.value, content: content.value })
      });
      timestamps.textContent = `Created: ${fmtDate(updated.createdAt)}  |  Updated: ${fmtDate(updated.updatedAt)}`;
    });

    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this note?')) return;
      await fetchJSON(`/api/notes/${n.id}`, { method: 'DELETE' });
      await loadNotes();
    });

    list.appendChild(tpl);
  }
}

async function addNote() {
  const title = el('#title').value.trim();
  const content = el('#content').value.trim();
  if (!title && !content) return;
  await fetchJSON('/api/notes', { method: 'POST', body: JSON.stringify({ title, content }) });
  el('#title').value = '';
  el('#content').value = '';
  await loadNotes();
}

window.addEventListener('DOMContentLoaded', () => {
  el('#addBtn').addEventListener('click', addNote);
  loadNotes().catch(err => console.error(err));
});
