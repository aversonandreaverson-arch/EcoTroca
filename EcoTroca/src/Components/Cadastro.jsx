// Importa o React e o hook useState para controlar estados
import React, { useState } from "react"

// Importa ícones para os tipos de usuário
import { User, Truck, Building2 } from "lucide-react"

// Importa Link para navegar entre páginas (react-router-dom)
import { Link } from "react-router-dom"

/* 
  Componente Tipo
  Representa um card clicável para escolher o tipo de usuário
  Props:
    - ativo: se este tipo está selecionado
    - onClick: função que será executada ao clicar
    - icon: ícone do tipo
    - label: texto do tipo
*/
const Tipo = ({ ativo, onClick, icon: Icon, label }) => (
  <div
    onClick={onClick} // chama função quando o card é clicado
    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center
      ${ativo ? "bg-green-800 text-white" : "bg-gray-100 text-gray-800"} // muda cor se estiver ativo
    `}
  >
    {/* Ícone do tipo de usuário */}
    <Icon className="mb-2 w-6 h-6 sm:w-8 sm:h-8" />
    {/* Nome do tipo */}
    <span className="text-sm sm:text-base font-medium">{label}</span>
  </div>
)

/* 
  Componente Campo
  Representa um campo do formulário
  Props:
    - label: texto que indica o que preencher
    - obrigatório: se o campo é obrigatório (*)
    - type: tipo do input (text, email, password, date, etc.)
    - hint: texto de dica (placeholder extra)
*/
const Campo = ({ label, obrigatório, type = "text", hint }) => (
  <div className="flex flex-col">
    {/* Label do campo */}
    <label className="text-green-700 mb-1 text-sm sm:text-base">
      {label} {obrigatório && <span className="text-red-500">*</span>}
    </label>

    {/* Input */}
    <input
      type={type}
      placeholder={hint || ""}
      className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base w-full"
    />
  </div>
)

// Componente principal Cadastro
const Cadastro = () => {
  // Estado que armazena o tipo de usuário selecionado
  const [tipo, setTipo] = useState("USUARIO")

  // Função que será chamada ao clicar em "Criar conta"
  const handleCriarConta = () => {
    // Por enquanto apenas alerta, depois pode enviar ao back-end
    alert("Cadastro enviado! (ainda não integrado ao back-end)")
  }

  return (
    // Container geral do formulário
    <div id="Cadastro" className="w-full flex justify-center py-12 bg-green-900">
      {/* Caixa branca central do formulário */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">
            Cadastre-se
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Cadastro grátis para usuários, coletadores e empresas.
          </p>
        </div>

        {/* Seção de tipos de usuário */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Tipo ativo={tipo === "USUARIO"} onClick={() => setTipo("USUARIO")} icon={User} label="Usuário" />
          <Tipo ativo={tipo === "COLETADOR"} onClick={() => setTipo("COLETADOR")} icon={Truck} label="Coletador(a)" />
          <Tipo ativo={tipo === "EMPRESA"} onClick={() => setTipo("EMPRESA")} icon={Building2} label="Empresa" />
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          {/* Campos que mudam dependendo do tipo */}
          {tipo !== "EMPRESA" && <Campo label="Nome completo" obrigatório />}
          {tipo === "EMPRESA" && <Campo label="Nome da empresa" obrigatório />}
          <Campo label="Telefone" obrigatório />

          {/* Localização */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Província" obrigatório />
            <Campo label="Município" obrigatório />
          </div>

          <Campo label="Bairro" obrigatório />

          {/* Campos específicos de pessoa física */}
          {tipo !== "EMPRESA" && (
            <>
              <Campo label="BI" />
              <Campo label="Data de nascimento" type="date" obrigatório hint="+18 anos" />
            </>
          )}

          {/* Campos específicos de empresa */}
          {tipo === "EMPRESA" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Horário de abertura" type="time" obrigatório />
              <Campo label="Horário de fechamento" type="time" obrigatório />
            </div>
          )}

          {/* Campos de login */}
          <Campo label="Email" type="email" />
          <Campo label="Senha" type="password" obrigatório />
          <Campo label="Confirmar senha" type="password" obrigatório />
          <Campo label="Foto de perfil" type="file" />
        </div>

        {/* Botão principal */}
        <button
          onClick={handleCriarConta}
          className="w-full mt-6 bg-green-800 text-white py-3 rounded-xl font-semibold text-base"
        >
          Criar conta
        </button>

        {/* Link para login */}
        <p className="text-xs sm:text-sm text-center mt-4 text-gray-600">
          Já tens uma conta?{" "}
          <Link to="/login" className="font-semibold text-green-800 hover:underline">
            Entrar
          </Link>
        </p>

        {/* Observação sobre contas administrativas */}
        <p className="text-xs text-center mt-2 text-gray-400">
          Contas administrativas são criadas apenas internamente.
        </p>
      </div>
    </div>
  )
}

// Exporta o componente Cadastro
export default Cadastro
