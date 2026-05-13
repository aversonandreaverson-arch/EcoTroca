import { useState, useRef, useEffect } from 'react';
import { Send, Leaf, X, Minimize2, RotateCcw, Database, Brain } from 'lucide-react';

const BASE_URL = 'http://localhost:3000';

const SYSTEM_PROMPT = `# IDENTIDADE DO AGENTE

Você é o EcoBot — Agente de Reciclagem Oficial da EcoTroca Angola. Actua como centro de atendimento 24/7, substituindo o suporte humano da plataforma.

Você tem acesso a ferramentas que permitem consultar dados reais da plataforma e do utilizador logado. Use-as sempre que necessário para dar respostas precisas e personalizadas.

---

# FERRAMENTAS DISPONÍVEIS

Você tem as seguintes ferramentas:

1. **obter_perfil_utilizador** — Obtém nome, tipo, nível, pontos, saldo e carteira do utilizador logado.
2. **obter_minhas_entregas** — Lista as entregas recentes do utilizador com status, valor e resíduo.
3. **obter_precos_residuos** — Consulta os preços actuais por kg de cada tipo de resíduo na plataforma.
4. **obter_empresas** — Lista empresas recicladoras registadas na plataforma.
5. **obter_conteudos_educativos** — Acede aos artigos e guias de educação ambiental da plataforma.
6. **obter_eventos** — Lista eventos de recolha activos na plataforma.

USE as ferramentas sempre que o utilizador perguntar sobre dados específicos como pontos, saldo, entregas, preços actuais ou empresas. Não invente valores — consulte sempre.

---

# DOMÍNIO DE CONHECIMENTO

Você responde APENAS sobre:
- Reciclagem, separação e valorização de resíduos
- Funcionamento da plataforma EcoTroca Angola
- Sustentabilidade ambiental e economia circular
- Dados pessoais do utilizador logado (via ferramentas)

Para qualquer outro assunto responda EXACTAMENTE:
"Sou o Agente de Reciclagem da EcoTroca Angola e só posso responder questões relacionadas à reciclagem, resíduos, sustentabilidade ambiental e funcionamento da plataforma."

---

# VALORES DE REFERÊNCIA DOS RESÍDUOS

- Plástico PET: 80–350 Kz/kg
- Papel/Papelão: 200–400 Kz/kg
- Alumínio: 300–700 Kz/kg
- Ferro: 50–150 Kz/kg
- Cobre: 1.500–3.500 Kz/kg
- Vidro: 100–150 Kz/kg

---

# SEPARAÇÃO CORRECTA

- Plástico: lavar, remover tampas, separar PET de PEAD
- Vidro: remover tampas, não misturar com cerâmica
- Metal: separar alumínio, ferro e cobre; limpar restos de alimentos
- Papel: manter seco, não misturar com papel engordurado
- Perigosos (pilhas, electrónicos): NÃO misturar — pontos específicos

---

# FLUXO DA PLATAFORMA

1. Utilizador publica resíduo com tipo, quantidade, localização e tipo de entrega
2. Empresa vê no feed e propõe valor por kg
3. Utilizador aceita → empresa marca data de recolha
4. Coletador independente recebe notificação → aceita → recolhe → entrega na empresa
5. Empresa pesa → sistema calcula e distribui pagamento automaticamente
6. Comissão: 10% + 50 Kz; utilizador recebe 70–100%, coletador 30%

---

# NÍVEIS DE GAMIFICAÇÃO

- EcoIniciante: 0–499 pontos
- EcoAmigo: 500–1.499 pontos
- EcoDefensor: 1.500–3.999 pontos
- EcoMestre: 4.000–9.999 pontos
- EcoLenda: 10.000+ pontos

---

# PERSONALIDADE

- Profissional, educado e claro
- Linguagem simples e acessível
- Sem gírias
- Incentiva sempre a sustentabilidade
- Nunca inventa dados — usa as ferramentas

---

# REGRA FINAL OBRIGATÓRIA

No final de TODAS as respostas acrescenta SEMPRE numa linha separada:

♻️ **Mais reciclagem, menos poluição!**`;

