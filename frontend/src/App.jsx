import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login         from './pages/Login';
import Livros        from './pages/Livros';
import Usuarios      from './pages/Usuarios';
import Emprestimos   from './pages/Emprestimos';
import Relatorio     from './pages/Relatorio';
import Perfil        from './pages/Perfil';
import NaoEncontrado from './pages/NaoEncontrado';
import SemPermissao from './pages/SemPermissao';

function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

function Private({ children }) {
  return localStorage.getItem('token')
    ? children
    : <Navigate to="/" replace />;
}

function AdminOnly({ children }) {
  return getUser().tipo === 'administrador'
    ? children
    : <SemPermissao />;
}

function StaffOnly({ children }) {
  return ['administrador', 'bibliotecario'].includes(getUser().tipo)
    ? children
    : <SemPermissao />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />

      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/livros" element={
          <Private><Livros /></Private>
        } />

        <Route path="/usuarios" element={
          <Private><StaffOnly><Usuarios /></StaffOnly></Private>
        } />

        <Route path="/emprestimos" element={
          <Private><Emprestimos /></Private>
        } />

        <Route path="/relatorio" element={
          <Private><AdminOnly><Relatorio /></AdminOnly></Private>
        } />

        <Route path="/perfil" element={
          <Private><Perfil /></Private>
        } />

        {/* Página 404 — qualquer rota não mapeada */}
        <Route path="*" element={<NaoEncontrado />} />

        
      </Routes>
    </BrowserRouter>
  );
}
