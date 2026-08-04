const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data', 'clinical');

let repertory = null;
let materiaMedica = null;
let books = null;
let acuteKits = null;

function loadData() {
  if (!repertory) {
    repertory = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'repertory.json'), 'utf8'));
    materiaMedica = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'materia-medica.json'), 'utf8'));
    books = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'books.json'), 'utf8'));
    acuteKits = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'acute-kits.json'), 'utf8'));
  }
}

function getStats() {
  loadData();
  const chapters = [...new Set(repertory.map((r) => r.chapter))];
  const remedies = new Set();
  repertory.forEach((r) => r.remedies.forEach((rem) => remedies.add(rem.name)));
  return {
    rubrics: repertory.length,
    chapters: chapters.length,
    chapterList: chapters,
    remediesInRepertory: remedies.size,
    materiaMedicaEntries: materiaMedica.length,
    books: books.length,
    bookTitles: books.map((b) => b.title),
    acuteKits: acuteKits.length,
  };
}

function searchRubrics(q, chapter, limit = 30) {
  loadData();
  const query = (q || '').toLowerCase().trim();
  let results = repertory;
  if (chapter) results = results.filter((r) => r.chapter === chapter);
  if (query) {
    results = results.filter(
      (r) => r.rubric.toLowerCase().includes(query) || r.chapter.toLowerCase().includes(query)
    );
  }
  return results.slice(0, limit);
}

function getRubricById(id) {
  loadData();
  return repertory.find((r) => r.id === id) || null;
}

function repertorize(rubricIds) {
  loadData();
  const scores = {};
  const rubricDetails = [];

  for (const id of rubricIds) {
    const rubric = repertory.find((r) => r.id === id);
    if (!rubric) continue;
    rubricDetails.push({ id: rubric.id, chapter: rubric.chapter, rubric: rubric.rubric });
    for (const rem of rubric.remedies) {
      if (!scores[rem.name]) {
        scores[rem.name] = { name: rem.name, totalScore: 0, rubricCount: 0, grades: [] };
      }
      scores[rem.name].totalScore += rem.grade;
      scores[rem.name].rubricCount += 1;
      scores[rem.name].grades.push({ rubricId: id, grade: rem.grade });
    }
  }

  const ranked = Object.values(scores)
    .sort((a, b) => b.totalScore - a.totalScore || b.rubricCount - a.rubricCount)
    .slice(0, 20)
    .map((r) => {
      const mm = materiaMedica.find(
        (m) => m.name.toLowerCase() === r.name.toLowerCase()
      );
      return { ...r, keynotes: mm?.keynotes?.slice(0, 3) || [], slug: mm?.slug || null };
    });

  return { rubrics: rubricDetails, remedies: ranked };
}

function searchMateriaMedica(q, limit = 20) {
  loadData();
  const query = (q || '').toLowerCase().trim();
  if (!query) return materiaMedica.slice(0, limit);
  return materiaMedica
    .filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.commonName?.toLowerCase().includes(query) ||
        m.keynotes.some((k) => k.toLowerCase().includes(query))
    )
    .slice(0, limit);
}

function listAllMateriaMedica() {
  loadData();
  return materiaMedica.map(({ slug, name, commonName, keynotes }) => ({
    slug, name, commonName, keynotes: keynotes.slice(0, 3),
  }));
}

function compareRemedies(slugs) {
  loadData();
  return slugs
    .map((slug) => materiaMedica.find((m) => m.slug === slug))
    .filter(Boolean);
}

function listAcuteKits() {
  loadData();
  return acuteKits;
}

function getAcuteKit(id) {
  loadData();
  const kit = acuteKits.find((k) => k.id === id);
  if (!kit) return null;
  const rubrics = kit.rubricIds
    .map((rid) => repertory.find((r) => r.id === rid))
    .filter(Boolean);
  return { ...kit, rubrics };
}

function getMateriaMedicaBySlug(slug) {
  loadData();
  return materiaMedica.find((m) => m.slug === slug) || null;
}

function listBooks() {
  loadData();
  return books.map(({ chapters, ...book }) => ({
    ...book,
    chapterCount: chapters.length,
  }));
}

function getBook(slug) {
  loadData();
  return books.find((b) => b.slug === slug) || null;
}

function searchAll(q, limit = 15) {
  loadData();
  const query = (q || '').toLowerCase().trim();
  if (!query) return { rubrics: [], remedies: [], books: [] };

  const rubrics = searchRubrics(query, null, 8);
  const remedies = searchMateriaMedica(query, 8);
  const matchedBooks = books
    .filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.chapters.some((c) => c.title.toLowerCase().includes(query) || c.content.toLowerCase().includes(query))
    )
    .slice(0, 5)
    .map(({ chapters, ...book }) => ({ ...book, chapterCount: chapters.length }));

  return { rubrics, remedies, books: matchedBooks };
}

function symptomsToRubrics(symptoms) {
  loadData();
  const words = (symptoms || '')
    .toLowerCase()
    .split(/[\s,;.]+/)
    .filter((w) => w.length > 2);
  if (!words.length) return [];

  const scored = repertory.map((r) => {
    const text = `${r.rubric} ${r.chapter}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (text.includes(w)) score += 1;
    }
    return { ...r, matchScore: score };
  });

  return scored
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);
}

module.exports = {
  getStats,
  searchRubrics,
  getRubricById,
  repertorize,
  searchMateriaMedica,
  listAllMateriaMedica,
  compareRemedies,
  getMateriaMedicaBySlug,
  listBooks,
  getBook,
  searchAll,
  symptomsToRubrics,
  listAcuteKits,
  getAcuteKit,
};