const TOOLS = [
  {
    name: 'obter_perfil_utilizador',
    description: 'Obtém os dados do perfil do utilizador logado: nome, tipo de conta, nível de gamificação, pontos totais, saldo na carteira.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'obter_minhas_entregas',
    description: 'Lista as entregas recentes do utilizador logado com status, tipo de resíduo, peso e valor recebido.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'obter_precos_residuos',
    description: 'Consulta os preços actuais por kg de cada tipo de resíduo disponível na plataforma.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'obter_empresas',
    description: 'Lista as empresas recicladoras registadas na plataforma com nome, localização e tipos de resíduos aceites.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'obter_conteudos_educativos',
    description: 'Acede aos artigos e guias de educação ambiental disponíveis na plataforma.',
    input_schema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', description: 'Categoria: separacao, reciclagem, sustentabilidade, boas_praticas' }
      },
      required: []
    }
  },
  {
    name: 'obter_eventos',
    description: 'Lista os eventos de recolha activos e próximos na plataforma.',
    input_schema: { type: 'object', properties: {}, required: [] }
  }
];

const executarFerramenta = async (nome, input, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
  try {
    switch (nome) {
      case 'obter_perfil_utilizador': {
        if (!token) return { erro: 'Utilizador não autenticado. Por favor faz login.' };
        const [perfil, carteira, pontuacao] = await Promise.all([
          fetch(`${BASE_URL}/api/usuarios/perfil`, { headers }).then(r => r.json()),
          fetch(`${BASE_URL}/api/usuarios/carteira`, { headers }).then(r => r.json()).catch(() => null),
          fetch(`${BASE_URL}/api/usuarios/pontuacao`, { headers }).then(r => r.json()).catch(() => null),
        ]);
        return {
          nome: perfil.nome,
          tipo: perfil.tipo_usuario,
          provincia: perfil.provincia,
          municipio: perfil.municipio,
          pontos: pontuacao?.pontuacao?.pontos_total || 0,
          nivel: pontuacao?.nivel || 'EcoIniciante',
          dinheiro_carteira: carteira?.dinheiro || 0,
          saldo_carteira: carteira?.saldo || 0,
        };
      }
      case 'obter_minhas_entregas': {
        if (!token) return { erro: 'Utilizador não autenticado.' };
        const entregas = await fetch(`${BASE_URL}/api/entregas`, { headers }).then(r => r.json());
        if (!Array.isArray(entregas)) return { entregas: [] };
        return {
          total: entregas.length,
          entregas: entregas.slice(0, 5).map(e => ({
            id: e.id_entrega,
            status: e.status,
            tipo_residuo: e.tipo_residuo || e.tipos_residuos,
            peso: e.peso_total,
            valor_recebido: e.valor_utilizador,
            data: e.data_hora,
          }))
        };
      }
      case 'obter_precos_residuos': {
        const residuos = await fetch(`${BASE_URL}/api/residuos`, { headers }).then(r => r.json()).catch(() => null);
        if (residuos && Array.isArray(residuos)) {
          return { residuos: residuos.map(r => ({ tipo: r.tipo, preco_min: r.preco_min, preco_max: r.preco_max })) };
        }
        return {
          nota: 'Valores de referência',
          residuos: [
            { tipo: 'Plástico PET', preco_min: 80, preco_max: 350 },
            { tipo: 'Vidro', preco_min: 100, preco_max: 150 },
            { tipo: 'Alumínio', preco_min: 300, preco_max: 700 },
            { tipo: 'Ferro', preco_min: 50, preco_max: 150 },
            { tipo: 'Cobre', preco_min: 1500, preco_max: 3500 },
            { tipo: 'Papel/Papelão', preco_min: 200, preco_max: 400 },
          ]
        };
      }
      case 'obter_empresas': {
        const empresas = await fetch(`${BASE_URL}/api/empresas`, { headers }).then(r => r.json()).catch(() => []);
        if (!Array.isArray(empresas)) return { empresas: [] };
        return {
          total: empresas.length,
          empresas: empresas.slice(0, 6).map(e => ({
            nome: e.nome,
            provincia: e.provincia,
            municipio: e.municipio,
            residuos_aceites: e.residuos_aceites,
            horario: e.horario_abertura ? `${e.horario_abertura} - ${e.horario_fechamento}` : null,
          }))
        };
      }
      case 'obter_conteudos_educativos': {
        const conteudos = await fetch(`${BASE_URL}/api/educacao`, { headers }).then(r => r.json()).catch(() => []);
        if (!Array.isArray(conteudos)) return { conteudos: [] };
        const filtrados = input?.categoria ? conteudos.filter(c => c.categoria === input.categoria) : conteudos;
        return {
          total: filtrados.length,
          conteudos: filtrados.slice(0, 4).map(c => ({ titulo: c.titulo, descricao: c.descricao, categoria: c.categoria }))
        };
      }
      case 'obter_eventos': {
        const eventos = await fetch(`${BASE_URL}/api/eventos`, { headers }).then(r => r.json()).catch(() => []);
        if (!Array.isArray(eventos)) return { eventos: [] };
        return {
          total: eventos.length,
          eventos: eventos.slice(0, 4).map(e => ({ titulo: e.titulo, data_inicio: e.data_inicio, local: e.local, tipo: e.tipo }))
        };
      }
      default:
        return { erro: `Ferramenta desconhecida: ${nome}` };
    }
  } catch (err) {
    return { erro: `Erro ao consultar dados: ${err.message}` };
  }
};

