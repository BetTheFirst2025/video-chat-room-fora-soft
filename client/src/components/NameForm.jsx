import { useState } from 'react';

const NAME_REGEX = /[^\p{L}\p{N}\s\-_.]/gu;
const MAX_NAME_LEN = 30;

/**
 * Очищает имя (как на сервере).
 * @param {string} raw
 * @returns {string}
 */
function sanitizeName(raw) {
  let name = raw.trim();
  name = name.replace(NAME_REGEX, '');
  name = name.replace(/\s+/g, ' ').trim();
  if (name.length > MAX_NAME_LEN) name = name.slice(0, MAX_NAME_LEN);
  return name;
}

/**
 * Форма ввода имени.
 *
 * @param {{
 *   onSubmit: (name: string) => void,
 *   submitLabel?: string,
 *   initialValue?: string,
 * }} props
 */
export default function NameForm({ onSubmit, submitLabel = 'Продолжить', initialValue = '' }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitized = sanitizeName(value);
    if (!sanitized) {
      setError('Введите имя');
      return;
    }
    setError(null);
    onSubmit(sanitized);
  };

  return (
    <form className="name-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="name-input" className="name-form__label">
        Ваше имя
      </label>
      <input
        id="name-input"
        type="text"
        className="name-form__input"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Например, Алекс"
        maxLength={MAX_NAME_LEN}
        autoFocus
        autoComplete="off"
      />
      {error && (
        <div className="name-form__error" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="name-form__submit">
        {submitLabel}
      </button>
    </form>
  );
}