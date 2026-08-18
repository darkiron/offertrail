import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { getLoginMessage, getSafeLoginDestination } from '../utils/authNavigation';
import { PublicShell } from '../components/PublicShell';
import classes from './Auth.module.css';

type LoginFormData = { email: string; password: string };
export function LoginPage() {
  const location = useLocation(); const { signIn, isAuthenticated, isLoading } = useAuth(); const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null); const successMessage = getLoginMessage(location);
  useEffect(() => {
    document.title = `${t('auth.login.title')} — OfferTrail`;
    const robots = document.querySelector('meta[name="robots"]') ?? document.createElement('meta');
    robots.setAttribute('name', 'robots'); robots.setAttribute('content', 'noindex,follow');
    if (!robots.parentElement) document.head.appendChild(robots);
    return () => { robots.setAttribute('content', 'index,follow'); };
  }, [t]);
  const loginSchema = useMemo(() => z.object({ email: z.string().email(t('auth.emailInvalid')), password: z.string().min(8, t('auth.passwordMin')) }), [t]);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<LoginFormData>({ defaultValues: { email: '', password: '' } });
  if (!isLoading && isAuthenticated) return <Navigate to={getSafeLoginDestination(location)} replace />;
  const onSubmit = handleSubmit(async (values) => { const result = loginSchema.safeParse(values); if (!result.success) { clearErrors(); result.error.issues.forEach((issue) => { const field = issue.path[0]; if (field === 'email' || field === 'password') setError(field, { type: 'manual', message: issue.message }); }); setFormError(result.error.issues[0]?.message ?? t('auth.invalidForm')); return; } try { setFormError(null); clearErrors(); await signIn(result.data.email, result.data.password); } catch { setFormError(t('auth.login.error')); } });
  return <PublicShell><section className={classes.card}><Link className={classes.back} to="/">{t('auth.login.backLink')}</Link><div className={classes.heading}><span className={classes.eyebrow}>{t('auth.login.storyEyebrow')}</span><h1>{t('auth.login.title')}</h1><p className={classes.subtitle}>{t('auth.login.subtitle')}</p></div><form className={classes.form} onSubmit={onSubmit} aria-busy={isSubmitting}>{successMessage&&<div className="ot-alert" data-tone="success" role="status">{successMessage}</div>}<label className="ot-field"><span>{t('auth.emailLabel')}</span><input id="login-email" className="ot-control" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" placeholder={t('auth.emailPlaceholder')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} {...register('email')}/>{errors.email&&<small id="login-email-error" className={classes.fieldError} role="alert">{errors.email.message}</small>}</label><label className="ot-field"><span>{t('auth.passwordLabel')}</span><input id="login-password" className="ot-control" type="password" autoComplete="current-password" placeholder={t('auth.login.passwordPlaceholder')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : 'login-password-hint'} {...register('password')}/><small id="login-password-hint" className={classes.hint}>{t('auth.login.passwordHint')}</small>{errors.password&&<small id="login-password-error" className={classes.fieldError} role="alert">{errors.password.message}</small>}</label>{formError&&<div className="ot-alert" data-tone="error" role="alert">{formError}</div>}<button className="ot-button" data-variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting?'…':t('auth.login.submit')}</button></form><p className={classes.meta}><Link to="/forgot-password">{t('auth.login.forgotLink')}</Link><span aria-hidden="true"> · </span>{t('auth.login.noAccount')}{' '}<Link to="/register">{t('auth.login.registerLink')}</Link></p></section></PublicShell>;
}
