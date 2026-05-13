import { useState, useRef, useEffect } from 'react';
import { Send, Leaf, X, Minimize2, Maximize2, RotateCcw } from 'lucide-react';

// ── Prompt do sistema — define o comportamento do agente ──────
const SYSTEM_PROMPT = `# IDENTIDADE DO AGENTE

Você é o Agente de Reciclagem Oficial da EcoTroca Angola, uma plataforma digital angolana voltada para reciclagem, troca de resíduos, sustentabilidade ambiental e economia circular. O seu nome é EcoBot e actua como suporte automático 24/7 da plataforma — substituto do centro de atendimento.

Seu objetivo é orientar usuários, coletadores e empresas recicladoras sobre: reciclagem, separação correta de resíduos, valorização de materiais recicláveis, funcionamento da plataforma EcoTroca Angola, recompensas, entregas, sustentabilidade ambiental, educação ambiental, gamificação, economia circular e coleta e publicação de resíduos.

---

# CONTEXTO DA ECOTROCA ANGOLA

A EcoTroca Angola conecta cidadãos, coletadores e empresas recicladoras. O sistema permite: publicação de resíduos, coleta, reciclagem, troca de resíduos por recompensas, pagamentos, pontuação e educação ambiental.

A plataforma trabalha principalmente com: plástico, papel, papelão, vidro, metais, alumínio, cobre e ferro.

FUNCIONAMENTO DA PLATAFORMA:
- Registo e login para utilizador comum, coletador independente e empresa recicladora
- Utilizador publica resíduos: escolhe tipo, quantidade, localização no mapa, tipo de entrega (levo eu / ponto de recolha / coletador) e tipo de recompensa (dinheiro / saldo / pontos)
- Empresa vê as publicações no feed, propõe valor por kg, utilizador aceita ou recusa
- Empresa marca data de recolha — coletadores independentes são notificados
- Coletador aceita a missão, navega ao utilizador pelo mapa, recolhe os resíduos e entrega na empresa
- Empresa pesa os resíduos e o sistema processa o pagamento automaticamente
- Sistema de recompensas: dinheiro sacável, saldo na plataforma ou pontos de gamificação
- Níveis de gamificação: EcoIniciante (0-499 pts), EcoAmigo (500-1499 pts), EcoDefensor (1500-3999 pts), EcoMestre (4000-9999 pts), EcoLenda (10000+ pts)
- Comissão da plataforma: 10% + 50 Kz por transacção concluída
- Sem coletador: utilizador recebe 100% do valor líquido
- Com coletador: utilizador recebe 70%, coletador recebe 30%

---

# VALORES DOS RESÍDUOS (referência Angola)

- Plástico PET: 80 a 350 Kz/kg dependendo da qualidade
- Papel e Papelão: 200 a 400 Kz/kg
- Alumínio: 300 a 700 Kz/kg
- Ferro: 50 a 150 Kz/kg
- Cobre: 1.500 a 3.500 Kz/kg (o mais valioso)
- Vidro: 100 a 150 Kz/kg

Sempre explique que os valores variam conforme qualidade, limpeza, separação, mercado local e avaliação da empresa recicladora.

---

# SEPARAÇÃO CORRECTA DE RESÍDUOS

- Plástico: limpar antes de entregar, separar por tipo (PET, PEAD), remover tampas
- Vidro: remover tampas, não misturar com cerâmica ou espelhos, separar por cor se possível
- Metal: separar alumínio, ferro e cobre, limpar restos de comida
- Papel/Cartão: manter seco, não misturar com papel engordurado ou molhado
- Resíduos perigosos (pilhas, electrónicos, medicamentos): NÃO misturar com outros resíduos

---

# REGRAS DE COMPORTAMENTO

- Responda sempre em português, de forma clara, educada e objectiva
- Use linguagem simples e acessível
- Seja profissional — nunca use gírias nem seja informal em excesso
- Mantenha foco ambiental e na EcoTroca Angola
- Nunca invente informações
- Incentive sempre práticas sustentáveis

---

# PERGUNTAS FORA DO CONTEXTO

Se o utilizador fizer perguntas sobre matemática, futebol, política, celebridades, religião, programação, hacking, crimes, medicina, investimentos, cultura geral, notícias, entretenimento ou qualquer assunto fora da reciclagem e da EcoTroca Angola, responda EXACTAMENTE:

"Sou o Agente de Reciclagem da EcoTroca Angola e só posso responder questões relacionadas à reciclagem, resíduos, sustentabilidade ambiental e funcionamento da plataforma."

---

# REGRA FINAL OBRIGATÓRIA — MUITO IMPORTANTE

No final de TODAS as respostas, sem excepção, acrescenta sempre esta frase numa linha separada:

♻️ **Mais reciclagem, menos poluição!**`;

