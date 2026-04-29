const voteArea = document.getElementById('voteArea');
const voteBtn = document.getElementById('voteBtn');
const voteFeedback = document.getElementById('voteFeedback');
const adminArea = document.getElementById('adminArea');
const resultsArea = document.getElementById('resultsArea');

let categories = [];

async function loadCategories() {
  const res = await fetch('/api/categories');
  categories = await res.json();
  renderVoteUI();
  renderAdminUI();
}

function renderVoteUI() {
  voteArea.innerHTML = '';

  categories.forEach((category) => {
    const wrap = document.createElement('div');
    wrap.className = 'category';
    wrap.innerHTML = `<h3>${category.name}</h3>`;

    if (!category.candidates.length) {
      wrap.innerHTML += '<small>Még nincs jelölt ebben a kategóriában.</small>';
    } else {
      category.candidates.forEach((candidate) => {
        const id = `cat-${category.id}-cand-${candidate.id}`;
        wrap.innerHTML += `
          <label>
            <input type="radio" name="category-${category.id}" value="${candidate.id}" id="${id}" />
            ${candidate.name}
          </label><br/>
        `;
      });
    }

    voteArea.appendChild(wrap);
  });
}

function renderAdminUI() {
  adminArea.innerHTML = '';

  categories.forEach((category) => {
    const wrap = document.createElement('div');
    wrap.className = 'category';

    const candidateItems = category.candidates.map((candidate) => `
      <li>
        ${candidate.name}
        <button onclick="renameCandidate(${category.id}, ${candidate.id})">Átnevezés</button>
        <button onclick="deleteCandidate(${category.id}, ${candidate.id})">Törlés</button>
      </li>
    `).join('');

    wrap.innerHTML = `
      <h3>${category.name}</h3>
      <div class="inline">
        <button onclick="renameCategory(${category.id})">Kategória átnevezése</button>
        <button onclick="deleteCategory(${category.id})">Kategória törlése</button>
      </div>
      <ul>${candidateItems || '<small>Nincs még jelölt.</small>'}</ul>
      <div class="inline">
        <input id="newCandidate-${category.id}" placeholder="Új jelölt neve" />
        <button onclick="addCandidate(${category.id})">Jelölt hozzáadása</button>
      </div>
    `;

    adminArea.appendChild(wrap);
  });
}

async function submitVotes() {
  const studentId = document.getElementById('studentId').value.trim();

  if (!studentId) {
    voteFeedback.className = 'error';
    voteFeedback.textContent = 'Add meg a diák azonosítódat!';
    return;
  }

  voteFeedback.className = '';
  voteFeedback.textContent = '';

  for (const category of categories) {
    const selected = document.querySelector(`input[name='category-${category.id}']:checked`);
    if (!selected) continue;

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        categoryId: category.id,
        candidateId: Number(selected.value)
      })
    });

    const data = await res.json();
    if (!res.ok) {
      voteFeedback.className = 'error';
      voteFeedback.textContent = `Hiba (${category.name}): ${data.message}`;
      return;
    }
  }

  voteFeedback.className = 'success';
  voteFeedback.textContent = 'Köszönjük, a kiválasztott szavazataidat rögzítettük.';
  loadResults();
}

async function loadResults() {
  const res = await fetch('/api/results');
  const report = await res.json();
  resultsArea.innerHTML = '';

  report.forEach((category) => {
    const wrap = document.createElement('div');
    wrap.className = 'category';
    const lines = category.candidates
      .sort((a, b) => b.voteCount - a.voteCount)
      .map((c) => `<li>${c.name}: <strong>${c.voteCount}</strong> szavazat (${c.percent}%)</li>`)
      .join('');

    wrap.innerHTML = `<h3>${category.name}</h3><small>Összes szavazat: ${category.totalVotes}</small><ul>${lines}</ul>`;
    resultsArea.appendChild(wrap);
  });
}

async function addCategory(name) {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) return alert('Nem sikerült a kategória hozzáadása.');
  await loadCategories();
}

async function renameCategory(id) {
  const name = prompt('Új kategórianév:');
  if (!name) return;
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) return alert('Nem sikerült az átnevezés.');
  await loadCategories();
}

async function deleteCategory(id) {
  if (!confirm('Biztosan törlöd ezt a kategóriát?')) return;
  const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) return alert('Nem sikerült a törlés.');
  await loadCategories();
  await loadResults();
}

async function addCandidate(categoryId) {
  const input = document.getElementById(`newCandidate-${categoryId}`);
  const name = input.value.trim();
  if (!name) return;

  const res = await fetch(`/api/admin/categories/${categoryId}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) return alert('Nem sikerült a jelölt hozzáadása.');

  input.value = '';
  await loadCategories();
}

async function renameCandidate(categoryId, candidateId) {
  const name = prompt('Új jelöltnév:');
  if (!name) return;

  const res = await fetch(`/api/admin/categories/${categoryId}/candidates/${candidateId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) return alert('Nem sikerült az átnevezés.');

  await loadCategories();
}

async function deleteCandidate(categoryId, candidateId) {
  if (!confirm('Biztosan törlöd ezt a jelöltet?')) return;

  const res = await fetch(`/api/admin/categories/${categoryId}/candidates/${candidateId}`, { method: 'DELETE' });
  if (!res.ok) return alert('Nem sikerült a jelölt törlése.');

  await loadCategories();
  await loadResults();
}

document.getElementById('newCategoryForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('newCategoryName');
  const name = input.value.trim();
  if (!name) return;
  await addCategory(name);
  input.value = '';
});

document.getElementById('refreshResults').addEventListener('click', loadResults);
voteBtn.addEventListener('click', submitVotes);

window.renameCategory = renameCategory;
window.deleteCategory = deleteCategory;
window.addCandidate = addCandidate;
window.renameCandidate = renameCandidate;
window.deleteCandidate = deleteCandidate;

loadCategories();
loadResults();