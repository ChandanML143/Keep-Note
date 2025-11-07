const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;


const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'notes.json');
const PUBLIC_DIR = path.join(__dirname, 'public');


app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));


function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ notes: [] }, null, 2));
  }
}

function readNotes() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.notes) ? parsed.notes : [];
  } catch (e) {
    return [];
  }
}

function writeNotes(notes) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ notes }, null, 2));
}

function genId() {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  );
}


app.get('/api/notes', (req, res) => {
  const notes = readNotes();
  res.json(notes);
});

app.post('/api/notes', (req, res) => {
  const { title = '', content = '' } = req.body || {};
  if (!title && !content) {
    return res.status(400).json({ error: 'Title or content required' });
  }
  const notes = readNotes();
  const note = { id: genId(), title, content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  notes.unshift(note);
  writeNotes(notes);
  res.status(201).json(note);
});

app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body || {};
  const notes = readNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  const updated = { ...notes[idx], title: title ?? notes[idx].title, content: content ?? notes[idx].content, updatedAt: new Date().toISOString() };
  notes[idx] = updated;
  writeNotes(notes);
  res.json(updated);
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const notes = readNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  const [removed] = notes.splice(idx, 1);
  writeNotes(notes);
  res.json(removed);
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Keep Notes server running on http://localhost:${PORT}`);
});
