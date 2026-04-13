import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Paper, Stack, Text } from '@mantine/core';
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
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42} maw={640}>
        <Stack gap={4} mb="xl">
          <span className={classes.kicker}>Réinitialisation</span>
          <h1 className={classes.title}>Mot de passe oublié</h1>
          <Text c="dimmed">Entre ton email. Si un compte existe, un lien de réinitialisation sera envoyé.</Text>
        </Stack>

        <Stack gap="md" component="form" onSubmit={onSubmit}>
          <div className={classes.field}>
            <label className={classes.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={classes.input}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="toi@exemple.fr"
              {...register('email')}
            />
            {errors.email ? <div className={classes.helper}>{errors.email.message}</div> : null}
          </div>

          {message ? <Text c="dimmed" size="sm">{message}</Text> : null}
          {error ? <div className={classes.error}>{error}</div> : null}

          <button className={classes.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </Stack>

        <div className={classes.footer}>
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </Paper>
    </section>
  );
}
