
# video-chat-room-fora-soft

Видеочат-комната до 4 участников: WebRTC (mesh) + Socket.io + React + Node.js.

Тестовое задание [Fora Soft](https://fora-soft.com).

## Описание

Веб-приложение для группового видеозвонка со встроенным текстовым чатом.
Рассчитано на **до 4 участников** в одной комнате одновременно. Без
регистрации, без установки приложений — достаточно открыть ссылку.

**Основные возможности:**

- Групповой аудио-видеозвонок до 4 участников (WebRTC mesh).
- Приглашение по ссылке без регистрации.
- Общий текстовый чат (Socket.io).
- Управление микрофоном и камерой.
- Список участников, системные сообщения.
- Обработка ошибок: отказ в доступе к медиа, недоступность сервера,
  неподдерживаемый браузер, переполненная комната.

## Требования

- **Node.js 20 LTS** (см. `.nvmrc`)
- **npm 10+**
- **nvm-windows** (рекомендуется) или **fnm**
- Современный браузер с поддержкой WebRTC: Chrome 100+, Firefox 100+,
  Edge 100+
- HTTPS (или localhost) — обязательное условие для `getUserMedia`

## Установка окружения

### Через nvm-windows

```powershell
# Установить Node 20
nvm install 20

# Переключиться на версию из .nvmrc
nvm use 20

# Проверить
node -v   # v20.x.x
npm -v    # 10.x.x
```


Без nvm
Скачайте Node.js 20 LTS с https://nodejs.org/en/download и установите.

Быстрый старт
bash

# Установка зависимостей (из корня проекта)

npm install

# Запуск dev-режима (server + client параллельно)

npm run dev
После запуска:

Сервер: http://localhost:3000

Клиент: http://localhost:5173

Скрипты
Команда	Описание
npm run dev	Запуск сервера и клиента параллельно
npm run build	Production-сборка клиента
npm test	Unit + integration тесты
npm run lint	Линтинг обоих пакетов
Архитектура
Backend: Node.js + Express + Socket.io — сигналинг, чат, presence.

Frontend: React 18 + Vite — SPA с роутингом.

Медиа: WebRTC в топологии mesh (P2P full-mesh, до 4 участников).

ICE: публичные Google STUN (stun.l.google.com), без TURN.

Состояние: in-memory на сервере, без БД. На клиенте — без localStorage.

Структура проекта
text
video-chat-room-fora-soft/
├── client/          # React SPA (Vite)
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── pages/
├── server/          # Node.js + Socket.io
│   ├── rooms/       # Room, RoomRegistry, Participant
│   ├── signaling/   # Обработчики Socket.io
│   └── util/        # Утилиты (id, validate)
└── docs/            # PRD, TDD, план задач
Документация
PRD — требования продукта

TDD — технический дизайн

План задач — 58 атомарных задач

Лицензия
Тестовое задание. Не для коммерческого использования.

text

Сохраните.

#### 1.2. `NOTES.md` — рабочие заметки

Откройте `NOTES.md` и вставьте:

```markdown
# Notes

Рабочие заметки по проекту. Не часть основной документации.

## Окружение

- Node.js 20 LTS через nvm-windows.
- npm 10.8.2.
- ОС: Windows.

## Решения

- **Node 20, не 22** — по TDD §12.5. Установлен через nvm-windows v1.1.12.
- **.gitignore** — расширен `.DS_Store`, `Thumbs.db`, `.vscode/*`,
  `test-results/`, `playwright-report/`.
- **.editorconfig** — LF, 2 пробела, UTF-8.
- **.nvmrc** — `20`. nvm-windows v1.1.x не читает `.nvmrc` автоматически;
  используем `nvm use 20` (или через CI — `node-version-file`).

## Известные ограничения

- nvm-windows v1.1.12 требует явный аргумент для `nvm use`.
- При кириллице в пути (`C:\Users\Бет\...`) nvm-windows может падать;
  решено переносом папки nvm в `C:\nvm`.

## Открытые вопросы

- (из TDD §14) — закрываются по мере выполнения задач.
Сохраните.

1.3. Коммит
powershell
cd C:\Users\Бет\Desktop\fora\video-chat-room-fora-soft
git add README.md NOTES.md
git commit -m "docs: fill README and NOTES with project overview"
```
