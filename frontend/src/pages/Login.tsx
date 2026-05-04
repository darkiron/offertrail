import { useState } from 'react';
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

export function LoginPage() {
  const { t } = useI18n();
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading, profile } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().email(t('auth.validation.email')),
    password: z.string().min(8, t('auth.validation.passwordMin')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  const successMessage =
    (location.state as { message?: string } | null)?.message ?? null;
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
      setFormError(result.error.issues[0]?.message ?? t('auth.login.invalidForm'));
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
        {/* ── Panneau gauche ── */}
        <aside className={classes.story}>
          <span className={classes.eyebrow}>OfferTrail Workspace</span>
          <h1 className={classes.storyTitle}>{t('auth.story.title')}</h1>
          <Text c="dimmed">
            {t('auth.story.copy')}
          </Text>
          <Stack gap="sm" mt="xl">
            {[
              { title: t('auth.story.point1.title'), desc: t('auth.story.point1.desc') },
              { title: t('auth.story.point2.title'), desc: t('auth.story.point2.desc') },
              { title: t('auth.story.point3.title'), desc: t('auth.story.point3.desc') },
            ].map((point) => (
              <div key={point.title} className={classes.point}>
                <Text fw={800} size="sm">{point.title}</Text>
                <Text c="dimmed" size="sm" mt={4}>{point.desc}</Text>
              </div>
            ))}
          </Stack>
        </aside>

        {/* ── Panneau droit ── */}
        <div className={classes.panel}>
          <Anchor component={Link} to="/" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
            ← OfferTrail
          </Anchor>

          <Title order={2} mb={4}>{t('auth.login.title')}</Title>
          <Text c="dimmed" size="sm" mb="xl">{t('auth.login.subtitle')}</Text>

          <Stack component="form" gap="md" onSubmit={onSubmit}>
            {successMessage && (
              <Text c="dimmed" size="sm">{successMessage}</Text>
            )}

            <TextInput
              label={t('auth.login.emailLabel')}
              placeholder={t('auth.login.emailPlaceholder')}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label={t('auth.login.passwordLabel')}
              placeholder={t('auth.login.passwordPlaceholder')}
              autoComplete="current-password"
              description={t('auth.login.passwordDesc')}
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
            <Anchor component={Link} to="/forgot-password" size="sm">{t('auth.login.forgotPassword')}</Anchor>
            {' · '}
            {t('auth.login.noAccount')}{' '}
            <Anchor component={Link} to="/register" size="sm">{t('auth.login.createAccount')}</Anchor>
          </Text>
        </div>
      </Paper>
    </section>
  );
}
