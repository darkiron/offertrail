import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const registerStyles = `
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

  .signup-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
  }

  .signup-kicker {
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .signup-title {
    margin: 16px 0 10px;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .signup-copy {
    margin: 0;
    max-width: 36rem;
    color: var(--text-dim);
  }

  .signup-badge {
    min-width: 180px;
    padding: 16px 18px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--bg-base) 86%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  }

  .signup-badgeTitle {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 800;
  }

  .signup-badgeValue {
    margin-top: 8px;
    font-size: 1.5rem;
    font-weight: 900;
  }

  .signup-form {
    display: grid;
    gap: 18px;
  }

  .signup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .signup-field {
    display: grid;
    gap: 8px;
  }

  .signup-label {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .signup-input {
    width: 100%;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
    background: color-mix(in srgb, var(--bg-base) 88%, transparent);
    color: var(--text-main);
    padding: 14px 16px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .signup-input:focus {
    border-color: color-mix(in srgb, var(--accent) 72%, white 28%);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .signup-helper {
    color: var(--status-rejected);
    font-size: 0.84rem;
  }

  .signup-hint {
    color: var(--text-dim);
    font-size: 0.84rem;
  }

  .signup-error {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--status-rejected) 70%, transparent);
    background: color-mix(in srgb, var(--status-rejected) 10%, transparent);
    color: var(--status-rejected);
    font-size: 0.92rem;
  }

  .signup-submit {
    width: 100%;
    border-radius: 16px;
    padding: 15px 18px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%));
    color: white;
    font-weight: 800;
  }

  .signup-submit:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .signup-footer {
    margin-top: 16px;
    color: var(--text-dim);
  }

  @media (max-width: 760px) {
    .signup-card {
      padding: 30px 22px;
    }

    .signup-head {
      flex-direction: column;
    }

    .signup-grid {
      grid-template-columns: 1fr;
    }

    .signup-badge {
      min-width: 0;
      width: 100%;
    }
  }
`;

const registerSchema = z.object({
  email: z.email("Saisis une adresse email valide."),
  password: z.string().min(8, "Choisis un mot de passe d'au moins 8 caracteres."),
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
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setFormError(null);
      await registerUser(result.data);
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Inscription impossible');
    }
  });

  return (
    <>
      <style>{registerStyles}</style>
      <section className="signup-shell">
        <div className="signup-card">
          <div className="signup-head">
            <div>
              <div className="signup-kicker">Nouveau workspace</div>
              <h1 className="signup-title">Creer ton espace OfferTrail.</h1>
              <p className="signup-copy">
                Commence avec un compte starter et structure ton suivi de candidatures avec une base propre des le depart.
              </p>
            </div>
            <div className="signup-badge">
              <div className="signup-badgeTitle">Plan actif</div>
              <div className="signup-badgeValue">Starter</div>
            </div>
          </div>

          <form className="signup-form" onSubmit={onSubmit}>
            <div className="signup-grid">
              <div className="signup-field">
                <label className="signup-label" htmlFor="prenom">Prenom</label>
                <input
                  id="prenom"
                  className="signup-input"
                  type="text"
                  placeholder="Vincent"
                  autoComplete="given-name"
                  {...register('prenom')}
                />
              </div>

              <div className="signup-field">
                <label className="signup-label" htmlFor="nom">Nom</label>
                <input
                  id="nom"
                  className="signup-input"
                  type="text"
                  placeholder="Dupont"
                  autoComplete="family-name"
                  {...register('nom')}
                />
              </div>
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="signup-input"
                type="email"
                placeholder="toi@exemple.fr"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...register('email')}
              />
              {errors.email ? <div className="signup-helper">{errors.email.message}</div> : null}
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                className="signup-input"
                type="password"
                placeholder="8 caracteres minimum"
                autoComplete="new-password"
                {...register('password')}
              />
              <div className="signup-hint">Utilise un mot de passe unique. NordPass devrait maintenant le proposer automatiquement.</div>
              {errors.password ? <div className="signup-helper">{errors.password.message}</div> : null}
            </div>

            {formError ? <div className="signup-error">{formError}</div> : null}

            <button className="signup-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>

          <div className="signup-footer">
            Deja inscrit ? <Link to="/login">Se connecter</Link>
          </div>
        </div>
      </section>
    </>
  );
}
