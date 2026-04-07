import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../services/api';

export const Import: React.FC = () => {
  const [tsv, setTsv] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = 'Import — OfferTrail';
  }, []);

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tsv.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await applicationService.importTsv(tsv);
      setResults(response);
      if (response.created > 0) {
        setTsv('');
      }
    } catch (importError: any) {
      setError(importError.response?.data?.detail || "Echec de l'import. Verifie le format TSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-lg">
      <div className="flex justify-between items-center mb-lg">
        <h1 className="text-xxl font-bold">Import des candidatures</h1>
        <Link to="/app" className="btn-ghost">Retour au tableau de bord</Link>
      </div>

      {error ? (
        <div className="alert alert-error mb-lg">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setError(null)}>Fermer</button>
        </div>
      ) : null}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 'var(--spacing-lg)' }}>
        <div className="card">
          <h2 className="text-lg font-bold mb-md">Donnees TSV</h2>
          <p className="text-sm text-dim mb-md">
            Colle ici tes donnees TSV, par exemple depuis Excel ou Google Sheets.
            La premiere ligne doit contenir les colonnes : Entreprise, Poste, Type, Source, Statut, etc.
          </p>
          <form onSubmit={handleImport}>
            <textarea
              className="input"
              style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '12px' }}
              value={tsv}
              onChange={(event) => setTsv(event.target.value)}
              placeholder={'Entreprise\tPoste\tType\tSource\tStatut...'}
            />
            <button type="submit" className="btn-primary mt-md w-full flex items-center justify-center gap-sm" disabled={loading}>
              {loading ? 'Import en cours...' : "Lancer l'import"}
            </button>
          </form>
        </div>

        <div className="flex-col gap-lg">
          {results ? (
            <div className="card">
              <h2 className="text-lg font-bold mb-md">Resultats</h2>
              <div className="flex-col gap-sm">
                <div className="flex justify-between">
                  <span>Lignes totales</span>
                  <span className="font-bold">{results.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Creees</span>
                  <span className="font-bold text-applied">{results.created}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ignorees / erreurs</span>
                  <span className="font-bold text-rejected">{results.skipped}</span>
                </div>
              </div>

              {results.errors?.length > 0 ? (
                <div className="mt-lg">
                  <h3 className="text-sm font-bold text-rejected mb-sm">Erreurs :</h3>
                  <div className="text-xs flex-col gap-xs" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {results.errors.map((item: any, index: number) => (
                      <div key={index} className="text-dim">Ligne {item.row} : {item.reason}</div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="card">
            <h2 className="text-sm font-bold mb-md">Correspondance des colonnes</h2>
            <ul className="text-sm text-dim flex-col gap-xs" style={{ paddingLeft: '1.2rem' }}>
              <li>Entreprise (obligatoire)</li>
              <li>Poste (obligatoire)</li>
              <li>Type (CDI, Freelance)</li>
              <li>Source (LinkedIn, etc.)</li>
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
