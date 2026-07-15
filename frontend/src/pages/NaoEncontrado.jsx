import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn } from '../components/UI';
import styles from '../styles/NaoEncontrado.module.css';

export default function NaoEncontrado() {
  const nav = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.codigo}>404</div>
      <h1 className={styles.titulo}>Página não encontrada</h1>
      <p className={styles.descricao}>
        A página que você está procurando não existe ou foi movida.
      </p>
      <div className={styles.voltar}>
        <Btn onClick={() => nav('/livros')}>Voltar para o início</Btn>
      </div>
    </div>
  );
}
