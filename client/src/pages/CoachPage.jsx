import { useState, useEffect, useRef, useCallback } from 'react';
import { coachAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import SkeletonLoader from '../components/shared/SkeletonLoader';
import {
  MessageCircle, Plus, Send, Trash2, Loader2,
  Bot, Crown, Zap, ChevronRight,
} from 'lucide-react';
import './CoachPage.css';

const SUGGESTION_CHIPS = [
  '🍛 What should I eat for dinner?',
  '💪 How do I build muscle at home?',
  '📊 Analyse my nutrition today',
  '🏃 Best cardio for weight loss?',
  '😴 How many hours should I sleep?',
  '🧘 Can you suggest a quick stretch?',
];

// Simple markdown renderer (bold, bullet lists)
function renderMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const result = [];

  lines.forEach((line, i) => {
    // Bold: **text**
    const boldParsed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(`<li>${boldParsed.replace(/^[-•]\s+/, '')}</li>`);
    } else if (line.trim() === '') {
      result.push('<br/>');
    } else {
      result.push(`<p>${boldParsed}</p>`);
    }
  });

  // Wrap consecutive <li> in <ul>
  const html = result.join('').replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);
  return html;
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`coach-msg coach-msg--${isUser ? 'user' : 'ai'}`}>
      {!isUser && (
        <div className="coach-msg__avatar">
          <Bot size={16} />
        </div>
      )}
      <div className="coach-msg__bubble">
        {isUser
          ? <p>{msg.content}</p>
          : <div
              className="coach-msg__content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
        }
        <span className="coach-msg__time">
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="coach-msg coach-msg--ai">
      <div className="coach-msg__avatar">
        <Bot size={16} />
      </div>
      <div className="coach-msg__bubble coach-msg__bubble--typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function CoachPage() {
  const { user, isPremium } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [limitError, setLimitError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const { data } = await coachAPI.getConversations();
      setConversations(data.conversations || []);
      // Auto-open first conversation
      if (data.conversations?.length > 0 && !activeConvId) {
        openConversation(data.conversations[0].id);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  const openConversation = async (id) => {
    setActiveConvId(id);
    setLoadingMsgs(true);
    setMessages([]);
    setError(null);
    setLimitError(false);
    try {
      const { data } = await coachAPI.getConversation(id);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const createConversation = async () => {
    try {
      const { data } = await coachAPI.createConversation();
      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConvId(data.conversation.id);
      setMessages([]);
      return data.conversation.id;
    } catch {/* ignore */}
  };


  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await coachAPI.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch {/* ignore */}
  };

  const sendMessage = async (text, convId) => {
    const msg = text || input;
    const targetConvId = convId || activeConvId;
    if (!msg.trim() || !targetConvId || sending) return;

    setInput('');
    setError(null);
    setLimitError(false);

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      role: 'user',
      content: msg.trim(),
      created_at: new Date().toISOString(),
    }]);
    setSending(true);

    try {
      const { data } = await coachAPI.sendMessage({
        conversation_id: targetConvId,
        message: msg.trim(),
      });
      setMessages((prev) => [...prev, data.message]);

      // Update conversation list (title may have changed)
      const convRes = await coachAPI.getConversations();
      setConversations(convRes.data.conversations || []);
    } catch (err) {
      const serverError = err.response?.data;
      if (serverError?.code === 'LIMIT_REACHED') {
        setLimitError(true);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        setError(serverError?.error || 'Failed to send message. Please try again.');
      }
      setSending(false);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="coach-page animate-fade-in">
      {/* Sidebar */}
      <aside className="coach-sidebar">
        <div className="coach-sidebar__header">
          <h3>Conversations</h3>
          <button className="coach-sidebar__new" onClick={createConversation}>
            <Plus size={18} />
          </button>
        </div>

        <div className="coach-sidebar__list">
          {loadingConvs ? (
            Array(4).fill(0).map((_, i) => (
              <SkeletonLoader key={i} height={52} className="mb-2" />
            ))
          ) : conversations.length === 0 ? (
            <div className="coach-sidebar__empty">
              <MessageCircle size={24} />
              <p>No conversations yet</p>
              <button onClick={createConversation} className="coach-sidebar__start">
                Start a chat →
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`coach-conv ${activeConvId === conv.id ? 'coach-conv--active' : ''}`}
                onClick={() => openConversation(conv.id)}
              >
                <MessageCircle size={15} className="coach-conv__icon" />
                <span className="coach-conv__title">{conv.title || 'New Chat'}</span>
                <button
                  className="coach-conv__delete"
                  onClick={(e) => deleteConversation(conv.id, e)}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Usage Indicator */}
        {!isPremium && (
          <div className="coach-sidebar__usage">
            <div className="coach-sidebar__usage-label">
              <Zap size={13} />
              <span>AI messages today</span>
            </div>
            <a href="/premium" className="coach-sidebar__upgrade">
              <Crown size={13} />
              Upgrade for unlimited
            </a>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <div className="coach-main">
        {!activeConvId ? (
          <div className="coach-welcome">
            <div className="coach-welcome__avatar">
              <Bot size={36} />
            </div>
            <h2>Meet Arya, your AI fitness coach 🙏</h2>
            <p>Ask me anything about nutrition, workouts, or your health goals. I know Indian food, Indian lifestyle — and I'm here to help you reach your goals.</p>
            <div className="coach-welcome__chips">
              {SUGGESTION_CHIPS.slice(0, 4).map((chip) => (
                <button
                  key={chip}
                  className="coach-chip"
                  onClick={async () => {
                    const newConvId = await createConversation();
                    if (newConvId) sendMessage(chip, newConvId);
                  }}
                >
                  {chip}
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>
            <Button variant="primary" icon={Plus} onClick={createConversation}>
              Start a New Chat
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="coach-messages">
              {loadingMsgs ? (
                <div className="coach-messages__loading">
                  <Loader2 size={24} className="coach-messages__loader" />
                  <span>Loading conversation…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="coach-messages__empty">
                  <p>Start the conversation! Try one of these:</p>
                  <div className="coach-chip-row">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <button key={chip} className="coach-chip" onClick={() => sendMessage(chip)}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => <Message key={msg.id} msg={msg} />)
              )}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Banners */}
            {limitError && (
              <div className="coach-limit-banner">
                <Crown size={16} />
                <span>You've reached your daily AI message limit.</span>
                <a href="/premium">Upgrade to Premium →</a>
              </div>
            )}
            {error && (
              <div className="coach-error-banner">
                {error}
              </div>
            )}

            {/* Input */}
            <div className="coach-input-area">
              <textarea
                ref={inputRef}
                className="coach-input"
                placeholder="Ask Arya anything about nutrition, workouts, or health…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending || limitError}
              />
              <button
                className="coach-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending || limitError}
                aria-label="Send message"
              >
                {sending ? <Loader2 size={18} className="coach-sending-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="coach-input-hint">Press Enter to send · Shift+Enter for new line</p>
          </>
        )}
      </div>
    </div>
  );
}
