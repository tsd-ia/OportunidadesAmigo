import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { quickActions } from '../data/chat';
import api from '../services/api';

function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const messagesEnd = useRef(null);

  useEffect(() => {
    loadRealDataAndStart();
  }, []);

  const formatMoney = (n) => `$${n.toLocaleString('es-CL')}`;

  const loadRealDataAndStart = async () => {
    const data = await api.getOpportunities();
    const ops = data?.results || [];
    setOpportunities(ops);

    const initialMsgs = [
      {
        id: 1,
        type: 'bot',
        text: `¡Hola Jefe! Soy tu Asistente. Actualmente tengo **${ops.length}** oportunidades reales en mi base de datos obtenidas de tus escaneos. ¿En qué te puedo ayudar hoy?`,
        timestamp: new Date().toISOString(),
      }
    ];

    const sortedByBudget = [...ops].filter(o => o.budget > 0).sort((a, b) => b.budget - a.budget);
    const highestBudget = sortedByBudget[0];

    if (highestBudget) {
      initialMsgs.push({
        id: 2,
        type: 'bot',
        text: `🔔 Analizando los datos reales, destaco esta oportunidad por su alto valor:\n\n**${highestBudget.title}**\n💰 Presupuesto: **${formatMoney(highestBudget.budget)}**\n📍 Región: ${highestBudget.region}\n\n¿Quieres que te muestre más como esta o buscamos por rubro?`,
        timestamp: new Date().toISOString(),
      });
    } else if (ops.length > 0) {
      initialMsgs.push({
        id: 2,
        type: 'bot',
        text: `🔔 Analizando tus datos reales, el mejor match actual es:\n\n**${ops[0].title}**\n📍 Región: ${ops[0].region}\n\n¿Quieres que te muestre más como esta?`,
        timestamp: new Date().toISOString(),
      });
    }

    setMessages(initialMsgs);
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');

    // Simular respuesta basada en los datos reales
    setTimeout(() => {
      let response = `Entendido. Actualmente tengo ${opportunities.length} opciones en total guardadas. ¿Te gustaría ir al Explorador para filtrar los detalles exactos?`;
      
      const lower = text.toLowerCase();
      if (lower.includes('buscar') || lower.includes('search')) {
        response = 'Para hacer un barrido web profundo, ve a la pestaña "Explorador" y presiona el botón "Escanear Ahora". Eso traerá licitaciones nuevas directamente desde los portales.';
      } else if (lower.includes('estadístic') || lower.includes('stats') || lower.includes('resumen')) {
        const conPresupuesto = opportunities.filter(o => o.budget > 0).length;
        response = `📊 Resumen de tu base de datos actual:\n- Oportunidades activas: **${opportunities.length}**\n- Con presupuesto público: **${conPresupuesto}**\n\nTu base está lista para ser explorada.`;
      } else if (lower.includes('fácil') || lower.includes('facil') || lower.includes('easy')) {
        response = 'Si buscas oportunidades fáciles, el sistema prioriza las "Compras Ágiles" (menores a 30 UTM) donde hay menos burocracia. Puedes filtrarlas directamente en el Explorador activando solo la opción "Compra Ágil".';
      }

      const botMsg = { id: Date.now() + 1, type: 'bot', text: response, timestamp: new Date().toISOString() };
      setMessages(m => [...m, botMsg]);
    }, 800);
  };

  const handleQuickAction = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) sendMessage(action.label);
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-size:12px">$1</code>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
    });
  };

  return (
    <div>
      <h1 className="page-title">Asistente Inteligente</h1>
      <p className="page-subtitle">Analizador de Oportunidades</p>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.type}`}>
              {renderText(msg.text)}
            </div>
          ))}
          <div ref={messagesEnd} />
        </div>

        <div className="chat-quick-actions">
          {quickActions.map(action => (
            <button key={action.id} className="chat-quick-btn" onClick={() => handleQuickAction(action.id)} title={action.description}>
              {action.label}
            </button>
          ))}
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Escribe tu pregunta o pídele análisis de los datos..."
          />
          <button className="btn btn--primary" onClick={() => sendMessage(input)}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Assistant;
