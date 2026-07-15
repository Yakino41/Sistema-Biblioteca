import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Alert, Spinner } from '../components/UI';
import styles from '../styles/Relatorio.module.css';

/* ── Paleta usada em todos os gráficos ─────────────── */
const CORES = {
  verde:  '#4ade80',
  vermelho: '#f87171',
  roxo:   '#818cf8',
  amarelo: '#fbbf24',
  ciano:  '#67e8f9',
  branco: '#f5f5f5',
  muted:  '#737373',
  grade:  '#262626',
};

// Paleta cíclica para gráficos com N categorias variáveis (categoria de livros)
const PALETA_CATEGORIAS = ['#818cf8', '#4ade80', '#fbbf24', '#f87171', '#67e8f9', '#c084fc', '#fb923c'];

/* ── Tooltip customizado (tema escuro) ─────────────── */
function TooltipCustom({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#1c1c1c', border: '1px solid #303030', borderRadius: 6,
      padding: '8px 12px', fontSize: 12
    }}>
      {label && <div style={{ color: '#737373', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill || '#d4d4d4' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

const eixoStyle = { fontSize: 11, fill: CORES.muted };

/* ── Cards numéricos (resumo) ───────────────────────── */
function Card({ label, value, cor }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardValue} style={{ color: cor || CORES.branco }}>
        {value ?? '—'}
      </div>
      <div className={styles.cardLabel}>{label}</div>
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{titulo}</div>
      <div className={styles.cardGrid}>{children}</div>
    </div>
  );
}

/* ── Card com um gráfico dentro ─────────────────────── */
function ChartCard({ titulo, subtitulo, vazio, children }) {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>{titulo}</div>
      {subtitulo && <div className={styles.chartSubtitle}>{subtitulo}</div>}
      {vazio
        ? <div className={styles.chartEmpty}>Sem dados suficientes ainda.</div>
        : <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>
      }
    </div>
  );
}

export default function Relatorio() {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro,    setErro]    = useState('');

  useEffect(() => {
    api.get('/emprestimos/relatorio')
      .then(r => setDados(r.data))
      .catch(() => setErro('Não foi possível carregar o relatório.'))
      .finally(() => setLoading(false));
  }, []);

  const g = dados?.graficos;

  return (
    <Layout>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Relatório</h1>
        <p className={styles.pageSubtitle}>Visão geral do sistema</p>
      </div>

      <Alert msg={erro} onClose={() => setErro('')} />

      {loading ? <Spinner /> : dados && (
        <>
          <Secao titulo="Empréstimos">
            <Card label="Total"      value={dados.emprestimos.total} />
            <Card label="Em aberto"  value={dados.emprestimos.em_aberto}  cor={CORES.verde} />
            <Card label="Atrasados"  value={dados.emprestimos.atrasados}  cor={CORES.vermelho} />
            <Card label="Devolvidos" value={dados.emprestimos.devolvidos} cor={CORES.roxo} />
          </Secao>

          <Secao titulo="Acervo">
            <Card label="Total de livros"  value={dados.livros.total} />
            <Card label="Disponíveis"      value={dados.livros.disponiveis}   cor={CORES.verde} />
            <Card label="Indisponíveis"    value={dados.livros.indisponiveis} cor={CORES.vermelho} />
          </Secao>

          <Secao titulo="Leitores">
            <Card label="Total"    value={dados.leitores.total} />
            <Card label="Ativos"   value={dados.leitores.ativos}   cor={CORES.verde} />
            <Card label="Inativos" value={dados.leitores.inativos} cor={CORES.amarelo} />
          </Secao>

          {g && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Gráficos</div>
              <div className={styles.chartGrid}>

                {/* Status dos empréstimos — pizza */}
                <ChartCard
                  titulo="Status dos empréstimos"
                  vazio={dados.emprestimos.total === 0}
                >
                  <PieChart>
                    <Pie
                      data={g.statusEmprestimos}
                      dataKey="total"
                      nameKey="nome"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {g.statusEmprestimos.map((entry, i) => (
                        <Cell key={i} fill={
                          entry.nome === 'Em aberto'  ? CORES.verde :
                          entry.nome === 'Atrasados'  ? CORES.vermelho :
                          CORES.roxo
                        } />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipCustom />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: CORES.muted }} />
                  </PieChart>
                </ChartCard>

                {/* Empréstimos por mês — linha */}
                <ChartCard
                  titulo="Empréstimos por mês"
                  subtitulo="Últimos 6 meses"
                  vazio={!g.emprestimosPorMes?.some(m => m.total > 0)}
                >
                  <LineChart data={g.emprestimosPorMes}>
                    <CartesianGrid stroke={CORES.grade} vertical={false} />
                    <XAxis dataKey="mes" tick={eixoStyle} axisLine={{ stroke: CORES.grade }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={eixoStyle} axisLine={{ stroke: CORES.grade }} tickLine={false} width={28} />
                    <Tooltip content={<TooltipCustom />} />
                    <Line
                      type="monotone" dataKey="total" name="Empréstimos"
                      stroke={CORES.roxo} strokeWidth={2}
                      dot={{ fill: CORES.roxo, r: 3 }}
                    />
                  </LineChart>
                </ChartCard>

                {/* Livros por categoria — barra */}
                <ChartCard
                  titulo="Livros por categoria"
                  vazio={!g.livrosPorCategoria?.length}
                >
                  <BarChart data={g.livrosPorCategoria}>
                    <CartesianGrid stroke={CORES.grade} vertical={false} />
                    <XAxis
                      dataKey="categoria" tick={eixoStyle}
                      axisLine={{ stroke: CORES.grade }} tickLine={false}
                      interval={0} angle={-20} textAnchor="end" height={50}
                    />
                    <YAxis allowDecimals={false} tick={eixoStyle} axisLine={{ stroke: CORES.grade }} tickLine={false} width={28} />
                    <Tooltip content={<TooltipCustom />} cursor={{ fill: '#1c1c1c' }} />
                    <Bar dataKey="total" name="Livros" radius={[4, 4, 0, 0]}>
                      {g.livrosPorCategoria.map((_, i) => (
                        <Cell key={i} fill={PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartCard>

                {/* Livros mais emprestados — barra horizontal */}
                <ChartCard
                  titulo="Livros mais emprestados"
                  subtitulo="Top 5 — histórico completo"
                  vazio={!g.maisEmprestados?.length}
                >
                  <BarChart data={g.maisEmprestados} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid stroke={CORES.grade} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={eixoStyle} axisLine={{ stroke: CORES.grade }} tickLine={false} />
                    <YAxis
                      type="category" dataKey="titulo" tick={eixoStyle}
                      axisLine={false} tickLine={false}
                      width={110}
                      tickFormatter={t => t.length > 16 ? t.slice(0, 16) + '…' : t}
                    />
                    <Tooltip content={<TooltipCustom />} cursor={{ fill: '#1c1c1c' }} />
                    <Bar dataKey="total" name="Empréstimos" fill={CORES.ciano} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartCard>

              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
