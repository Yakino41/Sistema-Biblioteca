import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Layout from '../components/Layout';

import { Btn, Input, Select, Grid, Table, Badge, Modal, Alert, Spinner, SearchBar, useConfirm } from '../components/UI';
import styles from '../styles/Usuarios.module.css';

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

const VAZIO = {
  nome: '', email: '', senha: '', tipo: 'leitor',
  cpf: '', telefone: '', endereco: '', status: 'ativo',
};

function mascaraCPF(valor) {
  return valor
    .replace(/\D/g, '')           // remove tudo que não é dígito
    .slice(0, 11)                 // limita a 11 dígitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraTelefone(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function validarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(numeros[i]) * (10 - i);
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(numeros[i]) * (11 - i);
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  return digito1 === parseInt(numeros[9]) && digito2 === parseInt(numeros[10]);
}

export default function Usuarios() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const { confirm, Dialog } = useConfirm();
  const eu = getUser();

  // ── Flags de perfil ──────────────────────────────────────
  const isAdmin = eu.tipo === 'administrador';
  const isBibliotecario = eu.tipo === 'bibliotecario';
  const podeGerenciar = isAdmin || isBibliotecario;

  // Bibliotecário só gerencia leitores; admin gerencia todos
  function podeEditar(u) {
    if (isAdmin) return true;
    if (isBibliotecario) return u.tipo === 'leitor';
    return false;
  }

  // Excluir usuário: somente Administrador (seguindo o enunciado — o
  // bibliotecário não tem o verbo "excluir" em nenhum tipo de usuário)
  function podeExcluir(u) {
    if (eu.id === u.id) return false;
    return isAdmin;
  }

  // Inativar/ativar: mesmas regras de edição
  function podeInativar(u) {
    return podeEditar(u) && eu.id !== u.id;
  }

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (busca) params.busca = busca;
      // Bibliotecário só enxerga leitores — força o filtro na query
      // independente do que estiver selecionado no filtroTipo
      if (isBibliotecario) {
        params.tipo = 'leitor';
      } else if (filtroTipo) {
        params.tipo = filtroTipo;
      }
      const { data } = await api.get('/usuarios', { params });
      setLista(data);
    } catch {
      toast.error('Não foi possível carregar os usuários.');
    } finally { setLoading(false); }
  }, [busca, filtroTipo, isBibliotecario]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovo() { setForm(VAZIO); setEditId(null); setErro(''); setModal(true); }
  function abrirEditar(u) { setForm({ ...u, senha: '' }); setEditId(u.id); setErro(''); setModal(true); }

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const tipoFinal = form.tipo || 'leitor';
    if (tipoFinal === 'leitor') {
      if (!form.cpf) { setErro('CPF é obrigatório para leitores.'); return; }
      if (!validarCPF(form.cpf)) { setErro('CPF inválido. Verifique os dígitos informados.'); return; }
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editId && !payload.senha) delete payload.senha;
      // Bibliotecário não pode alterar o tipo — garante no front também
      if (isBibliotecario && editId) payload.tipo = "leitor";
      if (editId) await api.patch('/usuarios/' + editId, payload);
      else await api.post('/usuarios', payload);
      setModal(false);
      toast.success(editId ? 'Usuário atualizado.' : 'Usuário cadastrado.');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar.');
    } finally { setSaving(false); }
  }

  async function alternarStatus(u) {
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    const acao = novoStatus === 'inativo' ? 'Inativar' : 'Reativar';
    confirm(`${acao} o usuário "${u.nome}"?`, async () => {
      try {
        await api.patch('/usuarios/' + u.id, { ...u, senha: undefined, status: novoStatus });
        toast.success(`Usuário ${novoStatus === 'inativo' ? 'inativado' : 'reativado'}.`);
        carregar();
      } catch (err) {
        toast.error(err.response?.data?.erro || 'Erro ao alterar status.');
      }
    });
  }

  function excluir(id, nome) {
    confirm(`Excluir permanentemente o usuário "${nome}"? Esta ação não pode ser desfeita.`, async () => {
      try {
        await api.delete('/usuarios/' + id);
        toast.success('Usuário excluído.');
        carregar();
      } catch (err) {
        toast.error(err.response?.data?.erro || 'Erro ao excluir.');
      }
    });
  }

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Usuários</h1>
          <p className={styles.pageCount}>{lista.length} cadastrado(s)</p>
        </div>
        {/* Somente admin e bibliotecário podem criar usuários */}
        {podeGerenciar && <Btn onClick={abrirNovo}>Novo usuário</Btn>}
      </div>

      <div className={styles.filters}>
        <SearchBar value={busca} onChange={setBusca} placeholder="Nome, e-mail ou CPF…" />
        {/* Bibliotecário só vê leitores — select de perfil não faz sentido para ele */}
        {isAdmin && (
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className={`${styles.filterSelect} ${filtroTipo ? styles.filterSelectActive : ''}`}
          >
            <option value="">Todos os perfis</option>
            <option value="administrador">Administrador</option>
            <option value="bibliotecario">Bibliotecário</option>
            <option value="leitor">Leitor</option>
          </select>
        )}
      </div>

      {loading ? <Spinner /> : (
        <Table
          cols={['Nome', 'E-mail', 'CPF', 'Perfil', 'Status', '']}
          rows={lista.map(u => [
            <span className={styles.cellName}>{u.nome}</span>,
            <span className={styles.cellEmail}>{u.email}</span>,
            <span className={styles.cellDoc}>{u.cpf || '—'}</span>,
            <Badge label={u.tipo} />,
            <Badge label={u.status} />,
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {podeEditar(u) && (
                <Btn size="sm" variant="ghost" onClick={() => abrirEditar(u)}>Editar</Btn>
              )}
              {podeInativar(u) && (
                <Btn
                  size="sm"
                  variant={u.status === 'ativo' ? 'ghost' : 'primary'}
                  onClick={() => alternarStatus(u)}
                >
                  {u.status === 'ativo' ? 'Inativar' : 'Reativar'}
                </Btn>
              )}
              {podeExcluir(u) && (
                <Btn size="sm" variant="danger" onClick={() => excluir(u.id, u.nome)}>Excluir</Btn>
              )}
            </div>,
          ])}
          empty="Nenhum usuário encontrado."
        />
      )}

      {modal && (
        <Modal title={editId ? 'Editar usuário' : 'Novo usuário'} onClose={() => setModal(false)}>
          <Alert msg={erro} onClose={() => setErro('')} />
          <form onSubmit={salvar}>
            <Input label="Nome completo" value={form.nome} onChange={set('nome')} required />
            <Grid cols={2}>
              <Input label="E-mail" type="email" value={form.email} onChange={set('email')} required />
              <Input
                label={editId ? 'Nova senha (opcional)' : 'Senha'}
                type="password" value={form.senha}
                onChange={set('senha')} required={!editId}
                placeholder={editId ? 'Deixe em branco para manter' : ''}
              />
            </Grid>
            <Grid cols={2}>
              {/* Bibliotecário não pode alterar tipo — campo bloqueado */}
              {isAdmin ? (
                <Select label="Perfil" value={form.tipo} onChange={set('tipo')}>
                  <option value="administrador">Administrador</option>
                  <option value="bibliotecario">Bibliotecário</option>
                  <option value="leitor">Leitor</option>
                </Select>
              ) : (
                <Input label="Perfil" value="Leitor" disabled />
              )}
              <Select label="Status" value={form.status} onChange={set('status')}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </Grid>
            <Input
              label={form.tipo === 'leitor' ? 'CPF *' : 'CPF'}
              value={form.cpf || ''}
              onChange={e => setForm(f => ({ ...f, cpf: mascaraCPF(e.target.value) }))}
              placeholder="000.000.000-00"
            />
            <Grid cols={2}>
              <Input label="Telefone" value={form.telefone || ''} onChange={e => setForm(f => ({ ...f, telefone: mascaraTelefone(e.target.value) }))} placeholder="(00) 00000-0000" />
              <Input label="Endereço" value={form.endereco || ''} onChange={set('endereco')} placeholder="Rua, número" />
            </Grid>
            <div className={styles.modalActions}>
              <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Btn>
            </div>
          </form>
        </Modal>
      )}
      <Dialog />
    </Layout>
  );
}