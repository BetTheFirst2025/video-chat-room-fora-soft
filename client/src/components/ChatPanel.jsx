import { useEffect, useRef, useState } from 'react';

/**
 * Форматирует timestamp в HH:MM (локальное время).
 * @param {number} ts
 * @returns {string}
 */
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Панель чата: список сообщений + ввод.
 *
 * @param {{
 *   messages: Array<{
 *     id: string,
 *     kind: 'user' | 'system',
 *     authorId?: string,
 *     authorName?: string,
 *     text: string,
 *     ts: number,
 *   }>,
 *   selfId: string | null,
 *   onSend: (text: string) => void,
 * }} props
 */
export default function ChatPanel({ messages, selfId, onSend }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  // Автоскролл к низу при новом сообщении
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    // Enter без Shift — отправить; Shift+Enter — новая строка
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend(trimmed);
        setText('');
      }
    }
  };

  return (
    <div className="chat">
      <div className="chat__list" ref={listRef}>
        {messages.length === 0 && (
          <p className="chat__empty">Сообщений пока нет. Начните переписку.</p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat__msg chat__msg--${m.kind}${
              m.kind === 'user' && m.authorId === selfId ? ' chat__msg--self' : ''
            }`}
          >
            {m.kind === 'system' ? (
              <span className="chat__msg-text">{m.text}</span>
            ) : (
              <>
                <div className="chat__msg-header">
                  <span className="chat__msg-author">{m.authorName ?? 'Аноним'}</span>
                  <span className="chat__msg-time">{formatTime(m.ts)}</span>
                </div>
                <div className="chat__msg-text">{m.text}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="chat__form" onSubmit={handleSubmit}>
        <textarea
          className="chat__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение…"
          rows={1}
          maxLength={1000}
        />
        <button
          type="submit"
          className="chat__send"
          disabled={!canSend}
          title="Отправить (Enter)"
          aria-label="Отправить"
        >
          ➤
        </button>
      </form>
    </div>
  );
}