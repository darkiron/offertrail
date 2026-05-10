import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Button, Paper, PasswordInput,
  Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import classes from './Login.module.css';

type LoginFormData = { email: string; password: string };

export function LoginPage() {
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading, profile } = useAuth();
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const successMessage =
    (location.state as { message?: string } | null)?.message ?? null;

  const loginSchema = useMemo(() => z.object({
    email: z.string().email(t('auth.emailInvalid')),
    password: z.string().min(8, t('auth.passwordMin')),
  }), [t]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  if (!isLoading && isAuthenticated) {
    const nextPath = (location.state as { from?: string } | null)?.from ?? null;
    if (profile?.subscription_status !== 'active') {
      return <Navigate to="/app/checkout" replace />;
    }
    return <Navigate to={nextPath ?? '/app'} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName === 'email' || fieldName === 'password') {
          setError(fieldName, { type: 'manual', message: issue.message });
        }
      });
      setFormError(result.error.issues[0]?.message ?? t('auth.invalidForm'));
      return;
    }

    try {
      setFormError(null);
      clearErrors();
      await signIn(result.data.email, result.data.password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('auth.login.error'));
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.frame} radius="xl" withBorder shadow="xl">
        {/* ── Left panel ── */}
        <aside className={classes.story}>
          <span className={classes.eyebrow}>{t('auth.login.storyEyebrow')}</span>
          <h1 className={classes.storyTitle}>{t('auth.login.storyTitle')}</h1>
          <Text c="dimmed">{t('auth.login.storyDesc')}</Text>
          <Stack gap="sm" mt="xl">
            {[
              { title: t('auth.login.point1Title'), desc: t('auth.login.point1Desc') },
              { title: t('auth.login.point2Title'), desc: t('auth.login.point2Desc') },
              { title: t('auth.login.point3Title'), desc: t('auth.login.point3Desc') },
            ].map((point) => (
              <div key={point.title} className={classes.point}>
                <Text fw={800} size="sm">{point.title}</Text>
                <Text c="dimmed" size="sm" mt={4}>{point.desc}</Text>
              </div>
            ))}
          </Stack>
        </aside>

        {/* ── Right panel ── */}
        <div className={classes.panel}>
          <Anchor component={Link} to="/" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
            {t('auth.login.backLink')}
          </Anchor>

          <Title order={2} mb={4}>{t('auth.login.title')}</Title>
          <Text c="dimmed" size="sm" mb="xl">{t('auth.login.subtitle')}</Text>

          <Stack component="form" gap="md" onSubmit={onSubmit}>
            {successMessage && (
              <Text c="dimmed" size="sm">{successMessage}</Text>
            )}

            <TextInput
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label={t('auth.passwordLabel')}
              placeholder={t('auth.login.passwordPlaceholder')}
              autoComplete="current-password"
              description={t('auth.login.passwordHint')}
              error={errors.password?.message}
              {...register('password')}
            />

            {formError && (
              <Alert color="red" variant="light">{formError}</Alert>
            )}

            <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
              {t('auth.login.submit')}
            </Button>
          </Stack>

          <Text size="sm" c="dimmed" mt="lg">
            <Anchor component={Link} to="/forgot-password" size="sm">{t('auth.login.forgotLink')}</Anchor>
            {' · '}
            {t('auth.login.noAccount')}{' '}
            <Anchor component={Link} to="/register" size="sm">{t('auth.login.registerLink')}</Anchor>
          </Text>
        </div>
      </Paper>
    </section>
  );
}
