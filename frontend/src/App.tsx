import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Code2, GitBranch, Layers3, LockKeyhole, RefreshCw, Shield, ShieldCheck, Terminal, Zap } from 'lucide-react';

type Pipeline = { status: string; source: string; updatedAt: string | null; message: string; stages: { name: string; status: string }[] };
type Security = { source: string; scanned: boolean; status: string; severities: Record<string, number>; findings: { title: string; severity: string; target: string }[]; message: string };
type Quality = { source: string; analyzed: boolean; qualityGate: string; coveragePercent: number | null; bugs: number | null; vulnerabilities: number | null; codeSmells: number | null; message: string };
type Data = { pipeline: Pipeline; security: Security; quality: Quality };
const API = import.meta.env.VITE_API_URL ?? '';
const stageNames: Record<string, string> = { checkout: 'Source', lint_test: 'Lint & test', sonarqube: 'SonarQube', trivy: 'Trivy scan', image_build: 'Image build', deploy: 'Deploy' };

async function fetchDashboard(): Promise<Data> {
  const responses = await Promise.all(['/api/pipeline', '/api/security', '/api/quality'].map((path) => fetch(`${API}${path}`)));
  if (responses.some((r) => !r.ok)) throw new Error('The dashboard API returned an error. Check that the backend is running.');
  const [pipeline, security, quality] = await Promise.all(responses.map((r) => r.json()));
  return { pipeline, security, quality } as Data;
}

function StatusTag({ value }: { value: string }) {
  const label: Record<string, string> = { passed: 'Passed', failed: 'Failed', running: 'Running', not_run: 'Not run' };
  return <span className={`status status-${value}`}><i />{label[value] ?? value}</span>;
}

