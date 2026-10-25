import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'devsecops-api' }));
  app.get('/api/pipeline', (_req, res) => res.json({
    status: 'not_run', source: 'simulated', updatedAt: null,
    message: 'No CI run is connected. Status is not live.',
    stages: ['checkout', 'lint_test', 'sonarqube', 'trivy', 'image_build', 'deploy'].map((name) => ({ name, status: 'not_run' })),
  }));
  app.get('/api/security', (_req, res) => res.json({
    source: 'simulated', scanned: false, status: 'not_run', severities: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
    findings: [], message: 'Scanner results are unavailable until Trivy runs. Zero findings are not asserted.',
  }));
  app.get('/api/quality', (_req, res) => res.json({
    source: 'simulated', analyzed: false, qualityGate: 'not_run', coveragePercent: null, bugs: null, vulnerabilities: null, codeSmells: null,
    message: 'SonarQube is not connected. Quality metrics are unavailable.',
  }));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  const errors: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
    void _next;
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    res.status(500).json({ error: 'Internal server error', detail: process.env.NODE_ENV === 'production' ? undefined : message });
  };
  app.use(errors);
  return app;
}
