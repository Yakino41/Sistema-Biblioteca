import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn } from '../components/UI';
import styles from '../styles/NaoEncontrado.module.css';

export default function SemPermissao() {
  const nav = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.codigo}>403</div>
      <h1 className={styles.titulo}>Acesso negado</h1>
      <p className={styles.descricao}>
        Você não tem permissão para acessar esta página.
      </p>
      <div className={styles.voltar}>
        <Btn onClick={() => nav('/livros')}>Voltar para o início</Btn>
      </div>
    </div>
  );
}