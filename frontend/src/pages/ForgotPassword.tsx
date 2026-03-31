import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../services/api';

const forgotStyles = `
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
  .signup-copy, .signup-footer, .auth-pointCopy { color: var(--text-dim); }
  .signup-input {
    width: 100%; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
    background: color-mix(in srgb, var(--bg-base) 88%, transparent); color: var(--text-main); padding: 14px 16px; outline: none;
  }
  .signup-helper { color: var(--status-rejected); font-size: 0.84rem; }
  .signup-error { padding: 12px 14px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--status-rejected) 70%, transparent); background: color-mix(in srgb, var(--status-rejected) 10%, transparent); color: var(--status-rejected); }
  .signup-submit { width: 100%; border-radius: 16px; padding: 15px 18px; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%)); color: white; font-weight: 800; }
`;

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
      const response = await authService.forgotPassword(parsed.data.email);
      setMessage(response.message);
    } catch {
      setError("Impossible d'envoyer la demande pour le moment.");
    }
  });

  return (
    <>
      <style>{forgotStyles}</style>
      <section className="signup-shell">
      <div className="signup-card" style={{ maxWidth: 640 }}>
        <div className="signup-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="signup-kicker">Réinitialisation</div>
            <h1 className="signup-title">Mot de passe oublié</h1>
            <p className="signup-copy">Entre ton email. Si un compte existe, un lien de réinitialisation sera envoyé.</p>
          </div>
        </div>

        <form className="signup-form" onSubmit={onSubmit}>
          <div className="signup-field">
            <label className="signup-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="signup-input"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="toi@exemple.fr"
              {...register('email')}
            />
            {errors.email ? <div className="signup-helper">{errors.email.message}</div> : null}
          </div>

          {message ? <div className="auth-pointCopy">{message}</div> : null}
          {error ? <div className="signup-error">{error}</div> : null}

          <button className="signup-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="signup-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
      </section>
    </>
  );
}
