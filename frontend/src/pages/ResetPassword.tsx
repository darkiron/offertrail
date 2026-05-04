import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Badge, Button, Group, Paper,
  PasswordInput, Stack, Text, Title,
} from '@mantine/core';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n';
import classes from './Auth.module.css';

const schema = z
  .object({
    password: z.string().min(8, "Choisis un mot de passe d'au moins 8 caractères."),
    confirmPassword: z.string().min(8, "Confirme ton mot de passe."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Les deux mots de passe doivent être identiques.',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setError(null);
      const { error: supabaseError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });
      if (supabaseError) throw supabaseError;
      navigate('/login', {
        replace: true,
        state: { message: t('auth.resetPassword.success') },
      });
    } catch {
      setError(t('auth.forgotPassword.error') || t('auth.login.error'));
    }
  });

  if (!ready) {
    return (
      <section className={classes.shell}>
        <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
          <Stack gap="md" ta="center">
            <Text c="dimmed">{t('auth.resetPassword.validating')}</Text>
            <Anchor component={Link} to="/forgot-password" size="sm">
              {t('auth.resetPassword.requestNew')}
            </Anchor>
          </Stack>
        </Paper>
      </section>
    );
  }

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Group gap="xs" mb="xs">
          <Badge variant="light" size="sm">{t('auth.resetPassword.badge')}</Badge>
        </Group>
        <Title order={2} mb={4}>{t('auth.resetPassword.title')}</Title>
        <Text c="dimmed" size="sm" mb="xl">
          {t('auth.resetPassword.subtitle')}
        </Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
          <PasswordInput
            label={t('auth.resetPassword.newLabel')}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordInput
            label={t('auth.resetPassword.confirmLabel')}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {error && (
            <Alert color="red" variant="light">{error}</Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
            {t('auth.resetPassword.submit')}
          </Button>
        </Stack>

        <Text size="sm" c="dimmed" mt="lg">
          <Anchor component={Link} to="/forgot-password" size="sm">
            {t('auth.resetPassword.requestNew')}
          </Anchor>
        </Text>
      </Paper>
    </section>
  );
}
