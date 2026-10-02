'use client';

import React, { useState } from 'react';
import { UserPlus, Key, ShieldCheck, CheckCircle2, UserCheck, X } from 'lucide-react';
import { User } from '@/lib/types';

interface UsuariosClientProps {
  initialUsers: Omit<User, 'passwordHash'>[];
}

export function UsuariosClient({ initialUsers }: UsuariosClientProps) {
  const [users, setUsers] = useState<Omit<User, 'passwordHash'>[]>(initialUsers);
  const [modalNewOpen, setModalNewOpen] = useState(false);
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Omit<User, 'passwordHash'> | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR'>('ADMIN');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar usuário.');

      setUsers([...users, data]);
      setModalNewOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setFeedback('Novo administrador cadastrado com sucesso!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha.');

      setModalPasswordOpen(false);
      setNewPassword('');
      setFeedback(`Senha do usuário ${selectedUser.name} alterada com sucesso!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao trocar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Gestão de Acessos & Usuários</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Controle os administradores que possuem credenciais para gerenciar a TECH7 Electronics.
          </p>
        </div>

        <button onClick={() => setModalNewOpen(true)} className="btn btn-primary" id="btn-add-user">
          <UserPlus size={16} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            backgroundColor: 'rgba(0, 230, 118, 0.15)',
            border: '1px solid #00E676',
            color: '#00E676',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Lista de Usuários */}
      <div
        style={{
          backgroundColor: 'var(--brand-surface-card)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)', backgroundColor: '#F8FAFC', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '14px 20px' }}>Usuário / Nome</th>
              <th style={{ padding: '14px 20px' }}>E-mail</th>
              <th style={{ padding: '14px 20px' }}>Nível de Permissão</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-white)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color="var(--brand-primary)" />
                    <span>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(0, 230, 118, 0.12)',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--brand-border-tech)',
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setModalPasswordOpen(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Key size={13} /> Trocar Senha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Usuário */}
      {modalNewOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '460px',
              padding: '32px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Cadastrar Novo Administrador</h2>
              <button
                onClick={() => setModalNewOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex: Carlos Mendes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="carlos@tech7electronics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha Inicial</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nível de Acesso</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="ADMIN">Administrador Completo (ADMIN)</option>
                  <option value="EDITOR">Editor de Catálogo (EDITOR)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setModalNewOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Trocar Senha */}
      {modalPasswordOpen && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '420px',
              padding: '32px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Alterar Senha de Acesso</h2>
              <button
                onClick={() => setModalPasswordOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Definir nova senha para <strong>{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Nova senha segura..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setModalPasswordOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
