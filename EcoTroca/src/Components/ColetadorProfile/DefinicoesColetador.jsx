import React, { useState, useEffect } from "react";
import { Bell, Lock, Eye, EyeOff } from "lucide-react";
import Header from "./Header.jsx";
import { getPerfil, actualizarPerfil } from "../../api.js";

export default function DefinicoesColetador() {
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhas, setSenhas] = useState({ atual: "", nova: "", confirmar: "" });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [guardando, setGuardando] = useState(false);

  const atualizarSenha = (campo) => (e) =>
    setSenhas((prev) => ({ ...prev, [campo]: e.target.value }));

  const guardarSenha = async () => {
    setErro("");
    setMensagem("");

    if (!senhas.nova || senhas.nova.length < 6) {
      return setErro("A nova senha deve ter pelo menos 6 caracteres.");
    }
    if (senhas.nova !== senhas.confirmar) {
      return setErro("As senhas não coincidem.");
    }

    try {
      setGuardando(true);
      // Envia a nova senha para a API — o backend valida a senha atual
      await actualizarPerfil({ senha_atual: senhas.atual, nova_senha: senhas.nova });
      setMensagem("Senha atualizada com sucesso!");
      setSenhas({ atual: "", nova: "", confirmar: "" });
      setTimeout(() => setMensagem(""), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Definições</h1>

        {/* Notificações */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <Bell size={20} />
            Notificações
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Novos pedidos disponíveis</p>
              <p className="text-sm text-gray-500">Receber alerta quando surgir um pedido perto de ti</p>
            </div>
            <button
              onClick={() => setNotificacoesAtivas(!notificacoesAtivas)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notificacoesAtivas ? "bg-green-500" : "bg-gray-300"
              } relative`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                notificacoesAtivas ? "translate-x-7" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <Lock size={20} />
            Segurança
          </h2>

          <div className="space-y-4">
            {[
              { label: "Senha atual",    campo: "atual" },
              { label: "Nova senha",     campo: "nova" },
              { label: "Confirmar nova", campo: "confirmar" },
            ].map(({ label, campo }) => (
              <div key={campo}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senhas[campo]}
                    onChange={atualizarSenha(campo)}
                    className="w-full border rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-2.5 text-gray-400"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {erro && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">{erro}</p>
          )}
          {mensagem && (
            <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              ✅ {mensagem}
            </p>
          )}

          <button
            onClick={guardarSenha}
            disabled={guardando}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
          >
            {guardando ? "A guardar..." : "Atualizar Senha"}
          </button>
        </div>

      </div>
    </div>
  );
}