export default function AgenteIA({ onFechar }) {
  const token = localStorage.getItem('token');

  const [mensagens, setMensagens] = useState([{
    role: 'assistant',
    content: '🌱 Olá! Sou o **EcoBot**, o Agente de Reciclagem Oficial da EcoTroca Angola.\n\nEstou disponível 24/7 como centro de atendimento. Posso consultar os teus dados reais da plataforma, informar preços actuais, empresas disponíveis e orientar sobre reciclagem.\n\nComo posso ajudar-te hoje?\n\n♻️ **Mais reciclagem, menos poluição!**'
  }]);
  const [input,      setInput]      = useState('');
  const [carregando, setCarregando] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [ferrAtiva,  setFerrAtiva]  = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);
  useEffect(() => { if (!minimizado) inputRef.current?.focus(); }, [minimizado]);

  const enviar = async (texto) => {
    const msg = texto || input.trim();
    if (!msg || carregando) return;
    setInput('');

    const historicoComNova = [...mensagens, { role: 'user', content: msg }];
    setMensagens(historicoComNova);
    setCarregando(true);

    let apiMessages = historicoComNova.map(m => ({ role: m.role, content: m.content }));

    try {
      let continuar = true;
      while (continuar) {
        const resposta = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: apiMessages,
          })
        });

        const dados = await resposta.json();

        if (dados.stop_reason === 'tool_use') {
          const toolUseBlocks = dados.content.filter(b => b.type === 'tool_use');
          apiMessages.push({ role: 'assistant', content: dados.content });

          const toolResults = [];
          for (const toolUse of toolUseBlocks) {
            setFerrAtiva(toolUse.name);
            const resultado = await executarFerramenta(toolUse.name, toolUse.input, token);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(resultado),
            });
          }
          setFerrAtiva(null);
          apiMessages.push({ role: 'user', content: toolResults });
        } else {
          continuar = false;
          const textoFinal = dados.content?.find(b => b.type === 'text')?.text
            || 'Desculpa, não consegui processar a tua pergunta. Tenta novamente.';
          setMensagens(prev => [...prev, { role: 'assistant', content: textoFinal }]);
        }
      }
    } catch (err) {
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: '❌ Ocorreu um erro de ligação. Verifica a tua internet e tenta novamente.\n\n♻️ **Mais reciclagem, menos poluição!**'
      }]);
    } finally {
      setCarregando(false);
      setFerrAtiva(null);
    }
  };

  const reiniciar = () => {
    setMensagens([{
      role: 'assistant',
      content: '🌱 Conversa reiniciada! Sou o **EcoBot**, o Agente de Reciclagem Oficial da EcoTroca Angola. Como posso ajudar-te hoje?\n\n♻️ **Mais reciclagem, menos poluição!**'
    }]);
    setInput('');
  };

  const renderTexto = (texto) => {
    return texto.split('\n').map((linha, i) => {
      if (linha.startsWith('- ') || linha.startsWith('• '))
        return <p key={i} className="ml-3 flex gap-1"><span className="text-green-500 shrink-0">•</span><span>{formatarNegrito(linha.slice(2))}</span></p>;
      if (linha === '') return <div key={i} className="h-1" />;
      return <p key={i}>{formatarNegrito(linha)}</p>;
    });
  };

  const formatarNegrito = (texto) => {
    const partes = texto.split(/(\*\*[^*]+\*\*)/g);
    return partes.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        : p
    );
  };

  const nomeFerramenta = (nome) => ({
    obter_perfil_utilizador:    '👤 A consultar o teu perfil...',
    obter_minhas_entregas:      '📦 A verificar as tuas entregas...',
    obter_precos_residuos:      '💰 A consultar preços actuais...',
    obter_empresas:             '🏭 A procurar empresas recicladoras...',
    obter_conteudos_educativos: '📚 A consultar conteúdos educativos...',
    obter_eventos:              '📅 A verificar eventos próximos...',
  }[nome] || '🔍 A consultar dados...');

  const SUGESTOES = [
    token ? 'Quais são os meus pontos e nível actual?' : 'Como me registro na plataforma?',
    token ? 'Mostra-me as minhas últimas entregas' : 'Como funciona a EcoTroca Angola?',
    'Quanto vale o cobre e o alumínio?',
    'Como separar correctamente o plástico?',
    'Que empresas recicladoras existem na plataforma?',
    'O que é a economia circular?',
  ];

  if (minimizado) {
    return (
      <button onClick={() => setMinimizado(false)}
        className="fixed bottom-6 right-6 z-50 bg-green-700 hover:bg-green-600 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105">
        <Leaf size={20} className="text-green-300" />
        <span className="font-semibold text-sm">EcoBot</span>
        {carregando && <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-24px)] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-green-200"
      style={{ height: '600px' }}>

      {/* Cabeçalho */}
      <div className="bg-green-700 px-4 py-3 flex items-center gap-3">
        <div className="bg-green-500 rounded-xl p-1.5 relative">
          <Leaf size={18} className="text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full border-2 border-green-700" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">EcoBot</p>
          <p className="text-green-300 text-xs flex items-center gap-1">
            <Brain size={10} /> Agente IA · EcoTroca Angola · 24/7
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reiniciar} title="Reiniciar"
            className="text-green-300 hover:text-white transition p-1 rounded-lg hover:bg-green-600">
            <RotateCcw size={15} />
          </button>
          <button onClick={() => setMinimizado(true)} title="Minimizar"
            className="text-green-300 hover:text-white transition p-1 rounded-lg hover:bg-green-600">
            <Minimize2 size={15} />
          </button>
          {onFechar && (
            <button onClick={onFechar} title="Fechar"
              className="text-green-300 hover:text-white transition p-1 rounded-lg hover:bg-green-600">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-3">
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-green-700 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <Leaf size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-green-700 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
            }`}>
              <div className="space-y-0.5">{renderTexto(msg.content)}</div>
            </div>
          </div>
        ))}

        {/* Indicador de ferramenta activa */}
        {carregando && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-green-700 flex items-center justify-center mr-2 shrink-0">
              <Leaf size={13} className="text-white" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
              {ferrAtiva ? (
                <div className="flex items-center gap-2 text-xs text-green-700">
                  <Database size={12} className="animate-pulse" />
                  <span>{nomeFerramenta(ferrAtiva)}</span>
                </div>
              ) : (
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sugestões iniciais */}
        {mensagens.length === 1 && !carregando && (
          <div className="grid grid-cols-1 gap-1.5 mt-1">
            {SUGESTOES.map((s, i) => (
              <button key={i} onClick={() => enviar(s)}
                className="text-left text-xs bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 text-gray-600 hover:text-green-700 px-3 py-2 rounded-xl transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-3 py-3">
        <div className="flex gap-2 items-end">
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Escreve a tua pergunta..."
            rows={1} disabled={carregando}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 max-h-24 overflow-y-auto"
            style={{ minHeight: '42px' }} />
          <button onClick={() => enviar()} disabled={!input.trim() || carregando}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition shrink-0">
            <Send size={16} />
          </button>
        </div>
        <p className="text-gray-400 text-xs text-center mt-1.5">
          EcoBot  · EcoTroca Angola
        </p>
      </div>
    </div>
  );
}