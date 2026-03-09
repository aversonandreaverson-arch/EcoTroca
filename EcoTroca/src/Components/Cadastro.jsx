import React, { useState } from "react";
import { User, Truck, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registar } from "../api.js";

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE VALIDAÇÃO
// Cada função recebe um valor e devolve:
//   - null → campo válido
//   - string → mensagem de erro a mostrar ao utilizador
// ═══════════════════════════════════════════════════════════════

// Valida o nome — só letras e espaços, mínimo 3 caracteres
const validarNome = (nome) => {
  if (!nome.trim()) return "Nome é obrigatório.";
  if (nome.trim().length < 3) return "Nome deve ter pelo menos 3 caracteres.";
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) return "Nome não pode conter números ou caracteres especiais.";
  return null;
};

// Valida o telefone — padrão Angola: 9 dígitos começando por 9
const validarTelefone = (tel) => {
  const limpo = tel.replace(/\s/g, "");
  if (!limpo) return "Telefone é obrigatório.";
  if (!/^[9][0-9]{8}$/.test(limpo))
    return "Telefone inválido. Deve ter 9 dígitos e começar por 9. Ex: 923456789";
  return null;
};

// Valida o email — formato nome@dominio.ext (campo opcional)
const validarEmail = (email) => {
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? null
    : "Email inválido. Ex: nome@email.com";
};

// Valida o BI angolano — formato: 9 dígitos + 2 letras + 3 dígitos (campo opcional)
const validarBI = (bi) => {
  if (!bi) return null;
  if (!/^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(bi.toUpperCase()))
    return "BI inválido. Formato esperado: 000000000LA000";
  return null;
};

// Valida a data de nascimento — utilizador deve ter pelo menos 18 anos
const validarDataNascimento = (data) => {
  if (!data) return "Data de nascimento é obrigatória.";
  const nascimento = new Date(data);
  const hoje = new Date();
  const idade = hoje.getFullYear() - nascimento.getFullYear();
  const aniversarioPassou =
    hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
  const idadeReal = aniversarioPassou ? idade : idade - 1;
  if (idadeReal < 18) return "Tens de ter pelo menos 18 anos para te registar.";
  if (idadeReal > 100) return "Data de nascimento inválida.";
  return null;
};

