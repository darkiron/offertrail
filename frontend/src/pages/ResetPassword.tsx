import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Paper, Stack, Text } from '@mantine/core';
import { authService } from '../services/api';
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
  const [params] = useSearchParams();
  const token = params.get('token');
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setError(null);
      await authService.resetPassword(token, parsed.data.password);
      navigate('/login', {
        replace: true,
        state: { message: 'Mot de passe mis à jour. Tu peux maintenant te connecter.' },
      });
    } catch {
      setError('Lien invalide ou expiré');
    }
  });

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
