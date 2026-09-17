
# video-chat-room-fora-soft

Видеочат-комната до 4 участников: WebRTC (mesh) + Socket.io + React + Node.js.

Тестовое задание [Fora Soft](https://fora-soft.com).

---

## Оглавление

- [О проекте](#о-проекте)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Скрипты](#скрипты)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Тестирование](#тестирование)
- [Документация](#документация)
- [Troubleshooting](#troubleshooting)
- [Лицензия](#лицензия)

---

## О проекте

Веб-приложение для группового видеозвонка со встроенным текстовым чатом.
Рассчитано на **до 4 участников** в одной комнате одновременно.
Без регистрации, без установки приложений — достаточно открыть ссылку.

**Основные возможности:**

- Групповой аудио-видеозвонок до 4 участников (WebRTC mesh).
- Приглашение по ссылке без регистрации.
- Общий текстовый чат (Socket.io).
- Управление микрофоном и камерой.
- Список участников, системные сообщения.
- Обработка ошибок: отказ в доступе к медиа, недоступность сервера,
  неподдерживаемый браузер, переполненная комната.

**Демо:** [ссылка на видео-демо, если есть]

---

## Требования

- **Node.js 20 LTS** (см. `.nvmrc`)
- **npm 10+**
- **nvm-windows** (рекомендуется) или **fnm**
- Современный браузер с поддержкой WebRTC: **Chrome 100+**, **Firefox 100+**, **Edge 100+**
- **HTTPS** (или localhost) — обязательное условие для `getUserMedia`

### Установка Node.js 20 через nvm-windows

```powershell
# Установить Node 20
nvm install 20

# Переключиться на версию из .nvmrc
nvm use 20

# Проверить
node -v   # v20.x.x
npm -v    # 10.x.x
```

### Установка Node.js 20 без nvm

Скачайте Node.js 20 LTS с https://nodejs.org/en/download и установите.

---

## Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/BetTheFirst2025/video-chat-room-fora-soft.git
cd video-chat-room-fora-soft
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Dev-режим (server + client параллельно)

```bash
npm run dev
```

**Ожидаемо:**

- Сервер: http://localhost:3000
- Клиент: http://localhost:5173

### 4. Открыть приложение

Откройте http://localhost:5173 в браузере.

**Проверка работы:**

1. Введите имя → «Создать комнату».
2. Скопируйте URL из адресной строки.
3. Откройте URL в **новой вкладке**.
4. Введите второе имя → «Войти».
5. Оба участника видят друг друга, чат работает.

---

## Скрипты

| Команда                         | Описание                                                     |
| -------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                        | Запуск сервера и клиента параллельно |
| `npm run build`                      | Production-сборка клиента (`client/dist/`)            |
| `npm test`                           | Unit + integration тесты (server + client)                      |
| `npm run test:coverage -w server`    | Тесты сервера с покрытием                      |
| `npm run test:coverage -w client`    | Тесты клиента с покрытием                      |
| `npm run lint`                       | Линтинг обоих пакетов                             |
| `cd client && npm run e2e`           | E2E-тесты Playwright                                            |
| `cd server && npm run load`          | Load-тест Artillery                                              |
| `cd server && npm run generate-cert` | Генерация self-signed сертификата                |

### Production-запуск (один процесс)

```bash
# Собрать клиент
npm run build

# Запустить сервер (Express отдаёт статику)
cd server
npm start
```

Откройте http://localhost:3000 — приложение работает через Express.

### Production-запуск с HTTPS (self-signed)

```bash
cd server
npm run generate-cert

$env:SSL_CERT="./certs/cert.pem"
$env:SSL_KEY="./certs/key.pem"
npm start
```

Откройте https://localhost:3000 — примите self-signed сертификат.

---

## Архитектура

### Стек

| Слой                     | Технология                          |
| ---------------------------- | --------------------------------------------- |
| **Backend**            | Node.js 20, Express, Socket.io                |
| **Frontend**           | React 18, Vite, React Router                  |
| **Медиа**         | WebRTC (mesh, P2P full-mesh)                  |
| **ICE**                | Google STUN (`stun.l.google.com`)           |
| **Состояние** | In-memory (без БД)                       |
| **Тесты**         | Vitest (unit + integration), Playwright (E2E) |
| **CI**                 | GitHub Actions                                |

### Топология медиа — WebRTC mesh

- При **N** участниках: **N·(N−1)/2** P2P-соединений.
- Для 4 участников: **6 RTCPeerConnection** на комнату.
- **3 исходящих** потока с каждого клиента.
- **Лимит 4 участника** — следствие mesh-топологии.

### Сигналинг

- Socket.io обменивается SDP-офферами/ответами и ICE-кандидатами.
- **Glare-политика:** оффер инициирует **только вновь вошедший**.
- Сервер также обслуживает чат и presence.

### Жизненный цикл комнаты

- Комната создаётся при **первом** участнике.
- Удаляется, когда уходит **последний**.
- История чата живёт **только в памяти**.

---

## Структура проекта

```
video-chat-room-fora-soft/
├── client/                       # React SPA (Vite)
│   ├── public/
│   ├── e2e/                     # Playwright E2E-тесты
│   ├── src/
│   │   ├── components/          # UI-компоненты
│   │   ├── hooks/               # useSocket, useLocalMedia, useMesh, ...
│   │   ├── lib/                 # rtcConfig, roomId, webrtcSupport
│   │   ├── pages/               # StartPage, RoomPage
│   │   ├── styles/
│   │   └── test/                # Setup для Vitest
│   ├── index.html
│   ├── vite.config.js
│   └── playwright.config.js
├── server/                       # Node.js + Socket.io
│   ├── load/                    # Artillery load-тесты
│   ├── rooms/                   # Room, RoomRegistry, Participant
│   ├── scripts/                 # generate-cert
│   ├── signaling/               # handlers, validate, systemMessage
│   ├── util/                    # id
│   ├── config.js
│   └── index.js
├── docs/                         # PRD, TDD, план, документация
│   ├── prd-*.md
│   ├── tdd-*.md
│   ├── tasks-*.md
│   ├── deployment.md            # Деплой на Linux
│   ├── manual-testing.md        # Чеклист ручного тестирования
│   └── runbook.md               # Runbook + rollback
├── .editorconfig
├── .gitignore
├── .nvmrc
├── package.json                 # Workspaces
└── README.md
```

---

## Тестирование

### Unit + integration

```bash
npm test
```

- **Server**: 99 тестов (89% покрытие).
- **Client**: 113 тестов (77% покрытие).

Покрытие:

```bash
npm run test:coverage -w server
npm run test:coverage -w client
```

### E2E (Playwright)

```bash
cd client
npm run e2e
```

- 10 тестов: StartPage, 2/4 участника, чат, ROOM_FULL, медиа-ошибки, WebRTC.

### Load (Artillery)

```bash
cd server
npm run load
npm run load:report
```

Baseline: **1300 комнат**, **~5200 сокетов**, **p95 = 0.7 мс**, **0 ошибок**.

### Manual testing

См. [`docs/manual-testing.md`](docs/manual-testing.md).

---

## Документация

- [PRD](docs/prd-video-chat-room.md) — требования продукта
- [TDD](docs/tdd-video-chat-room.md) — технический дизайн
- [План задач](docs/tasks-video-chat-room.md) — 58 атомарных задач
- [Deployment](docs/deployment.md) — деплой на Linux с nginx + Let's Encrypt
- [Manual testing](docs/manual-testing.md) — чеклист ручного тестирования
- [Runbook](docs/runbook.md) — эксплуатация и rollback

---

## Troubleshooting

### `getUserMedia` не работает

- **Причина:** нет HTTPS (кроме localhost).
- **Решение:** используйте `localhost` или HTTPS-сертификат.

### `Error: listen EADDRINUSE: address already in use :::3000`

- **Причина:** порт 3000 занят другим процессом.
- **Решение:**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
  Stop-Process -Id <PID> -Force
  ```

### `Cannot find module 'node-forge'`

- **Решение:**
  ```bash
  npm install
  ```

### Браузер ругается на self-signed сертификат

- **Решение:** Advanced → Proceed. Или `thisisunsafe` в адресной строке.

### WebSocket не подключается

- **Причина:** nginx не проксирует WebSocket.
- **Решение:** добавьте `Upgrade $http_upgrade; Connection "upgrade";` в `location /`.

### E2E Playwright не скачивает Chromium

- **Причина:** `cdn.playwright.dev` недоступен.
- **Решение:** используйте `channel: 'chrome'` (системный Chrome) в `playwright.config.js`.

---

## Лицензия

Тестовое задание. Не для коммерческого использования.
