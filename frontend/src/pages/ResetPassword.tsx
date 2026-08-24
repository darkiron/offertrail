import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { PublicShell } from '../templates/PublicShell';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../i18n';
import { useConfirmPasswordResetMutation } from '@features/auth/useConfirmPasswordResetMutation';
import { clearPasswordRecoveryMarker } from '../utils/passwordRecovery';
import classes from './Auth.module.scss';

type ResetPasswordForm = { password: string; confirmPassword: string };

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isLoading, isPasswordRecovery } = useAuth();
  const confirmPasswordReset = useConfirmPasswordResetMutation();
  const [error, setError] = useState<string | null>(null);
  const hasAuthError = /(^|[?#&])error=|error_description=/.test(
    window.location.hash + window.location.search,
  );
  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t('auth.reset.passwordMin')),
          confirmPassword: z.string().min(8, t('auth.reset.confirmMin')),
        })
        .refine((value) => value.password === value.confirmPassword, {
          message: t('auth.reset.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    document.title = `${t('auth.reset.title')} — OfferTrail`;
  }, [t]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'password' || field === 'confirmPassword') {
          setFieldError(field, { type: 'manual', message: issue.message });
        }
      });
      return;
    }
    try {
      setError(null);
      await confirmPasswordReset.mutateAsync(parsed.data.password);
      clearPasswordRecoveryMarker(sessionStorage);
      navigate('/login', {
        replace: true,
        state: { message: t('auth.reset.successMessage') },
      });
    } catch {
      setError(t('auth.reset.invalidLink'));
    }
  });

  if (isLoading && !hasAuthError) {
    return (
      <PublicShell>
        <section className={classes.card} aria-live="polite" aria-busy="true">
          <p>{t('auth.reset.waiting')}</p>
        </section>
      </PublicShell>
    );
  }

  if (hasAuthError || !isPasswordRecovery) {
    return (
      <PublicShell>
        <section className={classes.card} aria-labelledby="reset-invalid-title">
          <span className="ot-badge" data-tone="error">
            {t('auth.reset.badge')}
          </span>
          <h1 id="reset-invalid-title">{t('auth.reset.invalidTitle')}</h1>
          <p>{t('auth.reset.invalidLink')}</p>
          <Link
            className="ot-button"
            data-variant="primary"
            to="/forgot-password"
          >
            {t('auth.reset.requestNew')}
          </Link>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className={classes.card} aria-labelledby="reset-title">
        <span className="ot-badge" data-tone="accent">
          {t('auth.reset.badge')}
        </span>
        <h1 id="reset-title">{t('auth.reset.title')}</h1>
        <p>{t('auth.reset.subtitle')}</p>
        <form
          className={classes.form}
          onSubmit={onSubmit}
          aria-busy={isSubmitting}
        >
          <label className="ot-field" htmlFor="reset-password">
            <span>{t('auth.reset.passwordLabel')}</span>
            <input
              id="reset-password"
              className="ot-control"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'reset-password-error' : undefined
              }
              {...register('password')}
            />
            {errors.password ? (
              <small
                id="reset-password-error"
                className={classes.fieldError}
                role="alert"
              >
                {errors.password.message}
              </small>
            ) : null}
          </label>
          <label className="ot-field" htmlFor="reset-confirm-password">
            <span>{t('auth.reset.confirmLabel')}</span>
            <input
              id="reset-confirm-password"
              className="ot-control"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? 'reset-confirm-error' : undefined
              }
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <small
                id="reset-confirm-error"
                className={classes.fieldError}
                role="alert"
              >
                {errors.confirmPassword.message}
              </small>
            ) : null}
          </label>
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
            {isSubmitting ? t('auth.submitting') : t('auth.reset.submit')}
          </button>
        </form>
        <Link to="/forgot-password">{t('auth.reset.requestNew')}</Link>
      </section>
    </PublicShell>
  );
}
