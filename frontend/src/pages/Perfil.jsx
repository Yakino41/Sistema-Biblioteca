import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Btn, Input, Grid, Alert, Spinner, Badge } from '../components/UI';
import styles from '../styles/Perfil.module.css';

export default function Perfil() {
  const [usuario,  setUsuario]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editando, setEditando] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [erro,     setErro]     = useState('');
  const [form,     setForm]     = useState({
    senhaAtual: '', novaSenha: '', confirmarSenha: '',
  });

  useEffect(() => {
    api.get('/auth/perfil')
      .then(r => {
        setUsuario(r.data);
        // Mantém nome no localStorage sempre atualizado
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...user, nome: r.data.nome }));
      })
      .catch(() => toast.error('Não foi possível carregar o perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function salvarSenha(e) {
    e.preventDefault();
    setErro('');

    if (!form.senhaAtual) { setErro('Informe a senha atual.'); return; }
    if (!form.novaSenha)  { setErro('Informe a nova senha.'); return; }
    if (form.novaSenha.length < 6) { setErro('A nova senha deve ter ao menos 6 caracteres.'); return; }
    if (form.novaSenha !== form.confirmarSenha) { setErro('As senhas não coincidem.'); return; }

    setSaving(true);
    try {
      // Usa o endpoint dedicado de troca de senha — mais seguro e correto
      await api.put('/auth/alterar-senha', {
        senhaAtual: form.senhaAtual,
        novaSenha:  form.novaSenha,
      });
      toast.success('Senha alterada com sucesso.');
      cancelar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao alterar senha.');
    } finally {
      setSaving(false);
    }
  }

  function cancelar() {
    setEditando(false);
    setErro('');
    setForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
  }

  return (
    <Layout>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Meu Perfil</h1>
        <p className={styles.pageSubtitle}>Informações da sua conta</p>
      </div>

      {loading ? <Spinner /> : usuario && (
        <>
          {/* Dados do usuário */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Dados da conta</div>

            <div className={styles.campo}>
              <span className={styles.campoLabel}>Nome</span>
              <span className={styles.campoValor}>{usuario.nome}</span>
            </div>

            <div className={styles.campo}>
              <span className={styles.campoLabel}>E-mail</span>
              <span className={styles.campoValor}>{usuario.email}</span>
            </div>

            {usuario.cpf && (
              <div className={styles.campo}>
                <span className={styles.campoLabel}>CPF</span>
                <span className={styles.campoValor}>{usuario.cpf}</span>
              </div>
            )}

            {usuario.telefone && (
              <div className={styles.campo}>
                <span className={styles.campoLabel}>Telefone</span>
                <span className={styles.campoValor}>{usuario.telefone}</span>
              </div>
            )}

            {usuario.endereco && (
              <div className={styles.campo}>
                <span className={styles.campoLabel}>Endereço</span>
                <span className={styles.campoValor}>{usuario.endereco}</span>
              </div>
            )}

            <div className={styles.campo}>
              <span className={styles.campoLabel}>Perfil</span>
              <Badge label={usuario.tipo} />
            </div>

            <div className={styles.campo}>
              <span className={styles.campoLabel}>Status</span>
              <Badge label={usuario.status} />
            </div>
          </div>

          {/* Alterar senha */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Alterar senha</div>

            {!editando ? (
              <Btn variant="ghost" onClick={() => setEditando(true)}>Alterar senha</Btn>
            ) : (
              <form onSubmit={salvarSenha}>
                <Alert msg={erro} onClose={() => setErro('')} />
                <Input
                  label="Senha atual"
                  type="password"
                  value={form.senhaAtual}
                  onChange={set('senhaAtual')}
                  placeholder="••••••••"
                  required
                />
                <Grid cols={2}>
                  <Input
                    label="Nova senha"
                    type="password"
                    value={form.novaSenha}
                    onChange={set('novaSenha')}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <Input
                    label="Confirmar nova senha"
                    type="password"
                    value={form.confirmarSenha}
                    onChange={set('confirmarSenha')}
                    placeholder="Repita a nova senha"
                    required
                  />
                </Grid>
                <div className={styles.formActions}>
                  <Btn variant="ghost" type="button" onClick={cancelar}>Cancelar</Btn>
                  <Btn type="submit" disabled={saving}>
                    {saving ? 'Salvando…' : 'Salvar nova senha'}
                  </Btn>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
