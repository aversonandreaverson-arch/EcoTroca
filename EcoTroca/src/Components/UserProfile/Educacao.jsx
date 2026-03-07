
import React from 'react';
import EducacaoBase from '../EducacaoBase'; // Componente base com o conteúdo
import Header from './Header';              // Header específico do utilizador comum

export default function Educacao() {
  // Passa o Header do utilizador comum para o componente base
  // O EducacaoBase usa este Header no topo da página
  return <EducacaoBase Header={Header} />;
}