import React, { useState } from 'react';
import axios from 'axios';
import {
  applicationService,
  type ImportResponse,
} from '../services/api/applications';
import { Button } from '../components/atoms/Button';
import { PageHeader } from '../components/molecules/PageHeader';
import { useI18n } from '../i18n';
import classes from './Import.module.scss';

export const Import: React.FC = () => {
  const { t } = useI18n();
  const [tsv, setTsv] = useState('');
  const [results, setResults] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    document.title = t('import.pageTitle');
  }, [t]);

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tsv.trim()) return;
    setLoading(true);
    setNotice(null);
    setResults(null);
    try {
      const response = await applicationService.importTsv(tsv);
      setResults(response);
      if (response.created > 0) {
        setTsv('');
        setNotice({
          tone: 'success',
          message: `${response.created} ${t('import.importedSuffix')}`,
        });
      }
    } catch (importError: unknown) {
      const detail =
        (axios.isAxiosError(importError) &&
          importError.response?.data?.detail) ||
        t('import.errorDefault');
      setNotice({ tone: 'error', message: String(detail) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={classes.shell}>
      <PageHeader
        title={t('import.title')}
        description={t('import.description')}
      />

      {notice && (
        <div
          className={classes.notice}
          data-tone={notice.tone}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.message}
        </div>
      )}
      <div className={classes.grid}>
        <section className={classes.panel}>
          <span className={classes.kicker}>{t('import.sectionTsv')}</span>
          <p id="tsv-import-hint" className={classes.subtitle}>
            {t('import.tsvHint')}
          </p>
          <form className={classes.form} onSubmit={handleImport}>
            <label className={classes.label} htmlFor="tsv-import">
              {t('import.inputLabel')}
            </label>
            <textarea
              id="tsv-import"
              className={classes.tsvArea}
              value={tsv}
              onChange={(event) => setTsv(event.target.value)}
              placeholder={t('import.placeholder')}
              aria-describedby="tsv-import-hint"
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t('import.loading') : t('import.submit')}
            </Button>
          </form>
        </section>

        <div className={classes.side}>
          {results ? (
            <section className={classes.panel} aria-live="polite">
              <span className={classes.kicker}>{t('import.resultsTitle')}</span>
              <div className={classes.metrics}>
                <span>
                  {t('import.totalRows')} <b>{results.total}</b>
                </span>
                <span>
                  {t('import.created')} <b>{results.created}</b>
                </span>
                <span>
                  {t('import.skipped')} <b>{results.skipped}</b>
                </span>
              </div>

              {results.errors?.length > 0 ? (
                <div className={classes.resultErrors}>
                  <strong>{t('import.errorsTitle')}</strong>
                  <div className={classes.errors}>
                    {results.errors.map(
                      (
                        item: ImportResponse['errors'][number],
                        index: number,
                      ) => (
                        <span
                          key={`${item.row}-${index}`}
                          className={classes.subtitle}
                        >
                          {t('import.rowPrefix')} {item.row} : {item.reason}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          ) : (
            <section className={classes.empty}>
              <strong>{t('import.emptyTitle')}</strong>
              <p>{t('import.emptyDescription')}</p>
            </section>
          )}

          <section className={classes.panel}>
            <span className={classes.kicker}>{t('import.columnsTitle')}</span>
            <ul className={classes.columns}>
              <li>{t('import.colCompany')}</li>
              <li>{t('import.colPosition')}</li>
              <li>{t('import.colType')}</li>
              <li>{t('import.colSource')}</li>
              <li>{t('import.colStatus')}</li>
              <li>{t('import.colDate')}</li>
              <li>{t('import.colNotes')}</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};
