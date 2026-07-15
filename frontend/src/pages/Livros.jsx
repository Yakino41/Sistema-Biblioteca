import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Btn, Input, Select, Grid, Table, Badge, Modal, Alert, Spinner, SearchBar, useConfirm } from '../components/UI';
import styles from '../styles/Livros.module.css';

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

// Admin e bibliotecário podem criar e editar livros
// Somente admin pode excluir — conforme spec e rota DELETE /livros/:id
const podeEditar  = () => ['administrador', 'bibliotecario'].includes(getUser().tipo);
const podeExcluir = () => getUser().tipo === 'administrador';

const VAZIO = {
  titulo: '', autor: '', editora: '',
  ano_publicacao: new Date().getFullYear(),
  categoria: '', isbn: '', quantidade_total: 1, descricao: '',
};

const POR_PAGINA = 10;

export default function Livros() {
  const [livros,           setLivros]           = useState([]);
  const [total,            setTotal]            = useState(0);
  const [totalPaginas,     setTotalPaginas]     = useState(1);
  const [pagina,           setPagina]           = useState(1);
  const [loading,          setLoading]          = useState(true);
  const [busca,            setBusca]            = useState('');
  const [buscaDebounced,   setBuscaDebounced]   = useState('');
  const [filtroStatus,     setFiltroStatus]     = useState('');
  const [filtroCategoria,  setFiltroCategoria]  = useState('');
  const [categorias,       setCategorias]       = useState([]);
  const [modal,            setModal]            = useState(false);
  const [detalhe,          setDetalhe]          = useState(null);
  const [form,             setForm]             = useState(VAZIO);
  const [editId,           setEditId]           = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [erro,             setErro]             = useState('');
  const { confirm, Dialog } = useConfirm();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagina, limit: POR_PAGINA };
      if (buscaDebounced)  params.busca     = buscaDebounced;
      if (filtroStatus)    params.status    = filtroStatus;
      if (filtroCategoria) params.categoria = filtroCategoria;
      const { data } = await api.get('/livros', { params });
      setLivros(data.livros);
      setTotal(data.total);
      setTotalPaginas(data.total_paginas);

      // Extrai categorias únicas para o filtro
      if (data.livros.length > 0) {
        setCategorias(prev => {
          const todas = new Set([...prev, ...data.livros.map(l => l.categoria).filter(Boolean)]);
          return [...todas].sort();
        });
      }
    } catch {
      toast.error('Não foi possível carregar os livros.');
    } finally {
      setLoading(false);
    }
  }, [buscaDebounced, filtroStatus, filtroCategoria, pagina]);

  useEffect(() => { carregar(); }, [carregar]);

  // Debounce 400ms na busca
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  // Reseta para página 1 ao mudar filtros
  useEffect(() => { setPagina(1); }, [busca, filtroStatus, filtroCategoria]);

  function abrirNovo()    { setForm(VAZIO); setEditId(null); setErro(''); setModal(true); }
  function abrirEditar(l) { setForm({ ...l }); setEditId(l.id); setErro(''); setModal(true); }
  function abrirDetalhe(l) { setDetalhe(l); }

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function salvar(e) {
    e.preventDefault();
    setSaving(true); setErro('');
    try {
      if (editId) await api.patch('/livros/' + editId, form);
      else        await api.post('/livros', form);
      setModal(false);
      toast.success(editId ? 'Livro atualizado.' : 'Livro cadastrado.');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar.');
    } finally { setSaving(false); }
  }

  function excluir(id, titulo) {
    confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`, async () => {
      try {
        await api.delete('/livros/' + id);
        toast.success('Livro excluído.');
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
          <h1 className={styles.pageTitle}>Livros</h1>
          <p className={styles.pageCount}>{total} {total === 1 ? 'título' : 'títulos'} no acervo</p>
        </div>
        {podeEditar() && <Btn onClick={abrirNovo}>Novo livro</Btn>}
      </div>

      <div className={styles.filters}>
        <SearchBar value={busca} onChange={setBusca} placeholder="Título, autor, categoria ou ISBN…" />

        {/* Filtro por categoria — spec: "Filtrar por categoria" */}
        {categorias.length > 0 && (
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className={`${styles.filterSelect} ${filtroCategoria ? styles.filterSelectActive : ''}`}
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Filtro por disponibilidade — spec: "Filtrar por disponibilidade" */}
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className={`${styles.filterSelect} ${filtroStatus ? styles.filterSelectActive : ''}`}
        >
          <option value="">Todos</option>
          <option value="disponivel">Disponíveis</option>
          <option value="indisponivel">Indisponíveis</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table
            cols={['Título', 'Autor', 'Categoria', 'ISBN', 'Total', 'Disponível', 'Status', '']}
            rows={livros.map(l => [
              <span className={styles.cellTitle} style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => abrirDetalhe(l)}>
                {l.titulo}
              </span>,
              l.autor,
              l.categoria,
              <span className={styles.cellIsbn}>{l.isbn}</span>,
              l.quantidade_total,
              <span className={l.quantidade_disponivel > 0 ? styles.cellQtd : styles.cellQtdZero}>
                {l.quantidade_disponivel}
              </span>,
              <Badge label={l.status} />,
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Btn size="sm" variant="ghost" onClick={() => abrirDetalhe(l)}>Detalhes</Btn>
                {podeEditar()  && <Btn size="sm" variant="ghost"  onClick={() => abrirEditar(l)}>Editar</Btn>}
                {/* Exclusão de livros: SOMENTE administrador */}
                {podeExcluir() && <Btn size="sm" variant="danger" onClick={() => excluir(l.id, l.titulo)}>Excluir</Btn>}
              </div>,
            ])}
            empty="Nenhum livro encontrado."
          />

          {totalPaginas > 1 && (
            <div className={styles.paginacao}>
              <span className={styles.paginacaoInfo}>
                Página {pagina} de {totalPaginas} — {total} registros
              </span>
              <div className={styles.paginacaoBtns}>
                <Btn size="sm" variant="ghost" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>
                  ← Anterior
                </Btn>
                <span className={styles.paginacaoNum}>{pagina}</span>
                <Btn size="sm" variant="ghost" disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}>
                  Próxima →
                </Btn>
              </div>
            </div>
          )}
        </>
      )}

      {detalhe && (
        <Modal title={detalhe.titulo} onClose={() => setDetalhe(null)} width={520}>
          <Grid cols={2}>
            <div><strong>Autor:</strong> {detalhe.autor}</div>
            <div><strong>Editora:</strong> {detalhe.editora}</div>
            <div><strong>Ano:</strong> {detalhe.ano_publicacao}</div>
            <div><strong>Categoria:</strong> {detalhe.categoria}</div>
            <div><strong>ISBN:</strong> {detalhe.isbn}</div>
            <div><strong>Status:</strong> <Badge label={detalhe.status} /></div>
            <div><strong>Qtd. total:</strong> {detalhe.quantidade_total}</div>
            <div><strong>Qtd. disponível:</strong> {detalhe.quantidade_disponivel}</div>
          </Grid>
          <div style={{ marginTop: 16 }}>
            <strong>Descrição</strong>
            <p style={{ marginTop: 6, lineHeight: 1.5, color: detalhe.descricao ? 'inherit' : '#888', fontStyle: detalhe.descricao ? 'normal' : 'italic' }}>
              {detalhe.descricao || 'Sem descrição cadastrada.'}
            </p>
          </div>
          <div className={styles.modalActions}>
            <Btn variant="ghost" onClick={() => setDetalhe(null)}>Fechar</Btn>
            {podeEditar() && (
              <Btn onClick={() => { setDetalhe(null); abrirEditar(detalhe); }}>Editar</Btn>
            )}
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={editId ? 'Editar livro' : 'Novo livro'} onClose={() => setModal(false)} width={520}>
          <Alert msg={erro} onClose={() => setErro('')} />
          <form onSubmit={salvar}>
            <Input label="Título" value={form.titulo} onChange={set('titulo')} required />
            <Grid cols={2}>
              <Input label="Autor"   value={form.autor}   onChange={set('autor')}   required />
              <Input label="Editora" value={form.editora} onChange={set('editora')} required />
            </Grid>
            <Grid cols={3}>
              <Input label="Ano"        type="number" value={form.ano_publicacao}   onChange={set('ano_publicacao')}  required />
              <Input label="Categoria"               value={form.categoria}         onChange={set('categoria')}        required />
              <Input label="Qtd. total" type="number" value={form.quantidade_total} onChange={set('quantidade_total')} required min={1} />
            </Grid>
            <Input label="ISBN" value={form.isbn} onChange={set('isbn')} required />
            <Input label="Descrição (opcional)" value={form.descricao || ''} onChange={set('descricao')} rows={2} />
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
