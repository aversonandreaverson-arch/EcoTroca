import { Navigate } from "react-router-dom";
import { estaAutenticado } from "../api.js";

export default function RotaProtegida({ children, tipos }) {
  if (!estaAutenticado()) {
    return <Navigate to="/Login" replace />;
  }
  
  const usuario = getUtilizadorLocal();
  if (tipos && !tipos.includes(usuario?.tipo_usuario)) {
    return <Navigate to="/PaginaInicial" replace />;
  }
  
  return children;
}

import { getUtilizadorLocal } from "../api.js";
