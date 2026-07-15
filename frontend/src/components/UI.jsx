import React, { useState } from 'react';
import styles from '../styles/UI.module.css';

/* ── Botão ──────────────────────────────────────── */
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', full }) {
  const cls = [
    styles.btn,
    size === 'sm' ? styles.btnSm : '',
    full ? styles.btnFull : '',
    variant === 'primary' ? styles.btnPrimary
      : variant === 'ghost' ? styles.btnGhost
        : styles.btnDanger,
  ].join(' ');

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/* ── Input ──────────────────────────────────────── */
export function Input({ label, required, rows, ...props }) {
  return (
    <div className={styles.fieldWrapper}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.labelRequired}>*</span>}
        </label>
      )}
      {rows
        ? <textarea rows={rows} className={styles.textarea} {...props} />
        : <input className={styles.input} {...props} />
      }
    </div>
  );
}

/* ── Select ─────────────────────────────────────── */
export function Select({ label, required, children, ...props }) {
  return (
    <div className={styles.fieldWrapper}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.labelRequired}>*</span>}
        </label>
      )}
      <select className={styles.select} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ── Grid ───────────────────────────────────────── */
export function Grid({ cols = 2, children }) {
  return (
    <div className={cols === 3 ? styles.grid3 : styles.grid2}>
      {children}
    </div>
  );
}

/* ── Tabela ─────────────────────────────────────── */
export function Table({ cols, rows, empty = 'Nenhum registro.' }) {
  const [hover, setHover] = useState(null);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} className={styles.th}>{c.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? (
              <tr>
                <td colSpan={cols.length} className={styles.tableEmpty}>{empty}</td>
              </tr>
            )
            : rows.map((r, i) => (
              <tr
                key={i}
                className={hover === i ? `${styles.tr} ${styles.trHover}` : styles.tr}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {r.map((cell, j) => (
                  <td
                    key={j}
                    className={i === rows.length - 1 ? `${styles.td} ${styles.tdLast}` : styles.td}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Badge ──────────────────────────────────────── */
export function Badge({ label }) {
  const map = {
    em_aberto: { background: '#142814', color: '#4ade80' },
    devolvido: { background: '#131328', color: '#818cf8' },
    atrasado: { background: '#2a1212', color: '#f87171' },
    disponivel: { background: '#142814', color: '#4ade80' },
    indisponivel: { background: '#2a1212', color: '#f87171' },
    ativo: { background: '#142814', color: '#4ade80' },
    inativo: { background: '#2a1e0a', color: '#fbbf24' },
    administrador: { background: '#1a1228', color: '#c084fc' },
    bibliotecario: { background: '#0e1e22', color: '#67e8f9' },
    leitor: { background: '#1c1c1c', color: '#a3a3a3' },
  };

  const labels = {
    em_aberto: 'Em Aberto',
    devolvido: 'Devolvido',
    atrasado: 'Atrasado',
    disponivel: 'Disponível',
    indisponivel: 'Indisponível',
    ativo: 'Ativo',
    inativo: 'Inativo',
    administrador: 'Administrador',
    bibliotecario: 'Bibliotecário',
    leitor: 'Leitor',
  };

  const s = map[label] || { background: '#1c1c1c', color: '#a3a3a3' };
  return (
    <span className={styles.badge} style={s}>
      {labels[label] ?? label?.replace(/_/g, ' ') ?? '—'}
    </span>
  );
}

/* ── Modal ──────────────────────────────────────── */
export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div
      className={styles.modalOverlay}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modalBox} style={{ maxWidth: width }}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* ── Alert ──────────────────────────────────────── */
export function Alert({ msg, type = 'error', onClose }) {
  if (!msg) return null;
  const cls = `${styles.alert} ${type === 'success' ? styles.alertSuccess
      : type === 'warn' ? styles.alertWarn
        : styles.alertError
    }`;
  return (
    <div className={cls}>
      <span>{msg}</span>
      {onClose && (
        <button className={styles.alertClose} onClick={onClose} style={{ color: 'inherit' }}>×</button>
      )}
    </div>
  );
}

/* ── Spinner ────────────────────────────────────── */
export function Spinner() {
  return (
    <div className={styles.spinnerWrapper}>
      <div className={styles.spinner} />
    </div>
  );
}

/* ── SearchBar ──────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = 'Buscar…' }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={styles.searchBar}
    />
  );
}

/* ── Hook de confirmação ────────────────────────── */
export function useConfirm() {
  const [state, setState] = useState(null);

  function confirm(msg, cb) { setState({ msg, cb }); }

  function Dialog() {
    if (!state) return null;
    return (
      <Modal title="Confirmar ação" onClose={() => setState(null)} width={360}>
        <p className={styles.confirmText}>{state.msg}</p>
        <div className={styles.confirmActions}>
          <Btn variant="ghost" onClick={() => setState(null)}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => { state.cb(); setState(null); }}>Confirmar</Btn>
        </div>
      </Modal>
    );
  }

  return { confirm, Dialog };
}