function App() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(false);
  const [refreshed, setRefreshed] = useState<Date | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await fetchDashboard()); setRefreshed(new Date()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load pipeline status.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const p = data?.pipeline; const s = data?.security; const q = data?.quality;
  const totalFindings = s ? Object.values(s.severities).reduce((sum, n) => sum + n, 0) : null;

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="brand-icon"><ShieldCheck size={19}/></div><div><strong>pipeline<span>guard</span></strong><small>SECURE DELIVERY</small></div></div>
      <div className="side-label">WORKSPACE</div><a className="nav active"><Layers3 size={17}/> Overview</a><a className="nav"><GitBranch size={17}/> Pipelines <span className="nav-count">01</span></a><a className="nav"><Shield size={17}/> Security</a><a className="nav"><Code2 size={17}/> Code quality</a>
      <div className="side-bottom"><div className="side-label">ENVIRONMENT</div><div className="env"><span className="pulse"/> Demo workspace</div><div className="side-note">Connected data sources<br/><b><i className="dot muted"/> GitHub Actions</b><b><i className="dot muted"/> SonarQube</b><b><i className="dot muted"/> Trivy</b></div><div className="profile"><div className="avatar">DG</div><div><b>DevSecOps demo</b><small>Local environment</small></div><CircleHelp size={16}/></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="live-pill"><i/> STATUS UNAVAILABLE</span><button className="icon-btn" aria-label="Refresh status" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/></button><div className="avatar tiny">DG</div></div></header>
      <section className="content"><div className="page-head"><div><div className="eyebrow"><span/> DEVSECOPS CONTROL PLANE</div><h1>Pipeline overview</h1><p>Security and quality signals across your delivery workflow.</p></div><button className="refresh-btn" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/> Refresh status</button></div>
      {error && <div className="error-banner" role="alert"><AlertTriangle size={18}/><div><b>Unable to load live status</b><span>{error}</span></div><button onClick={() => void refresh()}>Retry</button></div>}
      {loading && !data ? <div className="loading flex items-center justify-center" role="status"><span className="spinner"/> Loading pipeline data…</div> : <>
      <div className="notice"><div className="notice-icon"><CircleHelp size={17}/></div><div><b>Demo mode · no live integrations connected</b><p>Values marked “Not run” are unavailable, not passed. Connect GitHub Actions, SonarQube and Trivy to populate real results.</p></div><span className="sim-label">SIMULATED / UNAVAILABLE</span></div>
      <section className="metrics" aria-label="Pipeline summary"><Metric icon={<Activity/>} label="PIPELINE STATUS" main={<StatusTag value={p?.status ?? 'not_run'}/>} foot="No CI run connected" tone="orange"/><Metric icon={<Check/>} label="TESTS" main={<StatusTag value="not_run"/>} foot="Results not available" tone="blue"/><Metric icon={<Shield/>} label="VULNERABILITIES" main={<strong>{totalFindings ?? '—'}</strong>} foot={s?.scanned ? 'Findings from latest scan' : 'No scan has been run'} tone="red"/><Metric icon={<Code2/>} label="QUALITY GATE" main={<StatusTag value={q?.qualityGate ?? 'not_run'}/>} foot="SonarQube not connected" tone="green"/></section>
      <div className="section-title"><div><h2>Delivery pipeline</h2><p>Required checks must pass before an image can be released.</p></div><span className="run-id"><Clock3 size={13}/> {refreshed ? `Updated ${refreshed.toLocaleTimeString()}` : 'Waiting for data'}</span></div>
      <section className="pipeline-card" aria-label="Delivery pipeline stages"><div className="pipeline-track">{(p?.stages ?? []).map((stage, i) => <div className="stage-wrap" key={stage.name}><div className={`stage-icon stage-${stage.status}`}>{stage.status === 'passed' ? <Check size={17}/> : stage.status === 'running' ? <RefreshCw size={16}/> : stage.name === 'trivy' ? <Shield size={16}/> : stage.name === 'sonarqube' ? <Code2 size={16}/> : stage.name === 'deploy' ? <Zap size={16}/> : <Terminal size={16}/>}</div>{i < (p?.stages.length ?? 0) - 1 && <div className="connector"/>}<div className="stage-name">{stageNames[stage.name] ?? stage.name}</div><StatusTag value={stage.status}/></div>)}</div><div className="pipeline-foot"><span><LockKeyhole size={14}/> Deployment is gated on all mandatory checks</span><button onClick={() => setDetails(!details)} aria-expanded={details}>{details ? 'Hide details' : 'View details'} <ArrowUpRight size={14}/></button></div>{details && <div className="details" role="region"><b>Current run</b><p>{p?.message ?? 'Pipeline data unavailable.'}</p><p>Pipeline state source: <code>{p?.source ?? 'unavailable'}</code></p></div>}</section>
      <div className="lower-grid"><section className="panel"><div className="panel-head"><div className="panel-icon shield"><Shield size={17}/></div><div><h3>Vulnerability overview</h3><p>Latest Trivy filesystem and image scan</p></div><button className="more" aria-label="Toggle vulnerability details" onClick={() => setDetails(!details)}><ChevronDown size={17}/></button></div><div className="severity-grid">{[['CRITICAL','critical'],['HIGH','high'],['MEDIUM','medium'],['LOW','low']].map(([label,key])=><div className="severity" key={key}><span className={`sev-dot ${key}`}/><span>{label}</span><b>{s?.scanned ? s.severities[key] ?? 0 : '—'}</b></div>)}</div><div className="panel-foot"><span className="muted-copy">{s?.scanned ? 'Real scanner output' : 'Scanner has not executed'}</span><span className="source-chip">{s?.scanned ? 'TRIVY' : 'NOT RUN'}</span></div>{details && <div className="details"><p>{s?.message ?? 'No scan data available.'}</p>{s?.findings.map((f) => <p key={f.title}><b>{f.severity}</b> · {f.title} <code>{f.target}</code></p>)}</div>}</section>
      <section className="panel"><div className="panel-head"><div className="panel-icon quality"><Code2 size={17}/></div><div><h3>Code quality</h3><p>SonarQube analysis summary</p></div><span className="gate-status"><StatusTag value={q?.qualityGate ?? 'not_run'}/></span></div><div className="quality-score"><div className="score">{q?.coveragePercent == null ? '—' : `${q.coveragePercent}%`}<small>coverage</small></div><div className="quality-stats"><div><span>Bugs</span><b>{q?.bugs ?? '—'}</b></div><div><span>Vulnerabilities</span><b>{q?.vulnerabilities ?? '—'}</b></div><div><span>Code smells</span><b>{q?.codeSmells ?? '—'}</b></div></div></div><div className="panel-foot"><span className="muted-copy">{q?.analyzed ? 'Latest analysis' : 'No analysis available'}</span><span className="source-chip">{q?.analyzed ? 'SONARQUBE' : 'NOT RUN'}</span></div></section></div>
      <div className="history-head"><h2>Recent activity</h2><span className="sim-label">EXAMPLE ONLY</span></div><div className="history"><div className="history-empty"><Clock3 size={16}/><span>No run history available. Historical runs will appear here when a CI provider is connected.</span></div></div>
      </>}
      <footer><span>Pipeline Guard <b>·</b> DevSecOps reference implementation</span><span>Built for transparent security gates <ShieldCheck size={14}/></span></footer>
      </section>
    </main>
  </div>;
}

function Metric({ icon, label, main, foot, tone }: { icon: React.ReactNode; label: string; main: React.ReactNode; foot: string; tone: string }) {
  return <div className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><div className="metric-main">{main}</div><span className="metric-foot">{foot}</span></div>;
}
export default App;
