import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Badge, Button, Group, Paper,
  Stack, Text, TextInput, Title,
} from '@mantine/core';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n';
import classes from './Auth.module.css';

const schema = z.object({
  email: z.email("Saisis une adresse email valide."),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
        values.email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (supabaseError) throw supabaseError;
      setMessage(t('auth.forgotPassword.success'));
    } catch {
      setError(t('auth.forgotPassword.error') || t('auth.login.error'));
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Anchor component={Link} to="/login" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
          ← {t('auth.forgotPassword.backToLogin')}
        </Anchor>

        <Group gap="xs" mb="xs">
          <Badge variant="light" size="sm">{t('auth.resetPassword.title')}</Badge>
        </Group>
        <Title order={2} mb={4}>{t('auth.forgotPassword.title')}</Title>
        <Text c="dimmed" size="sm" mb="xl">
          {t('auth.forgotPassword.subtitle')}
        </Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
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

          {message && (
            <Alert color="green" variant="light">{message}</Alert>
          )}
          {error && (
            <Alert color="red" variant="light">{error}</Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
            {t('auth.forgotPassword.submit')}
          </Button>
        </Stack>
      </Paper>
    </section>
  );
}
