import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../services/api';

const resetStyles = `
  .signup-shell {
    min-height: calc(100vh - 140px);
    display: grid;
    place-items: center;
    padding: 48px 24px 72px;
  }

  .signup-card {
    width: min(760px, 100%);
    border-radius: 28px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 20%, transparent), transparent 35%),
      linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 95%, transparent), color-mix(in srgb, var(--bg-crust) 92%, transparent));
    padding: 42px;
    box-shadow: 0 26px 80px rgba(0, 0, 0, 0.18);
  }

  .signup-head, .signup-form, .signup-field { display: grid; gap: 18px; }
  .signup-kicker, .signup-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
  .signup-kicker { display: inline-flex; padding: 8px 12px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 14%, transparent); }
  .signup-title { margin: 16px 0 10px; font-size: clamp(2rem, 4vw, 3rem); line-height: 1; letter-spacing: -0.04em; }
  .signup-copy, .signup-footer { color: var(--text-dim); }
  .signup-input {
    width: 100%; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
    background: color-mix(in srgb, var(--bg-base) 88%, transparent); color: var(--text-main); padding: 14px 16px; outline: none;
  }
  .signup-helper { color: var(--status-rejected); font-size: 0.84rem; }
  .signup-error { padding: 12px 14px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--status-rejected) 70%, transparent); background: color-mix(in srgb, var(--status-rejected) 10%, transparent); color: var(--status-rejected); }
  .signup-submit { width: 100%; border-radius: 16px; padding: 15px 18px; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%)); color: white; font-weight: 800; }
`;

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
    <>
      <style>{resetStyles}</style>
      <section className="signup-shell">
      <div className="signup-card" style={{ maxWidth: 640 }}>
        <div className="signup-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="signup-kicker">Nouveau mot de passe</div>
            <h1 className="signup-title">Réinitialiser le mot de passe</h1>
            <p className="signup-copy">Choisis un nouveau mot de passe sécurisé pour ton compte OfferTrail.</p>
          </div>
        </div>

        <form className="signup-form" onSubmit={onSubmit}>
          <div className="signup-field">
            <label className="signup-label" htmlFor="password">Nouveau mot de passe</label>
            <input id="password" className="signup-input" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password ? <div className="signup-helper">{errors.password.message}</div> : null}
          </div>

          <div className="signup-field">
            <label className="signup-label" htmlFor="confirmPassword">Confirmation</label>
            <input id="confirmPassword" className="signup-input" type="password" autoComplete="new-password" {...register('confirmPassword')} />
            {errors.confirmPassword ? <div className="signup-helper">{errors.confirmPassword.message}</div> : null}
          </div>

          {error ? <div className="signup-error">{error}</div> : null}

          <button className="signup-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>

        <div className="signup-footer">
          <Link to="/forgot-password">Demander un nouveau lien</Link>
        </div>
      </div>
      </section>
    </>
  );
}
