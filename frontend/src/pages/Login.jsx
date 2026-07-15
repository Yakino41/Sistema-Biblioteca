import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Btn, Input, Alert } from '../components/UI';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [email,   setEmail]   = useState('');
  const [senha,   setSenha]   = useState('');
  const [erro,    setErro]    = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
      nav('/livros');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao conectar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.formPanel}>
        <div className={styles.formBox}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>Acesse o sistema com sua conta.</p>
          </div>

          <Alert msg={erro} onClose={() => setErro('')} />

          <form onSubmit={handleSubmit}>
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className={styles.submitBtn}>
              <Btn type="submit" disabled={loading} full>
                {loading ? 'Entrando…' : 'Entrar'}
              </Btn>
            </div>
          </form>
        </div>
      </div>

      <div className={styles.decorPanel}>
        <div className={styles.decorLabel}>SISTEMA DE BIBLIOTECA</div>
        <p className={styles.decorText}>
          Gerencie o acervo, empréstimos e leitores em um único lugar.
        </p>
      </div>
    </div>
  );
}
