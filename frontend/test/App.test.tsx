import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('dashboard', () => {
  it('shows a loading state before API responses resolve', () => { vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); render(<App/>); expect(screen.getByRole('status')).toHaveTextContent('Loading pipeline data'); });
  it('shows useful error feedback when the API cannot be reached', async () => { vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable'))); render(<App/>); expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load live status'); expect(screen.getByRole('alert')).toHaveTextContent('network unavailable'); });
  it('renders unavailable data as not run instead of claiming success', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve({ ok: true, json: () => Promise.resolve(url.endsWith('pipeline') ? { status: 'not_run', source: 'simulated', updatedAt: null, message: 'No CI run is connected.', stages: [{name:'checkout',status:'not_run'}] } : url.endsWith('security') ? {source:'simulated',scanned:false,status:'not_run',severities:{critical:0,high:0,medium:0,low:0},findings:[],message:'Not run'} : {source:'simulated',analyzed:false,qualityGate:'not_run',coveragePercent:null,bugs:null,vulnerabilities:null,codeSmells:null,message:'Not run'}) }))); 
    render(<App/>); await waitFor(() => expect(screen.getByText('Demo mode · no live integrations connected')).toBeInTheDocument()); expect(screen.getAllByText('Not run').length).toBeGreaterThan(0); expect(screen.getByText('No scan has been run')).toBeInTheDocument();
  });
});
