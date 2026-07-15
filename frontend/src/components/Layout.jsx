import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Layout.module.css';

function NavItem({ to, label, active }) {
  const cls = active
    ? `${styles.navItem} ${styles.navItemActive}`
    : styles.navItem;
  return <Link to={to} className={cls}>{label}</Link>;
}

export default function Layout({ children }) {
  const loc  = useLocation();
  const nav  = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipo = user.tipo || '';

  const links = [
    { to: '/livros',      label: 'Livros' },
    ...(['administrador', 'bibliotecario'].includes(tipo)
      ? [{ to: '/usuarios', label: 'Usuários' }] : []),
    { to: '/emprestimos', label: 'Empréstimos' },
    ...(tipo === 'administrador'
      ? [{ to: '/relatorio', label: 'Relatório' }] : []),
    { to: '/perfil', label: 'Meu Perfil' },
  ];

  function logout() { localStorage.clear(); nav('/'); }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandName}>Biblioteca</div>
          <div className={styles.brandSub}>Sistema de acervo</div>
        </div>
        <nav className={styles.nav}>
          {links.map(l => (
            <NavItem
              key={l.to}
              to={l.to}
              label={l.label}
              active={loc.pathname.startsWith(l.to)}
            />
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userName}>{user.nome || '—'}</div>
          <div className={styles.userRole}>{tipo}</div>
          <button className={styles.logoutBtn} onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
