import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import classes from './Auth.module.css';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caracteres'),
  prenom: z.string().trim().optional(),
  nom: z.string().trim().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      prenom: '',
      nom: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName === 'email' || fieldName === 'password' || fieldName === 'prenom' || fieldName === 'nom') {
          setError(fieldName, { type: 'manual', message: issue.message });
        }
      });
      setFormError(result.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setFormError(null);
      clearErrors();
      await registerUser(result.data);
      navigate('/app', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError('Cet email est déjà utilisé.');
        return;
      }
      setFormError(error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.');
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Stack gap={4} mb="xl">
          <span className={classes.kicker}>Nouveau compte</span>
          <h1 className={classes.title}>Creer ton espace OfferTrail.</h1>
          <Text c="dimmed">
            Structure ta recherche d&apos;emploi avec un CRM conçu pour les candidats sérieux.
          </Text>
        </Stack>

        <Stack gap="md" component="form" onSubmit={onSubmit}>
          <div className={classes.grid}>
            <div className={classes.field}>
              <label className={classes.label} htmlFor="prenom">Prenom</label>
              <input
                id="prenom"
                className={classes.input}
                type="text"
                placeholder="Vincent"
                autoComplete="given-name"
                {...register('prenom')}
              />
            </div>
            <div className={classes.field}>
              <label className={classes.label} htmlFor="nom">Nom</label>
              <input
                id="nom"
                className={classes.input}
                type="text"
                placeholder="Dupont"
                autoComplete="family-name"
                {...register('nom')}
              />
            </div>
          </div>

          <div className={classes.field}>
            <label className={classes.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={classes.input}
              type="email"
              placeholder="toi@exemple.fr"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...register('email')}
            />
            {errors.email ? <div className={classes.helper}>{errors.email.message}</div> : null}
          </div>

          <div className={classes.field}>
            <label className={classes.label} htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className={classes.input}
              type="password"
              placeholder="8 caracteres minimum"
              autoComplete="new-password"
              {...register('password')}
            />
            <div className={classes.hint}>Utilise un mot de passe unique. NordPass devrait maintenant le proposer automatiquement.</div>
            {errors.password ? <div className={classes.helper}>{errors.password.message}</div> : null}
          </div>

          {formError ? <div className={classes.error}>{formError}</div> : null}

          <button className={classes.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creation...' : 'Creer mon compte'}
          </button>
        </Stack>

        <div className={classes.footer}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </Paper>
    </section>
  );
}
