# Iskolai digitális szavazórendszer (JS + web)

Ez a projekt egy teljes, adatvezérelt szavazó webalkalmazás:

- **Frontend (weboldal):** dinamikusan lekéri a kategóriákat és jelölteket, kezeli a szavazást, admin műveleteket és eredményeket.
- **Backend (Node.js + Express):** REST API-n keresztül kezeli a kategóriákat, jelölteket, szavazatokat és riportot.

## Funkciók

1. **Adatok megjelenítése (lekérés)**
   - `GET /api/categories`
   - A kategóriák és jelöltek automatikusan renderelődnek.

2. **Szavazás (küldés)**
   - `POST /api/vote`
   - Egy diák egy kategóriában csak egyszer szavazhat.
   - Sikeres/hibás válaszok visszajelzése a frontendben.

3. **Admin felület (kategória + jelölt kezelés)**
   - Kategória: hozzáadás / átnevezés / törlés
   - Jelölt: hozzáadás / átnevezés / törlés

4. **Eredményhirdetés**
   - `GET /api/results`
   - Szavazatszám és százalékos bontás kategóriánként.

## Indítás

```bash
npm install
npm start
```

Majd nyisd meg a böngészőben:

- `http://localhost:3000`

## Fájlstruktúra

- `server.js` – Express backend + API-k
- `public/index.html` – UI
- `public/styles.css` – stílusok
- `public/app.js` – frontend logika

### Gyakori hiba: "Cannot GET /api/vote"

A `\/api\/vote` végpont **nem GET**, hanem **POST** kérésre működik.
Böngészőbe írva GET kérés megy ki, ezért hibát kapsz.

Használj POST-ot például így:

```bash
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"studentId":"11A-kiss.janos","categoryId":1,"candidateId":1}'
```
