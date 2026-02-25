import { Navigate } from "react-router-dom";
import { estaAutenticado } from "../api.js";

export default function RotaProtegida({ children }) {
  if (!estaAutenticado()) {
    return <Navigate to="/Login" replace />;
  }
  return children;
}