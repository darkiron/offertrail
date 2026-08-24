import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { PublicShell } from '../components/PublicShell';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../i18n';
import {
  getLoginMessage,
  getSafeLoginDestination,
} from '../utils/authNavigation';
import classes from './Auth.module.scss';

type LoginFormData = { email: string; password: string };

export function LoginPage() {
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.emailInvalid')),
        password: z.string().min(8, t('auth.passwordMin')),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ defaultValues: { email: '', password: '' } });

  useEffect(() => {
    document.title = `${t('auth.login.title')} — OfferTrail`;
  }, [t]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={getSafeLoginDestination(location)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          setError(field, { type: 'manual', message: issue.message });
        }
      });
      setFormError(result.error.issues[0]?.message ?? t('auth.invalidForm'));
      return;
    }
    try {
      setFormError(null);
      clearErrors();
      await signIn(result.data.email, result.data.password);
    } catch {
      setFormError(t('auth.login.error'));
    }
  });

  return (
    <PublicShell>
      <section className={classes.card} aria-labelledby="login-title">
        <Link className={classes.back} to="/">
          {t('auth.login.backLink')}
        </Link>
        <div className={classes.heading}>
          <span className={classes.eyebrow}>
            {t('auth.login.storyEyebrow')}
          </span>
          <h1 id="login-title">{t('auth.login.title')}</h1>
          <p className={classes.subtitle}>{t('auth.login.subtitle')}</p>
        </div>
        <form
          className={classes.form}
          onSubmit={onSubmit}
          aria-busy={isSubmitting}
        >
          {getLoginMessage(location) ? (
            <div className="ot-alert" data-tone="success" role="status">
              {getLoginMessage(location)}
            </div>
          ) : null}
          <label className="ot-field" htmlFor="login-email">
            <span>{t('auth.emailLabel')}</span>
            <input
              id="login-email"
              className="ot-control"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder={t('auth.emailPlaceholder')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <small
                id="login-email-error"
                className={classes.fieldError}
                role="alert"
              >
                {errors.email.message}
              </small>
            ) : null}
          </label>
          <label className="ot-field" htmlFor="login-password">
            <span>{t('auth.passwordLabel')}</span>
            <input
              id="login-password"
              className="ot-control"
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.login.passwordPlaceholder')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'login-password-error' : 'login-password-hint'
              }
              {...register('password')}
            />
            <small id="login-password-hint" className={classes.hint}>
              {t('auth.login.passwordHint')}
            </small>
            {errors.password ? (
              <small
                id="login-password-error"
                className={classes.fieldError}
                role="alert"
              >
                {errors.password.message}
              </small>
            ) : null}
          </label>
          {formError ? (
            <div className="ot-alert" data-tone="error" role="alert">
              {formError}
            </div>
          ) : null}
          <button
            className="ot-button"
            data-variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.submitting') : t('auth.login.submit')}
          </button>
        </form>
        <p className={classes.meta}>
          <Link to="/forgot-password">{t('auth.login.forgotLink')}</Link>
          <span aria-hidden="true"> · </span>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register">{t('auth.login.registerLink')}</Link>
        </p>
      </section>
    </PublicShell>
  );
}
