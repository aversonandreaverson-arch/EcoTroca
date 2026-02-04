import React, { useState } from "react";
import { User, Truck, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

// Componente Tipo de Usuário
const Tipo = ({ ativo, onClick, icon: Icon, label }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center
      ${ativo ? "bg-green-800 text-white" : "bg-gray-100 text-gray-800"}
    `}
  >
    <Icon className="mb-2 w-6 h-6 sm:w-8 sm:h-8 " />
    <span className="text-sm sm:text-base font-medium">{label}</span>
  </div>
);

// Componente Campo de formulário
const Campo = ({ label, obrigatório, type = "text", hint }) => (
  <div className="flex flex-col">
    <label className="text-green-700 mb-1 text-sm sm:text-base">
      {label} {obrigatório && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base w-full"
      placeholder={hint || ""}
    />
  </div>
);

const Cadastro = () => {
  const [tipo, setTipo] = useState("USUARIO");

  const handleCriarConta = () => {
    // Aqui você pode integrar com o back-end depois
    alert("Cadastro enviado! (ainda não integrado ao back-end)");
  };
/* foi necessario colocar um id para identificarmos que esta é a area onde será chamada quando clicado no link da navba que é o Cadastro  */
  return (
    <div id="Cadastro" className="w-full flex justify-center py-12 bg-green-900">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* TÍTULO */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">
            Cadastre-se
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Cadastro grátis para usuários, coletadores e empresas.
          </p>
        </div>

        {/* TIPOS DE USUÁRIO */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Tipo ativo={tipo === "USUARIO"} onClick={() => setTipo("USUARIO")} icon={User} label="Usuário" />
          <Tipo ativo={tipo === "COLETADOR"} onClick={() => setTipo("COLETADOR")} icon={Truck} label="Coletador(a)" />
          <Tipo ativo={tipo === "EMPRESA"} onClick={() => setTipo("EMPRESA")} icon={Building2} label="Empresa" />
        </div>

        {/* FORMULÁRIO */}
        <div className="space-y-4">
          {tipo !== "EMPRESA" && <Campo label="Nome completo" obrigatório />}
          {tipo === "EMPRESA" && <Campo label="Nome da empresa" obrigatório />}
          <Campo label="Telefone" obrigatório />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Província" obrigatório />
            <Campo label="Município" obrigatório />
          </div>

          <Campo label="Bairro" obrigatório />

          {tipo !== "EMPRESA" && (
            <>
              <Campo label="BI" />
              <Campo label="Data de nascimento" type="date" obrigatório hint="+18 anos" />
            </>
          )}

          {tipo === "EMPRESA" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Horário de abertura" type="time" obrigatório />
              <Campo label="Horário de fechamento" type="time" obrigatório />
            </div>
          )}

          <Campo label="Email" type="email" />
          <Campo label="Senha" type="password" obrigatório />
          <Campo label="Confirmar senha" type="password" obrigatório />
          <Campo label="Foto de perfil" type="file" />
        </div>

        {/* BOTÃO */}
        <button
          onClick={handleCriarConta}
          className="w-full mt-6 bg-green-800 text-white py-3 rounded-xl font-semibold text-base"
        >
          Criar conta
        </button>

        {/* LINK PARA LOGIN */}
        <p className="text-xs sm:text-sm text-center mt-4 text-gray-600">
          Já tens uma conta?{" "}
          <Link to="/login" className="font-semibold text-green-800 hover:underline">
            Entrar
          </Link>
        </p>

        <p className="text-xs text-center mt-2 text-gray-400">
          Contas administrativas são criadas apenas internamente.
        </p>
      </div>
    </div>
  );
};

export default Cadastro;
