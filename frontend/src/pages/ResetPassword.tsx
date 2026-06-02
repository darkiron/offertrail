import { useEffect, useMemo, useState } from 'react';
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

type ResetPasswordForm = { password: string; confirmPassword: string };

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const schema = useMemo(() => z
    .object({
      password: z.string().min(8, t('auth.reset.passwordMin')),
      confirmPassword: z.string().min(8, t('auth.reset.confirmMin')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: t('auth.reset.passwordMismatch'),
      path: ['confirmPassword'],
    }), [t]);

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
      setError(parsed.error.issues[0]?.message ?? t('auth.invalidForm'));
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
        state: { message: t('auth.reset.successMessage') },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.reset.invalidLink'));
    }
  });

  if (!ready) {
    return (
      <section className={classes.shell}>
        <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
          <Stack gap="md" ta="center">
            <Text c="dimmed">{t('auth.reset.waiting')}</Text>
            <Anchor component={Link} to="/forgot-password" size="sm">
              {t('auth.reset.requestNew')}
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
          <Badge variant="light" size="sm">{t('auth.reset.badge')}</Badge>
        </Group>
        <Title order={2} mb={4}>{t('auth.reset.title')}</Title>
        <Text c="dimmed" size="sm" mb="xl">{t('auth.reset.subtitle')}</Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
          <PasswordInput
            label={t('auth.reset.passwordLabel')}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordInput
            label={t('auth.reset.confirmLabel')}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {error && (
            <Alert color="red" variant="light">{error}</Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
            {t('auth.reset.submit')}
          </Button>
        </Stack>

        <Text size="sm" c="dimmed" mt="lg">
          <Anchor component={Link} to="/forgot-password" size="sm">
            {t('auth.reset.requestNew')}
          </Anchor>
        </Text>
      </Paper>
    </section>
  );
}
