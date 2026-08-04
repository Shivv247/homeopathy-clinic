/**
 * API + clinical service tests. Run: npm test (from backend/)
 */
process.env.NODE_ENV = 'test';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const clinical = require('../src/services/clinical');

let doctorToken = '';
let patientId = '';

describe('Clinical service (unit)', () => {
  it('stats: rubrics >= 100', () => {
    const stats = clinical.getStats();
    assert.ok(stats.rubrics >= 100, `Expected >= 100 rubrics, got ${stats.rubrics}`);
    assert.ok(stats.materiaMedicaEntries >= 50);
    assert.ok(stats.acuteKits >= 15);
  });

  it('repertorize returns ranked remedies', () => {
    const result = clinical.repertorize(['r002', 'r014', 'r065']);
    assert.ok(result.remedies.length > 0);
    assert.equal(result.remedies[0].name, 'Arsenicum Album');
    assert.ok(result.remedies[0].totalScore > 0);
  });

  it('symptomsToRubrics matches keywords', () => {
    const rubrics = clinical.symptomsToRubrics('anxiety grief headache');
    assert.ok(rubrics.length > 0);
    assert.ok(rubrics[0].matchScore > 0);
  });

  it('compareRemedies returns 2 profiles', () => {
    const list = clinical.listAllMateriaMedica();
    const slugs = list.slice(0, 2).map((m) => m.slug);
    const compared = clinical.compareRemedies(slugs);
    assert.equal(compared.length, 2);
  });

  it('acute kit loads rubrics', () => {
    const kit = clinical.getAcuteKit('acute-fever');
    assert.ok(kit);
    assert.ok(kit.rubrics.length >= 3);
  });

  it('search rubrics pagination limit', () => {
    const all = clinical.searchRubrics('', null, 100);
    assert.ok(all.length >= 20);
    const filtered = clinical.searchRubrics('anxiety', null, 10);
    assert.ok(filtered.length <= 10);
  });
});

describe('API integration', () => {
  before(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9876543210', password: 'password123' });
    assert.equal(login.status, 200);
    assert.equal(login.body.success, true);
    doctorToken = login.body.token;
  });

  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('GET /api/patients requires auth', async () => {
    const res = await request(app).get('/api/patients');
    assert.equal(res.status, 401);
  });

  it('GET /api/patients page 1', async () => {
    const res = await request(app)
      .get('/api/patients?page=1&limit=20')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.total >= 100, `Expected >= 100 patients, got ${res.body.total}`);
    assert.equal(res.body.patients.length, 20);
    assert.equal(res.body.page, 1);
    patientId = res.body.patients[0].id;
  });

  it('GET /api/patients page 2', async () => {
    const res = await request(app)
      .get('/api/patients?page=2&limit=20')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.patients.length, 20);
    assert.equal(res.body.page, 2);
  });

  it('GET /api/patients search', async () => {
    const res = await request(app)
      .get('/api/patients?q=Rajesh&limit=10')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.patients.length >= 1);
  });

  it('GET /api/clinical/stats', async () => {
    const res = await request(app)
      .get('/api/clinical/stats')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.stats.rubrics >= 100);
  });

  it('POST /api/clinical/repertory/analyze', async () => {
    const res = await request(app)
      .post('/api/clinical/repertory/analyze')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ rubricIds: ['r051', 'r014', 'r002'] });
    assert.equal(res.status, 200);
    assert.ok(res.body.analysis.remedies.length > 0);
  });

  it('GET /api/clinical/acute-kits', async () => {
    const res = await request(app)
      .get('/api/clinical/acute-kits')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.kits.length >= 15);
  });

  it('POST /api/clinical/sessions', async () => {
    const res = await request(app)
      .post('/api/clinical/sessions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        title: 'Test session',
        rubricIds: ['r002', 'r014'],
        topRemedies: [{ name: 'Arsenicum Album', totalScore: 5 }],
      });
    assert.equal(res.status, 201);
    assert.ok(res.body.session.id);
  });

  it('GET /api/dashboard/overview', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.overview.totalPatients >= 100);
  });

  it('GET /api/appointments/today', async () => {
    const res = await request(app)
      .get('/api/appointments/today')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.appointments));
  });

  it('Receptionist cannot access clinical', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9876543211', password: 'password123' });
    const res = await request(app)
      .get('/api/clinical/stats')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(res.status, 403);
  });

  it('Invalid login rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9876543210', password: 'wrong' });
    assert.equal(res.status, 401);
  });
});
