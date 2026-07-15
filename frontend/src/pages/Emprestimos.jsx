import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Btn, Input, Select, Table, Badge, Modal, Alert, Spinner, useConfirm } from '../components/UI';
import styles from '../styles/Emprestimos.module.css';

const getUser    = () => JSON.parse(localStorage.getItem('user') || '{}');
const podeOperar = () => ['administrador', 'bibliotecario'].includes(getUser().tipo);
const isLeitor   = () => getUser().tipo === 'leitor';

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ── Abas disponíveis
// Leitor:        "Meus empréstimos" | "Histórico"
// Admin/Bibliotecario:   "Em aberto / Atrasados" | "Todos" | "Atrasados"
const ABAS_LEITOR = [
  { id: 'ativos',    label: 'Em andamento' },
  { id: 'historico', label: 'Histórico'    },
];
const ABAS_STAFF = [
  { id: 'todos',     label: 'Todos'        },
  { id: 'atrasados', label: 'Atrasados'  },
];

export default function Emprestimos() {
  const eu = getUser();
  const abas = isLeitor() ? ABAS_LEITOR : ABAS_STAFF;

  const [aba,          setAba]          = useState(abas[0].id);
  const [lista,        setLista]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');

  // Filtro por período (data do empréstimo)
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim,    setDataFim]    = useState('');

  // Busca de usuário (só staff)
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuarioId,    setUsuarioId]    = useState('');
  const [sugestoes,    setSugestoes]    = useState([]);

  // Modal de novo empréstimo
  const [modal,     setModal]    = useState(false);
  const [leitores,  setLeitores] = useState([]);
  const [livros,    setLivros]   = useState([]);
  const [leitorId,  setLeitorId] = useState('');
  const [livrosSel, setLivrosSel]= useState([]);
  const [dataPrev,  setDataPrev] = useState(amanha());
  const [obs,       setObs]      = useState('');
  const [saving,    setSaving]   = useState(false);
  const [erro,      setErro]     = useState('');
  const { confirm, Dialog } = useConfirm();

  // ── Carregamento por aba 
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      // Leitor vendo seu histórico completo
      if (isLeitor() && aba === 'historico') {
        const { data } = await api.get('/emprestimos/historico/' + eu.id);
        setLista(data.emprestimos || []);
        setLoading(false);
        return;
      }

      // Aba de atrasados (Só Bibliotecário/Administrador) — o back já filtra só os atrasados
      if (aba === 'atrasados') {
        const { data } = await api.get('/emprestimos/atrasados');
        setLista(data);
        setLoading(false);
        return;
      }

      // Listagem geral (Bibliotecário / Administrador: todos | leitor: só os seus — o back filtra)
      const params = {};
      if (filtroStatus) params.status      = filtroStatus;
      if (usuarioId)    params.usuario_id  = usuarioId;
      if (dataInicio)   params.data_inicio = dataInicio;
      if (dataFim)      params.data_fim    = dataFim;

      // Leitor em "Em andamento": só em_aberto e atrasado
      if (isLeitor() && aba === 'ativos') {
        // Não filtramos aqui — o back já retorna só os do leitor logado.
      }

      const { data } = await api.get('/emprestimos', { params });
      setLista(data);
    } catch {
      toast.error('Não foi possível carregar os empréstimos.');
    } finally { setLoading(false); }
  }, [aba, filtroStatus, usuarioId, dataInicio, dataFim, eu.id]);

  useEffect(() => { carregar(); }, [carregar]);

  // Debounce para busca de usuário (staff)
  useEffect(() => {
    if (!buscaUsuario.trim()) { setSugestoes([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/usuarios', { params: { busca: buscaUsuario, tipo: 'leitor' } });
        setSugestoes(data);
      } catch { setSugestoes([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaUsuario]);

  function selecionarUsuario(u) {
    setBuscaUsuario(u.nome);
    setUsuarioId(u.id);
    setSugestoes([]);
  }

  function limparUsuario() {
    setBuscaUsuario('');
    setUsuarioId('');
    setSugestoes([]);
  }

  async function abrirModal() {
    setErro(''); setLeitorId(''); setLivrosSel([]); setDataPrev(amanha()); setObs('');
    try {
      const [rl, rv] = await Promise.all([
        api.get('/usuarios', { params: { tipo: 'leitor', status: 'ativo' } }),
        // limit alto: essa lista precisa trazer TODOS os livros disponíveis,
        // não apenas a primeira página (o endpoint /livros é paginado por padrão)
        api.get('/livros',   { params: { status: 'disponivel', limit: 1000 } }),
      ]);
      setLeitores(rl.data);
      setLivros(rv.data.livros);
      setModal(true);
    } catch {
      toast.error('Erro ao carregar dados para o empréstimo.');
    }
  }

  function toggleLivro(id) {
    setLivrosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function registrar(e) {
    e.preventDefault();
    if (!livrosSel.length) { setErro('Selecione ao menos um livro.'); return; }
    setSaving(true); setErro('');
    try {
      await api.post('/emprestimos', {
        usuario_id: parseInt(leitorId),
        livros_ids: livrosSel,
        data_prevista_devolucao: dataPrev,
        observacao: obs || undefined,
      });
      setModal(false);
      toast.success('Empréstimo registrado com sucesso.');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar empréstimo.');
    } finally { setSaving(false); }
  }

  function devolver(id) {
    confirm('Confirmar devolução de todos os livros deste empréstimo?', async () => {
      try {
        const { data } = await api.patch('/emprestimos/' + id + '/devolucao');
        if (data.devolvido_com_atraso) {
          toast.warning(`Devolução registrada com ${data.dias_atraso} dia(s) de atraso.`);
        } else {
          toast.success('Devolução registrada no prazo.');
        }
        carregar();
      } catch (err) {
        toast.error(err.response?.data?.erro || 'Erro ao registrar devolução.');
      }
    });
  }

  // Filtra lista para leitor em "Em andamento" (esconde os já devolvidos)
  const listaExibida = (isLeitor() && aba === 'ativos')
    ? lista.filter(e => e.status !== 'devolvido')
    : lista;

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Empréstimos</h1>
          <p className={styles.pageCount}>{listaExibida.length} registro(s)</p>
        </div>
        {/* Leitor NÃO pode registrar empréstimos */}
        {podeOperar() && <Btn onClick={abrirModal}>Novo empréstimo</Btn>}
      </div>

      {/* ── Abas ── */}
      <div className={styles.abas}>
        {abas.map(a => (
          <button
            key={a.id}
            className={`${styles.aba} ${aba === a.id ? styles.abaAtiva : ''}`}
            onClick={() => { setAba(a.id); setFiltroStatus(''); setDataInicio(''); setDataFim(''); }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Filtros (só na aba "todos" para staff) ── */}
      {!isLeitor() && aba === 'todos' && (
        <div className={styles.filterBar}>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className={`${styles.filterSelect} ${filtroStatus ? styles.filterSelectActive : ''}`}
          >
            <option value="">Todos os status</option>
            <option value="em_aberto">Em aberto</option>
            <option value="atrasado">Atrasados</option>
            <option value="devolvido">Devolvidos</option>
          </select>

          {/* Filtro por leitor com autocomplete */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={buscaUsuario}
              onChange={e => { setBuscaUsuario(e.target.value); if (!e.target.value) limparUsuario(); }}
              placeholder="Filtrar por leitor…"
              className={`${styles.filterSelect} ${usuarioId ? styles.filterSelectActive : ''}`}
            />
            {usuarioId && (
              <button
                onClick={limparUsuario}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', fontSize: 16 }}
              >×</button>
            )}
            {sugestoes.length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#1c1c1c', border: '1px solid #333', borderRadius: 6, zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                {sugestoes.map(u => (
                  <div
                    key={u.id}
                    onClick={() => selecionarUsuario(u)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #2a2a2a', color: '#e5e5e5', fontSize: 14 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontWeight: 500 }}>{u.nome}</span>
                    {u.cpf && <span style={{ color: '#737373', marginLeft: 8 }}>{u.cpf}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtro por período (data do empréstimo) */}
          <div className={styles.filtroData}>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              title="Data inicial"
              className={`${styles.filterSelect} ${dataInicio ? styles.filterSelectActive : ''}`}
            />
            <span className={styles.filtroDataSeparador}>até</span>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              title="Data final"
              className={`${styles.filterSelect} ${dataFim ? styles.filterSelectActive : ''}`}
            />
            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(''); setDataFim(''); }}
                className={styles.filtroDataLimpar}
                title="Limpar filtro de data"
              >×</button>
            )}
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <Table
          cols={
            isLeitor()
              // Leitor não precisa ver a coluna "Leitor" — são sempre os dele
              ? ['#', 'Livros', 'Empréstimo', 'Prev. devolução', 'Devolução real', 'Atraso', 'Status']
              : ['#', 'Leitor', 'Livros', 'Empréstimo', 'Prev. devolução', 'Devolução real', 'Atraso', 'Status', '']
          }
          rows={listaExibida.map(e => {
            const baseRow = [
              <span className={styles.cellId}>{e.id}</span>,
              ...(isLeitor() ? [] : [<span className={styles.cellLeitor}>{e.usuario?.nome || '—'}</span>]),
              <span className={styles.cellLivros}>{e.livros?.map(l => l.titulo).join(', ') || '—'}</span>,
              e.data_emprestimo,
              e.data_prevista_devolucao,
              e.data_real_devolucao || <span className={styles.cellVazio}>—</span>,
              e.dias_atraso > 0
                ? <span style={{ color: '#f87171', fontWeight: 500 }}>{e.dias_atraso}d</span>
                : <span className={styles.cellVazio}>—</span>,
              <Badge label={e.status} />,
            ];

            // Botão de devolução só para staff
            if (!isLeitor()) {
              baseRow.push(
                podeOperar() && e.status !== 'devolvido'
                  ? <Btn size="sm" variant="ghost" onClick={() => devolver(e.id)}>Devolver</Btn>
                  : null
              );
            }

            return baseRow;
          })}
          empty="Nenhum empréstimo encontrado."
        />
      )}

      {/* ── Modal de novo empréstimo ── */}
      {modal && (
        <Modal title="Novo empréstimo" onClose={() => setModal(false)} width={520}>
          <Alert msg={erro} onClose={() => setErro('')} />
          <form onSubmit={registrar}>
            <Select label="Leitor" value={leitorId} onChange={e => setLeitorId(e.target.value)} required>
              <option value="">Selecione um leitor…</option>
              {leitores.map(l => (
                <option key={l.id} value={l.id}>
                  {l.nome}{l.cpf ? ' — ' + l.cpf : ''}
                </option>
              ))}
            </Select>

            <div className={styles.livrosLabel}>
              Livros disponíveis
              {livrosSel.length > 0 && (
                <span className={styles.livrosCount}>— {livrosSel.length} selecionado(s)</span>
              )}
            </div>

            {livros.length === 0
              ? <div className={styles.livrosEmpty}>Nenhum livro disponível no momento.</div>
              : (
                <div className={styles.livrosList}>
                  {livros.map(l => {
                    const sel = livrosSel.includes(l.id);
                    return (
                      <div
                        key={l.id}
                        onClick={() => toggleLivro(l.id)}
                        className={`${styles.livroItem} ${sel ? styles.livroItemSel : ''}`}
                      >
                        <div className={`${styles.checkbox} ${sel ? styles.checkboxSel : ''}`}>
                          {sel && <span className={styles.checkmark}>✓</span>}
                        </div>
                        <div className={styles.livroInfo}>
                          <div className={`${styles.livroTitulo} ${sel ? styles.livroTituloSel : ''}`}>{l.titulo}</div>
                          <div className={styles.livroAutor}>{l.autor}</div>
                        </div>
                        <div className={styles.livroDisp}>{l.quantidade_disponivel} disp.</div>
                      </div>
                    );
                  })}
                </div>
              )
            }

            <Input label="Data prevista de devolução" type="date" value={dataPrev} onChange={e => setDataPrev(e.target.value)} required />
            <Input label="Observação (opcional)" value={obs} onChange={e => setObs(e.target.value)} rows={2} />

            <div className={styles.modalActions}>
              <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Registrando…' : 'Registrar'}</Btn>
            </div>
          </form>
        </Modal>
      )}
      <Dialog />
    </Layout>
  );
}