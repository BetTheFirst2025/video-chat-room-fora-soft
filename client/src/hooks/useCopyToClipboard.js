import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Копирование текста в буфер обмена с временным подтверждением.
 *
 * @param {number} resetDelay — мс, через сколько сбросить флаг `copied`
 * @returns {{
 *   copy: (text: string) => Promise<boolean>,
 *   copied: boolean,
 *   error: string | null,
 * }}
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), resetDelay);
  }, [resetDelay]);

  const copy = useCallback(
    async (text) => {
      setError(null);

      // Современный API
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          scheduleReset();
          return true;
        } catch (err) {
          console.warn('[useCopyToClipboard] clipboard API failed:', err.name);
          // пробуем fallback ниже
        }
      }

      // Fallback — execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) {
          setCopied(true);
          scheduleReset();
          return true;
        }
      } catch (err) {
        console.warn('[useCopyToClipboard] execCommand fallback failed:', err);
      }

      setError('Не удалось скопировать');
      return false;
    },
    [scheduleReset]
  );

  return { copy, copied, error };
}