import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const loginStyles = `
  .auth-shell {
    min-height: calc(100vh - 140px);
    display: grid;
    place-items: center;
    padding: 48px 24px 72px;
  }

  .auth-frame {
    width: min(1080px, 100%);
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
    border-radius: 28px;
    overflow: hidden;
    background:
      linear-gradient(145deg, color-mix(in srgb, var(--bg-mantle) 94%, transparent), color-mix(in srgb, var(--bg-crust) 92%, transparent));
    box-shadow: 0 26px 80px rgba(0, 0, 0, 0.18);
  }

  .auth-story {
    padding: 44px;
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 24%, transparent), transparent 42%),
      linear-gradient(180deg, color-mix(in srgb, var(--bg-surface) 65%, transparent), transparent),
      var(--bg-crust);
    border-right: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
  }

  .auth-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .auth-title {
    margin: 18px 0 14px;
    font-size: clamp(2rem, 4vw, 3.3rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .auth-copy {
    margin: 0;
    max-width: 36rem;
    color: var(--text-dim);
    font-size: 1rem;
  }

  .auth-grid {
    margin-top: 28px;
    display: grid;
    gap: 14px;
  }

  .auth-point {
    padding: 16px 18px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--bg-mantle) 76%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
  }

  .auth-pointTitle {
    font-size: 0.95rem;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .auth-pointCopy {
    color: var(--text-dim);
    font-size: 0.92rem;
  }

  .auth-panel {
    padding: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .auth-cardTitle {
    margin: 0;
    font-size: 1.8rem;
    letter-spacing: -0.03em;
  }

  .auth-cardCopy {
    margin: 10px 0 0;
    color: var(--text-dim);
  }

  .auth-form {
    margin-top: 28px;
    display: grid;
    gap: 18px;
  }

  .auth-field {
    display: grid;
    gap: 8px;
  }

  .auth-label {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .auth-input {
    width: 100%;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
    background: color-mix(in srgb, var(--bg-base) 88%, transparent);
    color: var(--text-main);
    padding: 14px 16px;
    outline: none;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  .auth-input:focus {
    border-color: color-mix(in srgb, var(--accent) 72%, white 28%);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .auth-error {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--status-rejected) 70%, transparent);
    background: color-mix(in srgb, var(--status-rejected) 10%, transparent);
    color: var(--status-rejected);
    font-size: 0.92rem;
  }

  .auth-helper {
    color: var(--status-rejected);
    font-size: 0.84rem;
  }

  .auth-hint {
    color: var(--text-dim);
    font-size: 0.84rem;
  }

  .auth-submit {
    width: 100%;
    border-radius: 16px;
    padding: 15px 18px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%));
    color: white;
    font-weight: 800;
    letter-spacing: 0.01em;
  }

  .auth-submit:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .auth-footer {
    margin-top: 18px;
    color: var(--text-dim);
    font-size: 0.95rem;
  }

  @media (max-width: 920px) {
    .auth-frame {
      grid-template-columns: 1fr;
    }

    .auth-story {
      border-right: none;
      border-bottom: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
    }
  }
`;

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
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

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
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
      await login(result.data.email, result.data.password);
      const nextPath = (location.state as { from?: string } | null)?.from ?? '/app';
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Connexion impossible');
    }
  });

  return (
    <>
      <style>{loginStyles}</style>
      <section className="auth-shell">
        <div className="auth-frame">
          <aside className="auth-story">
            <div className="auth-eyebrow">OfferTrail Workspace</div>
            <h1 className="auth-title">Reprends la main sur ton pipeline de candidatures.</h1>
            <p className="auth-copy">
              Un suivi local-first, structure comme un CRM, avec ton historique, tes relances et tes contacts dans un meme espace.
            </p>
            <div className="auth-grid">
              <div className="auth-point">
                <div className="auth-pointTitle">Vue pipeline exploitable</div>
                <div className="auth-pointCopy">Retrouve rapidement ce qui est en attente, ce qui ghoste et ce qui demande une relance.</div>
              </div>
              <div className="auth-point">
                <div className="auth-pointTitle">Contexte entreprise + contact</div>
                <div className="auth-pointCopy">Chaque candidature garde son contexte, ses notes et son historique d'interactions.</div>
              </div>
              <div className="auth-point">
                <div className="auth-pointTitle">Base locale propre</div>
                <div className="auth-pointCopy">Tes donnees restent chez toi, avec une structure SaaS prete pour la suite.</div>
              </div>
            </div>
          </aside>

          <div className="auth-panel">
            <h2 className="auth-cardTitle">Connexion</h2>
            <p className="auth-cardCopy">Entre dans ton workspace OfferTrail.</p>

            <form className="auth-form" onSubmit={onSubmit}>
              {successMessage ? <div className="auth-pointCopy">{successMessage}</div> : null}
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  placeholder="toi@exemple.fr"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  {...register('email')}
                />
                {errors.email ? <div className="auth-helper">{errors.email.message}</div> : null}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  className="auth-input"
                  type="password"
                  placeholder="Ton mot de passe"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <div className="auth-hint">Compatible avec les gestionnaires de mots de passe comme NordPass.</div>
                {errors.password ? <div className="auth-helper">{errors.password.message}</div> : null}
              </div>

              {formError ? <div className="auth-error">{formError}</div> : null}

              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
              {' · '}
              Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