// Valida a senha — mínimo 6 caracteres, 1 maiúscula, 1 número
const validarSenha = (senha) => {
  if (!senha) return "Senha é obrigatória.";
  if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (!/[A-Z]/.test(senha)) return "A senha deve ter pelo menos uma letra maiúscula.";
  if (!/[0-9]/.test(senha)) return "A senha deve ter pelo menos um número.";
  return null;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Tipo
// Card clicável para o utilizador escolher o seu tipo de conta
// ═══════════════════════════════════════════════════════════════
const Tipo = ({ ativo, onClick, Icon, label }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center transition
      ${ativo
        ? "bg-green-800 text-white border-green-800"
        : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
      }`}
  >
    <Icon className="mb-2 w-6 h-6 sm:w-8 sm:h-8" />
    <span className="text-sm sm:text-base font-medium">{label}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Campo
// Input reutilizável com label, placeholder e mensagem de erro
// ═══════════════════════════════════════════════════════════════
const Campo = ({ label, obrigatorio, type = "text", hint, value, onChange, erro }) => (
  <div className="flex flex-col">
    <label className="text-green-700 mb-1 text-sm sm:text-base">
      {label} {obrigatorio && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      placeholder={hint || ""}
      value={value}
      onChange={onChange}
      className={`border rounded-md p-2 focus:outline-none focus:ring-2 text-sm sm:text-base w-full
        ${erro ? "border-red-400 focus:ring-red-400" : "focus:ring-green-500"}`}
    />
    {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: Cadastro
// ═══════════════════════════════════════════════════════════════
const Cadastro = () => {
  const navigate = useNavigate();

  // Tipo de conta selecionado
  const [tipo,       setTipo]       = useState("comum");
  const [erro,       setErro]       = useState("");
  const [erros,      setErros]      = useState({});
  const [carregando, setCarregando] = useState(false);

  // Após registo com email — mostra ecrã de "verifica o teu email"
  const [verificacaoPendente, setVerificacaoPendente] = useState(false);
  const [emailRegistado,      setEmailRegistado]      = useState("");

  // Estado do formulário
  const [form, setForm] = useState({
    nome: "", telefone: "", provincia: "", municipio: "",
    bairro: "", bi: "", data_nascimento: "",
    horario_abertura: "", horario_fechamento: "",
    email: "", senha: "", confirmar_senha: "",
  });

  // Actualiza um campo e limpa o seu erro
  const atualizar = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    setErros((prev) => ({ ...prev, [campo]: null }));
  };

  // Valida todos os campos antes de enviar
  const validarTudo = () => {
    const novosErros = {};
    novosErros.nome     = validarNome(form.nome);
    novosErros.telefone = validarTelefone(form.telefone);
    novosErros.email    = validarEmail(form.email);
    novosErros.senha    = validarSenha(form.senha);
    if (!form.provincia.trim()) novosErros.provincia = "Província é obrigatória.";
    if (!form.municipio.trim()) novosErros.municipio = "Município é obrigatório.";
    if (!form.bairro.trim())    novosErros.bairro    = "Bairro é obrigatório.";
    if (!form.confirmar_senha) {
      novosErros.confirmar_senha = "Confirma a tua senha.";
    } else if (form.senha !== form.confirmar_senha) {
      novosErros.confirmar_senha = "As senhas não coincidem.";
    }
    if (tipo !== "empresa") {
      novosErros.bi              = validarBI(form.bi);
      novosErros.data_nascimento = validarDataNascimento(form.data_nascimento);
    }
    if (tipo === "empresa") {
      if (!form.horario_abertura)   novosErros.horario_abertura   = "Horário de abertura é obrigatório.";
      if (!form.horario_fechamento) novosErros.horario_fechamento = "Horário de fechamento é obrigatório.";
    }
    const errosFiltrados = Object.fromEntries(
      Object.entries(novosErros).filter(([, v]) => v !== null && v !== undefined)
    );
    setErros(errosFiltrados);
    return Object.keys(errosFiltrados).length === 0;
  };

  // Envio do formulário ao backend
  const handleCriarConta = async () => {
    setErro("");
    if (!validarTudo()) {
      setErro("Corrige os erros indicados antes de continuar.");
      return;
    }

    try {
      setCarregando(true);

      const dados = {
        nome:        form.nome.trim(),
        telefone:    form.telefone.replace(/\s/g, ""),
        provincia:   form.provincia.trim(),
        municipio:   form.municipio.trim(),
        bairro:      form.bairro.trim(),
        email:       form.email.trim() || null,
        senha:       form.senha,
        tipo_usuario: tipo,
        ...(tipo !== "empresa" && {
          bi:              form.bi.toUpperCase() || null,
          data_nascimento: form.data_nascimento,
        }),
        ...(tipo === "empresa" && {
          horario_abertura:   form.horario_abertura,
          horario_fechamento: form.horario_fechamento,
        }),
      };

      const resultado = await registar(dados);

      // ── Tratamento do resultado ───────────────────────────
      // Se o utilizador tem email → backend envia email de confirmação
      // e devolve verificacao_pendente=true — mostramos ecrã de aviso
      if (resultado.verificacao_pendente) {
        setEmailRegistado(form.email.trim());
        setVerificacaoPendente(true);
        return;
      }

      // Se não tem email (só telefone) → conta activa imediatamente
      // Redireciona para a página correta conforme o tipo
      if (tipo === "coletor")      navigate("/ColetadorDashboard");
      else if (tipo === "empresa") navigate("/DashboardEmpresa");
      else                         navigate("/PaginaInicial");

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ─────────────────────────────────────────────
  // ECRÃ DE VERIFICAÇÃO PENDENTE
  // Aparece após registo com email — pede ao utilizador para verificar a caixa de entrada
  // ─────────────────────────────────────────────
  if (verificacaoPendente) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center py-12 bg-green-900 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Verifica o teu email</h2>
          <p className="text-gray-600 text-sm mb-4">
            Enviámos um link de confirmação para:
          </p>
          <p className="text-green-700 font-semibold text-base mb-6">
            {emailRegistado}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Clica no link do email para activar a tua conta.<br />
            Verifica também a pasta de <strong>spam</strong>.
          </p>
          {/* Link para o login após confirmar */}
          <Link
            to="/Login"
            className="inline-block bg-green-800 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition"
          >
            Já confirmei — Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER PRINCIPAL — Formulário de registo
  // ─────────────────────────────────────────────
  return (
    <div id="Cadastro" className="w-full flex justify-center py-12 bg-green-900">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Cadastre-se</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cadastro grátis para usuários, coletadores e empresas.
          </p>
        </div>

        {/* Seleção do tipo de conta */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Tipo ativo={tipo === "comum"}   onClick={() => setTipo("comum")}   Icon={User}      label="Usuário" />
          <Tipo ativo={tipo === "coletor"} onClick={() => setTipo("coletor")} Icon={Truck}     label="Coletador(a)" />
          <Tipo ativo={tipo === "empresa"} onClick={() => setTipo("empresa")} Icon={Building2} label="Empresa" />
        </div>

        <div className="space-y-4">
          <Campo
            label={tipo === "empresa" ? "Nome da empresa" : "Nome completo"}
            obrigatorio value={form.nome} onChange={atualizar("nome")} erro={erros.nome}
          />
          <Campo
            label="Telefone" obrigatorio
            value={form.telefone} onChange={atualizar("telefone")}
            hint="Ex: 923456789" erro={erros.telefone}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Província" obrigatorio value={form.provincia} onChange={atualizar("provincia")} erro={erros.provincia} />
            <Campo label="Município" obrigatorio value={form.municipio} onChange={atualizar("municipio")} erro={erros.municipio} />
          </div>
          <Campo label="Bairro" obrigatorio value={form.bairro} onChange={atualizar("bairro")} erro={erros.bairro} />

          {/* Campos só para utilizador e coletador */}
          {tipo !== "empresa" && (
            <>
              <Campo label="BI (opcional)" value={form.bi} onChange={atualizar("bi")} hint="Ex: 000000000LA000" erro={erros.bi} />
              <Campo label="Data de nascimento" type="date" obrigatorio hint="+18 anos" value={form.data_nascimento} onChange={atualizar("data_nascimento")} erro={erros.data_nascimento} />
            </>
          )}

          {/* Campos só para empresa */}
          {tipo === "empresa" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Horário de abertura"   type="time" obrigatorio value={form.horario_abertura}   onChange={atualizar("horario_abertura")}   erro={erros.horario_abertura} />
              <Campo label="Horário de fechamento" type="time" obrigatorio value={form.horario_fechamento} onChange={atualizar("horario_fechamento")} erro={erros.horario_fechamento} />
            </div>
          )}

          {/* Email — opcional mas recomendado para confirmação */}
          <Campo
            label="Email (opcional mas recomendado)" type="email"
            value={form.email} onChange={atualizar("email")}
            hint="Ex: nome@email.com" erro={erros.email}
          />
          <Campo label="Senha" type="password" obrigatorio value={form.senha} onChange={atualizar("senha")} hint="Mínimo 6 caracteres, 1 maiúscula e 1 número" erro={erros.senha} />
          <Campo label="Confirmar senha" type="password" obrigatorio value={form.confirmar_senha} onChange={atualizar("confirmar_senha")} erro={erros.confirmar_senha} />
        </div>

        {/* Erro geral */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            {erro}
          </p>
        )}

        <button
          onClick={handleCriarConta}
          disabled={carregando}
          className="w-full mt-6 bg-green-800 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {carregando ? "A criar conta..." : "Criar conta"}
        </button>

        <p className="text-xs sm:text-sm text-center mt-4 text-gray-600">
          Já tens uma conta?{" "}
          <Link to="/Login" className="font-semibold text-green-800 hover:underline">Entrar</Link>
        </p>
        <p className="text-xs text-center mt-2 text-gray-400">
          Contas administrativas são criadas apenas internamente.
        </p>
      </div>
    </div>
  );
};

export default Cadastro;