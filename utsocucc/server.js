const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let categories = [
  {
    id: 1,
    name: 'Év sportolója',
    candidates: [
      { id: 1, name: 'Kovács Anna' },
      { id: 2, name: 'Szabó Péter' },
      { id: 3, name: 'Nagy Dániel' }
    ]
  },
  {
    id: 2,
    name: 'Legjobb büfés kaja',
    candidates: [
      { id: 1, name: 'Sajtos pogácsa' },
      { id: 2, name: 'Melegszendvics' },
      { id: 3, name: 'Gyros tál' }
    ]
  }
];

const votes = {};
const results = {};

const ensureResultMaps = () => {
  categories.forEach((cat) => {
    if (!results[cat.id]) results[cat.id] = {};
    cat.candidates.forEach((cand) => {
      if (typeof results[cat.id][cand.id] !== 'number') {
        results[cat.id][cand.id] = 0;
      }
    });
  });
};

ensureResultMaps();

app.get('/api/categories', (req, res) => {
  res.json(categories);
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/api/vote', (req, res) => {
  res.status(405).json({
    message: 'A /api/vote végpont csak POST kérést fogad.',
    example: {
      method: 'POST',
      body: {
        studentId: '11A-kiss.janos',
        categoryId: 1,
        candidateId: 2
      }
    }
  });
});

app.post('/api/vote', (req, res) => {
  const { studentId, categoryId, candidateId } = req.body;

  if (!studentId || !categoryId || !candidateId) {
    return res.status(400).json({ message: 'Hiányzó adatok.' });
  }

  const category = categories.find((c) => c.id === Number(categoryId));
  if (!category) {
    return res.status(404).json({ message: 'A kategória nem található.' });
  }

  const candidate = category.candidates.find((c) => c.id === Number(candidateId));
  if (!candidate) {
    return res.status(404).json({ message: 'A jelölt nem található ebben a kategóriában.' });
  }

  if (!votes[studentId]) votes[studentId] = {};
  if (votes[studentId][categoryId]) {
    return res.status(409).json({ message: 'Ebben a kategóriában már szavaztál.' });
  }

  votes[studentId][categoryId] = candidateId;
  results[category.id][candidate.id] = (results[category.id][candidate.id] || 0) + 1;

  return res.json({ message: 'Köszönjük a szavazatodat!' });
});

app.get('/api/results', (req, res) => {
  const report = categories.map((cat) => {
    const totalVotes = cat.candidates.reduce((sum, candidate) => sum + (results[cat.id]?.[candidate.id] || 0), 0);
    const candidates = cat.candidates.map((candidate) => {
      const voteCount = results[cat.id]?.[candidate.id] || 0;
      const percent = totalVotes === 0 ? 0 : Number(((voteCount / totalVotes) * 100).toFixed(1));
      return {
        id: candidate.id,
        name: candidate.name,
        voteCount,
        percent
      };
    });

    return {
      id: cat.id,
      name: cat.name,
      totalVotes,
      candidates
    };
  });

  res.json(report);
});

app.post('/api/admin/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'A kategória neve kötelező.' });
  }

  const newCategory = {
    id: categories.length ? Math.max(...categories.map((c) => c.id)) + 1 : 1,
    name: name.trim(),
    candidates: []
  };

  categories.push(newCategory);
  results[newCategory.id] = {};
  res.status(201).json(newCategory);
});

app.patch('/api/admin/categories/:id', (req, res) => {
  const categoryId = Number(req.params.id);
  const { name } = req.body;
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return res.status(404).json({ message: 'Kategória nem található.' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Az új név kötelező.' });
  }

  category.name = name.trim();
  res.json(category);
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const categoryId = Number(req.params.id);
  const prevLength = categories.length;
  categories = categories.filter((c) => c.id !== categoryId);

  if (categories.length === prevLength) {
    return res.status(404).json({ message: 'Kategória nem található.' });
  }

  delete results[categoryId];
  Object.keys(votes).forEach((studentId) => {
    delete votes[studentId][categoryId];
  });

  res.json({ message: 'Kategória törölve.' });
});

app.post('/api/admin/categories/:id/candidates', (req, res) => {
  const categoryId = Number(req.params.id);
  const { name } = req.body;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Kategória nem található.' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'A jelölt neve kötelező.' });
  }

  const newCandidate = {
    id: category.candidates.length ? Math.max(...category.candidates.map((c) => c.id)) + 1 : 1,
    name: name.trim()
  };

  category.candidates.push(newCandidate);
  results[categoryId][newCandidate.id] = 0;

  res.status(201).json(newCandidate);
});

app.patch('/api/admin/categories/:categoryId/candidates/:candidateId', (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const candidateId = Number(req.params.candidateId);
  const { name } = req.body;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return res.status(404).json({ message: 'Kategória nem található.' });

  const candidate = category.candidates.find((c) => c.id === candidateId);
  if (!candidate) return res.status(404).json({ message: 'Jelölt nem található.' });

  if (!name || !name.trim()) return res.status(400).json({ message: 'Az új név kötelező.' });

  candidate.name = name.trim();
  res.json(candidate);
});

app.delete('/api/admin/categories/:categoryId/candidates/:candidateId', (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const candidateId = Number(req.params.candidateId);

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return res.status(404).json({ message: 'Kategória nem található.' });

  const prevLen = category.candidates.length;
  category.candidates = category.candidates.filter((c) => c.id !== candidateId);
  if (category.candidates.length === prevLen) {
    return res.status(404).json({ message: 'Jelölt nem található.' });
  }

  delete results[categoryId][candidateId];
  Object.keys(votes).forEach((studentId) => {
    if (String(votes[studentId][categoryId]) === String(candidateId)) {
      delete votes[studentId][categoryId];
    }
  });

  res.json({ message: 'Jelölt törölve.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});