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

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');

    // Indicador de escribiendo
    const tempId = Date.now() + 1;
    setMessages(m => [...m, { id: tempId, type: 'bot', text: 'Analizando con IA...', timestamp: new Date().toISOString() }]);

    const response = await api.sendChatMessage(text, opportunities);

    // Reemplazar mensaje temporal con la respuesta real
    setMessages(m => m.map(msg => msg.id === tempId ? { ...msg, text: response.text || 'Sin respuesta' } : msg));
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
