import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Button, Paper, PasswordInput,
  Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import classes from './Login.module.css';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
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
    defaultValues: { email: '', password: '' },
  });

  if (!isLoading && isAuthenticated) {
    const nextPath = (location.state as { from?: string } | null)?.from ?? null;
    if (profile?.subscription_status !== 'active') {
      return <Navigate to="/app/checkout" replace />;
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
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Connexion impossible');
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.frame} radius="xl" withBorder shadow="xl">
        {/* ── Panneau gauche ── */}
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

        {/* ── Panneau droit ── */}
        <div className={classes.panel}>
          <Anchor component={Link} to="/" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
            ← OfferTrail
          </Anchor>

          <Title order={2} mb={4}>Connexion</Title>
          <Text c="dimmed" size="sm" mb="xl">Entre dans ton workspace OfferTrail.</Text>

          <Stack component="form" gap="md" onSubmit={onSubmit}>
            {successMessage && (
              <Text c="dimmed" size="sm">{successMessage}</Text>
            )}

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

            <PasswordInput
              label="Mot de passe"
              placeholder="Ton mot de passe"
              autoComplete="current-password"
              description="Compatible avec les gestionnaires de mots de passe comme NordPass."
              error={errors.password?.message}
              {...register('password')}
            />

            {formError && (
              <Alert color="red" variant="light">{formError}</Alert>
            )}

            <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
              Se connecter
            </Button>
          </Stack>

          <Text size="sm" c="dimmed" mt="lg">
            <Anchor component={Link} to="/forgot-password" size="sm">Mot de passe oublié ?</Anchor>
            {' · '}
            Pas encore de compte ?{' '}
            <Anchor component={Link} to="/register" size="sm">Créer un compte</Anchor>
          </Text>
        </div>
      </Paper>
    </section>
  );
}
