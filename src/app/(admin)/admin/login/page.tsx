'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  // Prevent open redirect: only allow safe internal relative paths
  const redirect = (rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\') && !rawRedirect.includes(':'))
    ? rawRedirect
    : '/admin';
  const { settings } = useBrand();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Authentication logic ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>

        {/* Logo & heading */}
        <div className={styles.logoArea}>
          <div className={styles.logoContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.loginLogoUrl || '/brand/logo.svg'}
              alt="TECH7 Electronics"
              className={`${styles.logoImg} ${!settings.loginLogoUrl ? styles.defaultLogo : ''}`}
            />
          </div>
          <div className={styles.divider} />
          <h1 className={styles.title}>Painel Administrativo</h1>
          <p className={styles.subtitle}>Acesso restrito para gestão corporativa</p>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.alertError}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail Corporativo</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@tech7.com.br"
              id="login-email-input"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha de Acesso</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              id="login-password-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
            id="login-submit-btn"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <Link href="/" className={styles.backLink}>
          ← Voltar ao site
        </Link>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className={styles.container}><div style={{ color: '#64748B' }}>Carregando...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
