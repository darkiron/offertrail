import React, { useState } from 'react';
import axios from 'axios';
import { applicationService } from '../services/api';
import type { ImportResponse } from '../services/api';
import { Button } from '../components/atoms/Button';
import { PageHeader } from '../components/molecules/PageHeader';
import { useI18n } from '../i18n';
import classes from './Import.module.css';

export const Import: React.FC = () => {
  const { t } = useI18n();
  const [tsv, setTsv] = useState('');
  const [results, setResults] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{tone:'success'|'error'; message:string} | null>(null);

  React.useEffect(() => {
    document.title = t('import.pageTitle');
  }, [t]);

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tsv.trim()) return;
    setLoading(true);
    try {
      const response = await applicationService.importTsv(tsv);
      setResults(response);
      if (response.created > 0) {
        setTsv('');
        setNotice({ tone: 'success', message: `${response.created} ${t('import.importedSuffix')}` });
      }
    } catch (importError: unknown) {
      const detail = (axios.isAxiosError(importError) && importError.response?.data?.detail) || t('import.errorDefault');
      setNotice({ tone: 'error', message: detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`ot-stack ${classes.shell}`}>
      <PageHeader
        title={t('import.title')}
        description={t('import.description')}
      />

      {notice && <div className="ot-alert" data-tone={notice.tone}>{notice.message}</div>}
      <div className={classes.grid}>
        <section className="ot-panel">
          <span className="ot-kicker">{t('import.sectionTsv')}</span>
          <p className="ot-subtitle">{t('import.tsvHint')}</p>
          <form onSubmit={handleImport}>
            <textarea className={`ot-control ${classes.tsvArea}`}
              value={tsv}
              onChange={(event) => setTsv(event.target.value)}
              placeholder={'Entreprise\tPoste\tType\tSource\tStatut...'}
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t('import.loading') : t('import.submit')}
            </Button>
          </form>
        </section>

        <div className="ot-stack">
          {results ? (
            <section className="ot-panel"><span className="ot-kicker">{t('import.resultsTitle')}</span><div className={classes.metrics}><span>{t('import.totalRows')} <b>{results.total}</b></span><span>{t('import.created')} <b>{results.created}</b></span><span>{t('import.skipped')} <b>{results.skipped}</b></span></div>

              {results.errors?.length > 0 ? (
                <div className="ot-stack-tight"><strong>{t('import.errorsTitle')}</strong><div className={classes.errors}>
                    {results.errors.map((item: ImportResponse['errors'][number], index: number) => (
                      <span key={index} className="ot-subtitle">
                        {t('import.rowPrefix')} {item.row} : {item.reason}
                      </span>
                    ))}
                  </div></div>
              ) : null}
            </section>
          ) : null}

          <section className="ot-panel"><span className="ot-kicker">{t('import.columnsTitle')}</span><ul className="ot-subtitle"><li>{t('import.colCompany')}</li><li>{t('import.colPosition')}</li><li>{t('import.colType')}</li><li>{t('import.colSource')}</li><li>{t('import.colStatus')}</li><li>{t('import.colDate')}</li><li>{t('import.colNotes')}</li></ul></section>
        </div>
      </div>
    </main>
  );
};
