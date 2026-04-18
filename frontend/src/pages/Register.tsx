import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Alert, Anchor, Badge, Button, Group, Paper,
  PasswordInput, SimpleGrid, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import classes from './Auth.module.css';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  prenom: z.string().trim().optional(),
  nom: z.string().trim().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { signUp, isAuthenticated } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: { email: '', password: '', prenom: '', nom: '' },
  });

  if (isAuthenticated) return <Navigate to="/app" replace />;

  if (confirmed) {
    return (
      <section className={classes.shell}>
        <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
          <Stack gap="md" ta="center">
            <Title order={2}>Vérifie ta boîte email</Title>
            <Text c="dimmed">
              Un email de confirmation a été envoyé. Clique sur le lien pour activer ton compte.
            </Text>
            <Button component={Link} to="/login" variant="light" fullWidth>
              Retour à la connexion
            </Button>
          </Stack>
        </Paper>
      </section>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      clearErrors();
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName === 'email' || fieldName === 'password' || fieldName === 'prenom' || fieldName === 'nom') {
          setError(fieldName as keyof RegisterFormData, { type: 'manual', message: issue.message });
        }
      });
      setFormError(result.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setFormError(null);
      clearErrors();
      await signUp(result.data.email, result.data.password, {
        prenom: result.data.prenom || undefined,
        nom: result.data.nom || undefined,
      });
      setConfirmed(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.');
    }
  });

  return (
    <section className={classes.shell}>
      <Paper className={classes.card} radius="xl" withBorder shadow="xl" p={42}>
        <Anchor component={Link} to="/" size="sm" fw={700} c="dimmed" mb="lg" display="inline-block">
          ← OfferTrail
        </Anchor>

        <Group gap="xs" mb="xs">
          <Badge variant="light" size="sm">Nouveau compte</Badge>
        </Group>
        <Title order={2} mb={4}>Créer ton espace OfferTrail</Title>
        <Text c="dimmed" size="sm" mb="xl">
          Structure ta recherche d&apos;emploi avec un CRM conçu pour les candidats sérieux.
        </Text>

        <Stack component="form" gap="md" onSubmit={onSubmit}>
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="Prénom"
              placeholder="Vincent"
              autoComplete="given-name"
              error={errors.prenom?.message}
              {...register('prenom')}
            />
            <TextInput
              label="Nom"
              placeholder="Dupont"
              autoComplete="family-name"
              error={errors.nom?.message}
              {...register('nom')}
            />
          </SimpleGrid>

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
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            description="Utilise un mot de passe unique. NordPass le proposera automatiquement."
            error={errors.password?.message}
            {...register('password')}
          />

          {formError && (
            <Alert color="red" variant="light">{formError}</Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="xs">
            Créer mon compte
          </Button>
        </Stack>

        <Text size="sm" c="dimmed" mt="lg">
          Déjà un compte ?{' '}
          <Anchor component={Link} to="/login" size="sm">Se connecter</Anchor>
        </Text>
      </Paper>
    </section>
  );
}
