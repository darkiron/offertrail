import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../i18n';
import classes from './Auth.module.scss';
import { PublicShell } from '../components/PublicShell';

type RegisterFormData = {
  email: string;
  password: string;
  prenom?: string;
  nom?: string;
};
export function RegisterPage() {
  const { signUp, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get('plan');
  const requestedPeriod = searchParams.get('period');
  const plan =
    requestedPlan === 'pro' || requestedPlan === 'ultimate'
      ? requestedPlan
      : 'free';
  const period = requestedPeriod === 'yearly' ? 'yearly' : 'monthly';
  const destination =
    plan === 'free' ? '/app' : `/app/checkout?plan=${plan}&period=${period}`;
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.emailInvalid')),
        password: z.string().min(8, t('auth.passwordMin')),
        prenom: z.string().trim().optional(),
        nom: z.string().trim().optional(),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: { email: '', password: '', prenom: '', nom: '' },
  });
  useEffect(() => {
    document.title = `${t('auth.register.title')} — OfferTrail`;
  }, [t]);
  if (isAuthenticated) return <Navigate to={destination} replace />;
  if (confirmed)
    return (
      <PublicShell>
        <section
          className={classes.card}
          aria-labelledby="register-confirm-title"
        >
          <span className="ot-badge" data-tone="success">
            {t('auth.register.badge')}
          </span>
          <h1 id="register-confirm-title">{t('auth.register.confirmTitle')}</h1>
          <p>{t('auth.register.confirmDesc')}</p>
          <Link className="ot-button" data-variant="primary" to="/login">
            {t('auth.register.backToLogin')}
          </Link>
        </section>
      </PublicShell>
    );
  const onSubmit = handleSubmit(async (values) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === 'email' ||
          field === 'password' ||
          field === 'prenom' ||
          field === 'nom'
        )
          setError(field as keyof RegisterFormData, {
            type: 'manual',
            message: issue.message,
          });
      });
      setFormError(result.error.issues[0]?.message ?? t('auth.invalidForm'));
      return;
    }
    try {
      setFormError(null);
      clearErrors();
      await signUp(result.data.email, result.data.password, {
        prenom: result.data.prenom || undefined,
        nom: result.data.nom || undefined,
        plan,
        period,
      });
      setConfirmed(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t('auth.register.error'),
      );
    }
  });
  return (
    <PublicShell>
      <section className={classes.card} aria-labelledby="register-title">
        <Link className={classes.back} to="/">
          {t('auth.register.backLink')}
        </Link>
        <span className="ot-badge" data-tone="accent">
          {t('auth.register.badge')}
        </span>
        <h1 id="register-title">{t('auth.register.title')}</h1>
        <p className={classes.subtitle}>{t('auth.register.subtitle')}</p>
        <form
          className={classes.form}
          onSubmit={onSubmit}
          aria-busy={isSubmitting}
        >
          <div className={classes.grid}>
            <label className="ot-field">
              <span>{t('auth.register.firstNameLabel')}</span>
              <input
                className="ot-control"
                autoComplete="given-name"
                placeholder={t('auth.register.firstNamePlaceholder')}
                {...register('prenom')}
              />
              {errors.prenom && (
                <small className={classes.fieldError}>
                  {errors.prenom.message}
                </small>
              )}
            </label>
            <label className="ot-field">
              <span>{t('auth.register.lastNameLabel')}</span>
              <input
                className="ot-control"
                autoComplete="family-name"
                placeholder={t('auth.register.lastNamePlaceholder')}
                {...register('nom')}
              />
              {errors.nom && (
                <small className={classes.fieldError}>
                  {errors.nom.message}
                </small>
              )}
            </label>
          </div>
          <label className="ot-field">
            <span>{t('auth.emailLabel')}</span>
            <input
              className="ot-control"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder={t('auth.emailPlaceholder')}
              {...register('email')}
            />
            {errors.email && (
              <small className={classes.fieldError}>
                {errors.email.message}
              </small>
            )}
          </label>
          <label className="ot-field">
            <span>{t('auth.passwordLabel')}</span>
            <input
              className="ot-control"
              type="password"
              autoComplete="new-password"
              placeholder={t('auth.register.passwordPlaceholder')}
              {...register('password')}
            />
            <small className={classes.hint}>
              {t('auth.register.passwordHint')}
            </small>
            {errors.password && (
              <small className={classes.fieldError}>
                {errors.password.message}
              </small>
            )}
          </label>
          {formError && (
            <div className="ot-alert" data-tone="error">
              {formError}
            </div>
          )}
          <button
            className="ot-button"
            data-variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.submitting') : t('auth.register.submit')}
          </button>
        </form>
        <p className={classes.meta}>
          {t('auth.register.alreadyAccount')}{' '}
          <Link to="/login">{t('auth.register.loginLink')}</Link>
        </p>
      </section>
    </PublicShell>
  );
}
