import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Paper, Stack, Text } from '@mantine/core';
import { supabase } from '../lib/supabase';
import classes from './Auth.module.css';

const schema = z
  .object({
    password: z.string().min(8, "Choisis un mot de passe d'au moins 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme ton mot de passe."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Les deux mots de passe doivent être identiques.',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export function ResetPasswordPage() {
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
    // Supabase gère la session via le hash fragment #access_token=...&type=recovery
    // onAuthStateChange reçoit PASSWORD_RECOVERY quand le token est valide
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
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
        state: { message: 'Mot de passe mis à jour. Tu peux maintenant te connecter.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lien invalide ou expiré');
    }
  });

  if (!ready) {
    return (
      <section className={classes.shell}>
        <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42} maw={640}>
          <Stack gap="md" ta="center">
            <Text c="dimmed">Validation du lien de réinitialisation...</Text>
            <Link to="/forgot-password">Demander un nouveau lien</Link>
          </Stack>
        </Paper>
      </section>
    );
  }

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42} maw={640}>
        <Stack gap={4} mb="xl">
          <span className={classes.kicker}>Nouveau mot de passe</span>
          <h1 className={classes.title}>Réinitialiser le mot de passe</h1>
          <Text c="dimmed">Choisis un nouveau mot de passe sécurisé pour ton compte OfferTrail.</Text>
        </Stack>

        <Stack gap="md" component="form" onSubmit={onSubmit}>
          <div className={classes.field}>
            <label className={classes.label} htmlFor="password">Nouveau mot de passe</label>
            <input
              id="password"
              className={classes.input}
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password ? <div className={classes.helper}>{errors.password.message}</div> : null}
          </div>

          <div className={classes.field}>
            <label className={classes.label} htmlFor="confirmPassword">Confirmation</label>
            <input
              id="confirmPassword"
              className={classes.input}
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? <div className={classes.helper}>{errors.confirmPassword.message}</div> : null}
          </div>

          {error ? <div className={classes.error}>{error}</div> : null}

          <button className={classes.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </Stack>

        <div className={classes.footer}>
          <Link to="/forgot-password">Demander un nouveau lien</Link>
        </div>
      </Paper>
    </section>
  );
}