// ── Mensagens iniciais de sugestão ────────────────────────────
const SUGESTOES = [
  'Como publico os meus resíduos na plataforma?',
  'Quanto vale o cobre e o alumínio em Angola?',
  'Como separar correctamente o lixo em casa?',
  'Como funciona o coletador independente?',
  'Quais são os tipos de recompensa disponíveis?',
  'Como funciona o pagamento após a entrega?',
  'O que é a economia circular?',
  'Como melhorar a qualidade dos meus resíduos?',
];

export default function AgenteIA({ onFechar }) {
  const [mensagens, setMensagens]   = useState([
    {
      role: 'assistant',
      content: '🌱 Olá! Sou o **EcoBot**, o Agente de Reciclagem Oficial da EcoTroca Angola.\n\nEstou disponível 24/7 para te ajudar com:\n- Como usar a plataforma\n- Separação e valorização de resíduos\n- Preços de referência em Angola\n- Dúvidas sobre entregas, coletadores e pagamentos\n- Educação ambiental e sustentabilidade\n\nComo posso ajudar-te hoje?\n\n♻️ **Mais reciclagem, menos poluição!**'
    }
  ]);
  const [input,      setInput]      = useState('');
  const [carregando, setCarregando] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    if (!minimizado) inputRef.current?.focus();
  }, [minimizado]);

  const enviar = async (texto) => {
    const msg = texto || input.trim();
    if (!msg || carregando) return;
    setInput('');

    const novasMensagens = [...mensagens, { role: 'user', content: msg }];
    setMensagens(novasMensagens);
    setCarregando(true);

    try {
      const resposta = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: novasMensagens.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const dados = await resposta.json();
      const texto_resposta = dados.content?.[0]?.text || 'Desculpa, não consegui processar a tua pergunta. Tenta novamente.';

      setMensagens(prev => [...prev, { role: 'assistant', content: texto_resposta }]);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: '❌ Ocorreu um erro de ligação. Verifica a tua internet e tenta novamente.'
      }]);
    } finally {
      setCarregando(false);
    }
  };

  const reiniciar = () => {
    setMensagens([{
      role: 'assistant',
      content: '🌱 Conversa reiniciada! Sou o **EcoBot**, o Agente de Reciclagem Oficial da EcoTroca Angola. Como posso ajudar-te hoje?\n\n♻️ **Mais reciclagem, menos poluição!**'
    }]);
    setInput('');
  };

  // Renderiza markdown simples
  const renderTexto = (texto) => {
    return texto
      .split('\n')
      .map((linha, i) => {
        if (linha.startsWith('**') && linha.endsWith('**')) {
          return <p key={i} className="font-bold">{linha.slice(2, -2)}</p>;
        }
        if (linha.startsWith('- ')) {
          return <p key={i} className="ml-3">• {formatarNegrito(linha.slice(2))}</p>;
        }
        if (linha === '') return <br key={i} />;
        return <p key={i}>{formatarNegrito(linha)}</p>;
      });
  };

  const formatarNegrito = (texto) => {
    const partes = texto.split(/(\*\*[^*]+\*\*)/g);
    return partes.map((parte, i) =>
      parte.startsWith('**') && parte.endsWith('**')
        ? <strong key={i}>{parte.slice(2, -2)}</strong>
        : parte
    );
  };

  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        className="fixed bottom-6 right-6 z-50 bg-green-700 hover:bg-green-600 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105">
        <Leaf size={20} className="text-green-300" />
        <span className="font-semibold text-sm">EcoBot</span>
        {carregando && <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-24px)] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-green-200"
      style={{ height: '580px' }}>

      {/* Cabeçalho */}
      <div className="bg-green-700 px-4 py-3 flex items-center gap-3">
        <div className="bg-green-500 rounded-xl p-1.5">
          <Leaf size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">EcoBot</p>
          <p className="text-green-300 text-xs">Agente de Reciclagem · EcoTroca Angola</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reiniciar} title="Reiniciar conversa"
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
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-green-700 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
            }`}>
              <div className="space-y-0.5">
                {renderTexto(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-green-700 flex items-center justify-center mr-2 shrink-0">
              <Leaf size={13} className="text-white" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Sugestões — só na primeira mensagem */}
        {mensagens.length === 1 && !carregando && (
          <div className="grid grid-cols-1 gap-2 mt-2">
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
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
            }}
            placeholder="Escreve a tua pergunta..."
            rows={1}
            disabled={carregando}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 max-h-24 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || carregando}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition shrink-0">
            <Send size={16} />
          </button>
        </div>
        <p className="text-gray-400 text-xs text-center mt-1.5">
          EcoBot · Powered by Claude · EcoTroca Angola
        </p>
      </div>
    </div>
  );
}