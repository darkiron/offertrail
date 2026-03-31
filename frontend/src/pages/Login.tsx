import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(8, 'Mot de passe: 8 caracteres minimum'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    try {
      setFormError(null);
      await login(result.data.email, result.data.password);
      const nextPath = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(nextPath, { replace: true });
    } catch {
      setFormError('Connexion impossible');
    }
  });

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 480 }}>
        <h1 className="title">Connexion</h1>
        <p className="subtitle">Accede a ton workspace OfferTrail.</p>
        <form className="box" onSubmit={onSubmit}>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <div className="control">
              <input id="email" className="input" type="email" {...register('email')} />
            </div>
            {errors.email ? <p className="help is-danger">{errors.email.message}</p> : null}
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Mot de passe</label>
            <div className="control">
              <input id="password" className="input" type="password" {...register('password')} />
            </div>
            {errors.password ? <p className="help is-danger">{errors.password.message}</p> : null}
          </div>
          {formError ? <p className="help is-danger">{formError}</p> : null}
          <button className={`button is-link is-fullwidth${isSubmitting ? ' is-loading' : ''}`} type="submit">
            Se connecter
          </button>
        </form>
        <p>
          Pas encore de compte ? <Link to="/register">Creer un compte</Link>
        </p>
      </div>
    </section>
  );
}
