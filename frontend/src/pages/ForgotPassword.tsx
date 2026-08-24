import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { PublicShell } from '../templates/PublicShell';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';
import classes from './Auth.module.scss';

type ForgotPasswordForm = { email: string };

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () => z.object({ email: z.string().email(t('auth.forgot.emailInvalid')) }),
    [t],
  );
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({ defaultValues: { email: '' } });

  useEffect(() => {
    document.title = `${t('auth.forgot.title')} — OfferTrail`;
  }, [t]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setFieldError('email', {
        type: 'manual',
        message: parsed.error.issues[0]?.message ?? t('auth.invalidForm'),
      });
      return;
    }
    try {
      setError(null);
      setMessage(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (resetError) throw resetError;
      setMessage(t('auth.forgot.successMessage'));
    } catch {
      setError(t('auth.forgot.errorMessage'));
    }
  });

  return (
    <PublicShell>
      <section className={classes.card} aria-labelledby="forgot-title">
        <Link className={classes.back} to="/login">
          {t('auth.forgot.backLink')}
        </Link>
        <span className="ot-badge" data-tone="accent">
          {t('auth.forgot.badge')}
        </span>
        <h1 id="forgot-title">{t('auth.forgot.title')}</h1>
        <p>{t('auth.forgot.subtitle')}</p>
        <form
          className={classes.form}
          onSubmit={onSubmit}
          aria-busy={isSubmitting}
        >
          <label className="ot-field" htmlFor="forgot-email">
            <span>{t('auth.emailLabel')}</span>
            <input
              id="forgot-email"
              className="ot-control"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder={t('auth.emailPlaceholder')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'forgot-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <small
                id="forgot-email-error"
                className={classes.fieldError}
                role="alert"
              >
                {errors.email.message}
              </small>
            ) : null}
          </label>
          {message ? (
            <div className="ot-alert" data-tone="success" role="status">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="ot-alert" data-tone="error" role="alert">
              {error}
            </div>
          ) : null}
          <button
            className="ot-button"
            data-variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.submitting') : t('auth.forgot.submit')}
          </button>
        </form>
      </section>
    </PublicShell>
  );
}
