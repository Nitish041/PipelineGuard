import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();
describe('API', () => {
  it('reports service health', async () => { const r = await request(app).get('/api/health'); expect(r.status).toBe(200); expect(r.body).toMatchObject({ status: 'ok', service: 'devsecops-api' }); });
  it('returns ordered pipeline stages explicitly as not run', async () => { const r = await request(app).get('/api/pipeline'); expect(r.body.status).toBe('not_run'); expect(r.body.stages.map((s: {name:string}) => s.name)).toEqual(['checkout','lint_test','sonarqube','trivy','image_build','deploy']); });
  it('does not represent missing scans as passed or clean', async () => { const r = await request(app).get('/api/security'); expect(r.body.scanned).toBe(false); expect(r.body.status).toBe('not_run'); expect(r.body.message).toContain('not asserted'); });
  it('marks unavailable quality data as not run', async () => { const r = await request(app).get('/api/quality'); expect(r.body.qualityGate).toBe('not_run'); expect(r.body.coveragePercent).toBeNull(); });
  it('returns a useful JSON error for unknown routes', async () => { const r = await request(app).get('/missing'); expect(r.status).toBe(404); expect(r.body).toEqual({ error: 'Not found' }); });
});
