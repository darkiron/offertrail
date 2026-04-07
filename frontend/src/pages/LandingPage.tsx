import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg-base)',
      padding: '48px 24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
          color: 'white',
          fontSize: 22,
          fontWeight: 900,
          marginBottom: 24,
        }}>
          OT
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
          OfferTrail
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 36px' }}>
          Suis tes candidatures comme un CRM. Structure ton pipeline, relance au bon moment, garde le contexte de chaque échange.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '13px 24px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              color: 'white',
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Se connecter
          </Link>
          <Link
            to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '13px 24px',
              borderRadius: 999,
              border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
              background: 'transparent',
              color: 'var(--text-main)',
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
};
