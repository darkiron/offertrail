import React, { useState } from 'react';
import { applicationService } from '../services/api';
import { Link } from 'react-router-dom';

export const Import: React.FC = () => {
  const [tsv, setTsv] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tsv.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await applicationService.importTsv(tsv);
      setResults(res);
      if (res.created > 0) {
        setTsv('');
      }
    } catch (error: any) {
      console.error('Import failed', error);
      setError(error.response?.data?.detail || 'Import failed. Check if your TSV format is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-lg">
      <div className="flex justify-between items-center mb-lg">
        <h1 className="text-xxl font-bold">📥 Import Applications</h1>
        <Link to="/" className="btn-ghost">Back to Dashboard</Link>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setError(null)}>Close</button>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-lg)' }}>
        <div className="card">
          <h2 className="text-lg font-bold mb-md">TSV Data</h2>
          <p className="text-sm text-dim mb-md">
            Paste your TSV data (e.g. from Excel/Google Sheets). 
            First line must be header: Entreprise, Poste, Type, Source, Statut, etc.
          </p>
          <form onSubmit={handleImport}>
            <textarea 
              className="input" 
              style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '12px' }}
              value={tsv}
              onChange={(e) => setTsv(e.target.value)}
              placeholder="Entreprise	Poste	Type	Source	Statut..."
            />
            <button type="submit" className="btn-primary mt-md w-full flex items-center justify-center gap-sm" disabled={loading}>
              {loading && <div className="loading-spinner" style={{ width: '16px', height: '16px', margin: '0' }}></div>}
              {loading ? 'Importing...' : 'Start Import'}
            </button>
          </form>
        </div>

        <div className="flex-col gap-lg">
          {results && (
            <div className="card">
              <h2 className="text-lg font-bold mb-md">Results</h2>
              <div className="flex-col gap-sm">
                <div className="flex justify-between">
                  <span>Total Rows</span>
                  <span className="font-bold">{results.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="font-bold text-applied">{results.created}</span>
                </div>
                <div className="flex justify-between">
                  <span>Skipped/Errors</span>
                  <span className="font-bold text-rejected">{results.skipped}</span>
                </div>
              </div>
              
              {results.errors?.length > 0 && (
                <div className="mt-lg">
                  <h3 className="text-sm font-bold text-rejected mb-sm">Errors:</h3>
                  <div className="text-xs flex-col gap-xs" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {results.errors.map((err: any, i: number) => (
                      <div key={i} className="text-dim">Row {err.row}: {err.reason}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="text-sm font-bold mb-md">Column Mapping Info</h2>
            <ul className="text-sm text-dim flex-col gap-xs" style={{ paddingLeft: '1.2rem' }}>
              <li>Entreprise (Required)</li>
              <li>Poste (Required)</li>
              <li>Type (CDI, Freelance)</li>
              <li>Source (LinkedIn, etc)</li>
              <li>Statut (Applied, Interview...)</li>
              <li>Date candidature</li>
              <li>Notes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
