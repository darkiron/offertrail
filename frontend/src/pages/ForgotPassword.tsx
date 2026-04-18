import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Badge, Button, Group, Paper,
  Stack, Text, TextInput, Title,
} from '@mantine/core';
import { supabase } from '../lib/supabase';
import classes from './Auth.module.css';

const schema = z.object({
  email: z.email("Saisis une adresse email valide."),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export function ForgotPasswordPage() {
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
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setError(null);
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (supabaseError) throw supabaseError;
      setMessage("Si cet email est enregistré, un lien de réinitialisation a été envoyé.");
    } catch {
      setError("Impossible d'envoyer la demande pour le moment.");
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Anchor component={Link} to="/login" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
          ← Retour à la connexion
        </Anchor>

        <Group gap="xs" mb="xs">
          <Badge variant="light" size="sm">Réinitialisation</Badge>
        </Group>
        <Title order={2} mb={4}>Mot de passe oublié</Title>
        <Text c="dimmed" size="sm" mb="xl">
          Entre ton email. Si un compte existe, un lien de réinitialisation sera envoyé.
        </Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            placeholder="toi@exemple.fr"
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
            Envoyer le lien
          </Button>
        </Stack>
      </Paper>
    </section>
  );
}
