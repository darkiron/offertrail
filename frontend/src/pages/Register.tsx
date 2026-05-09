import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Badge, Button, Group, Paper,
  PasswordInput, SimpleGrid, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import classes from './Auth.module.css';

type RegisterFormData = { email: string; password: string; prenom?: string; nom?: string };

export function RegisterPage() {
  const { signUp, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: { email: '', password: '', prenom: '', nom: '' },
  });

  if (isAuthenticated) return <Navigate to="/app" replace />;

  if (confirmed) {
    return (
      <section className={classes.shell}>
        <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
          <Stack gap="md" ta="center">
            <Title order={2}>{t('auth.register.confirmTitle')}</Title>
            <Text c="dimmed">{t('auth.register.confirmDesc')}</Text>
            <Button component={Link} to="/login" variant="light" fullWidth>
              {t('auth.register.backToLogin')}
            </Button>
          </Stack>
        </Paper>
      </section>
    );
  }

  const registerSchema = z.object({
    email: z.string().email(t('auth.register.emailInvalid')),
    password: z.string().min(8, t('auth.register.passwordMin')),
    prenom: z.string().trim().optional(),
    nom: z.string().trim().optional(),
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName === 'email' || fieldName === 'password' || fieldName === 'prenom' || fieldName === 'nom') {
          setError(fieldName as keyof RegisterFormData, { type: 'manual', message: issue.message });
        }
      });
      setFormError(result.error.issues[0]?.message ?? t('auth.register.formInvalid'));
      return;
    }

    try {
      setFormError(null);
      clearErrors();
      await signUp(result.data.email, result.data.password, {
        prenom: result.data.prenom || undefined,
        nom: result.data.nom || undefined,
      });
      setConfirmed(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('auth.register.error'));
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Anchor component={Link} to="/" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
          {t('auth.backToHome')}
        </Anchor>

        <Group gap="xs" mb="xs">
          <Badge variant="light" size="sm">{t('auth.register.badge')}</Badge>
        </Group>
        <Title order={2} mb={4}>{t('auth.register.title')}</Title>
        <Text c="dimmed" size="sm" mb="xl">{t('auth.register.subtitle')}</Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label={t('auth.register.firstName')}
              placeholder={t('auth.register.firstNamePlaceholder')}
              autoComplete="given-name"
              error={errors.prenom?.message}
              {...register('prenom')}
            />
            <TextInput
              label={t('auth.register.lastName')}
              placeholder={t('auth.register.lastNamePlaceholder')}
              autoComplete="family-name"
              error={errors.nom?.message}
              {...register('nom')}
            />
          </SimpleGrid>

          <TextInput
            label={t('auth.register.email')}
            placeholder={t('auth.register.emailPlaceholder')}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordInput
            label={t('auth.register.password')}
            placeholder={t('auth.register.passwordPlaceholder')}
            autoComplete="new-password"
            description={t('auth.register.passwordDesc')}
            error={errors.password?.message}
            {...register('password')}
          />

          {formError && (
            <Alert color="red" variant="light">{formError}</Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
            {t('auth.register.submit')}
          </Button>
        </Stack>

        <Text size="sm" c="dimmed" mt="lg">
          {t('auth.register.alreadyAccount')}{' '}
          <Anchor component={Link} to="/login" size="sm">{t('auth.register.login')}</Anchor>
        </Text>
      </Paper>
    </section>
  );
}
