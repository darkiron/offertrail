import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const registerSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(8, 'Mot de passe: 8 caracteres minimum'),
  prenom: z.string().optional(),
  nom: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
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
    } catch {
      setFormError('Inscription impossible');
    }
  });

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <h1 className="title">Creer un compte</h1>
        <p className="subtitle">Workspace local-first avec authentification JWT.</p>
        <form className="box" onSubmit={onSubmit}>
          <div className="field">
            <label className="label" htmlFor="prenom">Prenom</label>
            <div className="control">
              <input id="prenom" className="input" type="text" {...register('prenom')} />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="nom">Nom</label>
            <div className="control">
              <input id="nom" className="input" type="text" {...register('nom')} />
            </div>
          </div>
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
            Creer mon compte
          </button>
        </form>
        <p>
          Deja inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </section>
  );
}
