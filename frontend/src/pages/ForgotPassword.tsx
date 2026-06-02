import { useMemo, useState } from 'react';
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

type ForgotPasswordForm = { email: string };

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(() => z.object({
    email: z.string().email(t('auth.forgot.emailInvalid')),
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('auth.invalidForm'));
      return;
    }

    try {
      setError(null);
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (supabaseError) throw supabaseError;
      setMessage(t('auth.forgot.successMessage'));
    } catch {
      setError(t('auth.forgot.errorMessage'));
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Anchor component={Link} to="/login" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
          {t('auth.forgot.backLink')}
        </Anchor>

        <Group gap="xs" mb="xs">
          <Badge variant="light" size="sm">{t('auth.forgot.badge')}</Badge>
        </Group>
        <Title order={2} mb={4}>{t('auth.forgot.title')}</Title>
        <Text c="dimmed" size="sm" mb="xl">{t('auth.forgot.subtitle')}</Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
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

          {message && (
            <Alert color="green" variant="light">{message}</Alert>
          )}
          {error && (
            <Alert color="red" variant="light">{error}</Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
            {t('auth.forgot.submit')}
          </Button>
        </Stack>
      </Paper>
    </section>
  );
}
