import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Paper, Stack, Text } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import classes from './Login.module.css';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading, profile } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const successMessage =
    (location.state as { message?: string } | null)?.message ?? null;
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Attend que isLoading=false + profil chargé avant de rediriger (évite la race condition)
  if (!isLoading && isAuthenticated) {
    const nextPath = (location.state as { from?: string } | null)?.from ?? null;
    if (!profile || profile.plan !== 'pro') {
      return <Navigate to="/app/pricing" replace />;
    }
    return <Navigate to={nextPath ?? '/app'} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName === 'email' || fieldName === 'password') {
          setError(fieldName, { type: 'manual', message: issue.message });
        }
      });
      setFormError(result.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setFormError(null);
      clearErrors();
      await signIn(result.data.email, result.data.password);
      // Pas de navigate — le garde en tête du composant prend le relais
      // une fois isLoading=false + isAuthenticated=true + profil chargé.
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Connexion impossible');
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.frame} radius="xl" withBorder shadow="xl">
        <aside className={classes.story}>
          <span className={classes.eyebrow}>OfferTrail Workspace</span>
          <h1 className={classes.storyTitle}>Reprends la main sur ton pipeline de candidatures.</h1>
          <Text c="dimmed">
            Un CRM de candidatures SaaS — ton historique, tes relances et tes contacts centralisés dans un seul espace.
          </Text>
          <Stack gap="sm" mt="xl">
            {[
              { title: 'Vue pipeline exploitable', desc: 'Retrouve rapidement ce qui est en attente, ce qui ghoste et ce qui demande une relance.' },
              { title: 'Contexte entreprise + contact', desc: "Chaque candidature garde son contexte, ses notes et son historique d'interactions." },
              { title: 'Base locale propre', desc: 'Tes données restent chez toi, avec une structure SaaS prête pour la suite.' },
            ].map((point) => (
              <div key={point.title} className={classes.point}>
                <Text fw={800} size="sm">{point.title}</Text>
                <Text c="dimmed" size="sm" mt={4}>{point.desc}</Text>
              </div>
            ))}
          </Stack>
        </aside>

        <div className={classes.panel}>
          <Link to="/" className={classes.backLink}>← OfferTrail</Link>
          <h2 className={classes.title}>Connexion</h2>
          <Text c="dimmed" mt={4}>Entre dans ton workspace OfferTrail.</Text>

          <form className={classes.form} onSubmit={onSubmit}>
            {successMessage ? <Text c="dimmed" size="sm">{successMessage}</Text> : null}
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
                placeholder="Ton mot de passe"
                autoComplete="current-password"
                {...register('password')}
              />
              <div className={classes.hint}>Compatible avec les gestionnaires de mots de passe comme NordPass.</div>
              {errors.password ? <div className={classes.helper}>{errors.password.message}</div> : null}
            </div>

            {formError ? <div className={classes.error}>{formError}</div> : null}

            <button className={classes.submit} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className={classes.footer}>
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
            {' · '}
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </div>
        </div>
      </Paper>
    </section>
  );
}
