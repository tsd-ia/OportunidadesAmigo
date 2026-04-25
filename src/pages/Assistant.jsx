import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { chatMessages as initialMsgs, quickActions, botResponses } from '../data/chat';

function Assistant() {
  const [messages, setMessages] = useState(initialMsgs);
  const [input, setInput] = useState('');
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');

    // Simular respuesta
    setTimeout(() => {
      let response = 'Entendido. Estoy buscando opciones para ti... 🔍\n\nMientras tanto, puedes usar las acciones rápidas de abajo para explorar diferentes opciones.';
      
      // Buscar respuesta predefinida
      const lower = text.toLowerCase();
      if (lower.includes('buscar') || lower.includes('search')) response = botResponses.search_now;
      else if (lower.includes('región') || lower.includes('region')) response = botResponses.change_region;
      else if (lower.includes('rubro') || lower.includes('agregar')) response = botResponses.add_rubro;
      else if (lower.includes('fácil') || lower.includes('facil') || lower.includes('easy')) response = botResponses.show_easy;
      else if (lower.includes('perfil') || lower.includes('profile')) response = botResponses.my_profile;
      else if (lower.includes('estadístic') || lower.includes('stats') || lower.includes('resumen')) response = botResponses.stats;

      const botMsg = { id: Date.now() + 1, type: 'bot', text: response, timestamp: new Date().toISOString() };
      setMessages(m => [...m, botMsg]);
    }, 800);
  };

  const handleQuickAction = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) sendMessage(action.label);
  };

  const renderText = (text) => {
    // Formateo simple de markdown en el chat
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
      <p className="page-subtitle">Tu asistente personal de oportunidades — pregúntale lo que quieras</p>

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
            placeholder="Escribe tu pregunta..."
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
