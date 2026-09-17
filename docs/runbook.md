
# Runbook — Video Chat Room

Эксплуатационная документация. Для деплоя см. `docs/deployment.md`.

---

## 1. Быстрые команды

| Что                  | Команда                         |
| ----------------------- | -------------------------------------- |
| Dev-режим          | `npm run dev`                        |
| Production-сборка | `npm run build`                      |
| Production-запуск | `cd server && npm start`             |
| Health-check            | `curl http://localhost:3000/health`  |
| Все тесты       | `npm test`                           |
| E2E                     | `cd client && npm run e2e`           |
| Load                    | `cd server && npm run load`          |
| Генерация SSL  | `cd server && npm run generate-cert` |

---

## 2. Метрики здоровья

### Health-check

```bash
curl http://localhost:3000/health
# {"ok":true,"ts":...,"rooms":N,"env":"production"}
```

**Что значит `rooms`:**

- `0` — нет активных комнат.
- `N` — N активных комнат.
- **Растёт бесконечно** → утечка, см. раздел 5.4.

### Мониторинг

```bash
pm2 status         # статус процесса
pm2 monit          # CPU/RAM в реальном времени
pm2 logs video-chat
```

---

## 3. Частые операции

### Перезапуск сервера

```bash
pm2 restart video-chat
```

**Downtime:** ~2–3 секунды.

### Обновление кода

```bash
cd /var/www/video-chat-room-fora-soft
git pull
npm install
npm run build
pm2 restart video-chat
```

### Ротация логов

pm2 **сам** ротирует логи. Для ручной очистки:

```bash
pm2 flush video-chat
```

### Остановка

```bash
pm2 stop video-chat
```

### Полное удаление

```bash
pm2 delete video-chat
pm2 save
```

---

## 4. Rollback

### 4.1. Откат кода

```bash
cd /var/www/video-chat-room-fora-soft

# Откатиться на предыдущий тег
git fetch --tags
git checkout v0.1.0

# Или откатить конкретный коммит
git revert <commit-hash>

# Переустановить и пересобрать
npm install
npm run build
pm2 restart video-chat
```

### 4.2. Откат одного коммита

```bash
git revert <bad-commit>
git push
# CI развернёт автоматически (если настроен)
```

### 4.3. Ручной откат из резервной копии

Если git не помогает:

```bash
# Восстановить из tar-архива
tar -xzf /backups/video-chat-YYYY-MM-DD.tar.gz -C /var/www/
pm2 restart video-chat
```

### 4.4. Откат базы данных

**Нет БД** — состояние комнат **только в памяти**. Откат = **перезапуск** (все комнаты **удаляются**).

> ⚠️ **Пользователи будут отключены** при перезапуске. Это **ожидаемо**.

### 4.5. Откат production-сборки (статики)

Если **новая сборка клиента** (`client/dist/`) сломала приложение — откатите **только статику**, не трогая сервер.

```bash
cd /var/www/video-chat-room-fora-soft

# 1. Откатить исходники
git checkout <previous-commit>

# 2. Пересобрать
npm run build

# 3. Перезапустить сервер
pm2 restart video-chat
```

**Если сервер вообще не трогали** — можно откатить **только** `client/dist/`:

```bash
# Восстановить client/dist из бэкапа
tar -xzf /backups/client-dist-YYYY-MM-DD.tar.gz -C /var/www/video-chat-room-fora-soft/
pm2 restart video-chat
```

### 4.6. Откат Node.js-образа

Если **сервер** был обновлён (например, через `git pull` + `pm2 restart`) и **стал работать нестабильно**:

```bash
# 1. Откатить код
cd /var/www/video-chat-room-fora-soft
git checkout <previous-commit>

# 2. Переустановить зависимости (чисто)
npm ci

# 3. Пересобрать клиент
npm run build

# 4. Перезапустить сервер
pm2 restart video-chat
```

**Проверка:**

```bash
curl http://localhost:3000/health
# {"ok":true,...,"env":"production"}
```

### 4.7. Что НЕ требует отката

| Что                                            | Почему                                                 |
| ------------------------------------------------- | ------------------------------------------------------------ |
| **База данных**                   | Нет БД — состояние в памяти            |
| **Миграции**                        | Не используются                                |
| **Клиентское хранилище** | Не используется (localStorage, sessionStorage) |
| **История чата**                 | Живёт только в памяти комнаты       |

**Вывод:** откат **безопасен** — нет постоянного состояния.

---

## 5. Диагностика проблем

### 5.1. Сервер не отвечает

**Симптом:** `curl http://localhost:3000/health` — timeout.

**Диагностика:**

```bash
pm2 status                         # процесс запущен?
sudo netstat -tulpn | grep 3000    # порт слушается?
pm2 logs video-chat --lines 50     # ошибки в логах?
```

**Решение:**

- Если процесс упал — `pm2 restart video-chat`.
- Если порт занят — `sudo kill <PID>`.
- Если ошибка в логах — читайте.

### 5.2. WebSocket не подключается (клиент)

**Симптом:** DevTools → Network → WS — соединение падает.

**Диагностика:**

```bash
# Проверить, что Socket.io слушает
curl http://localhost:3000/socket.io/?EIO=4&transport=polling
# Ожидаемо: 0{"sid":"...","upgrades":["websocket"],...}
```

**Решение:**

- Если **через nginx** — проверьте `Upgrade` / `Connection` заголовки.
- Если **напрямую** — проверьте firewall.

### 5.3. Комнаты не удаляются

**Симптом:** `/health` показывает `rooms: 100`, хотя все ушли.

**Диагностика:**

```bash
pm2 logs video-chat | grep "room:leave"
```

**Причина:** disconnect не отработал.

**Решение:** перезапуск сервера (комнаты в памяти).

### 5.4. Высокое потребление памяти

**Симптом:** `pm2 monit` показывает > 500 МБ.

**Причина:** накопление комнат / сообщений.

**Решение:**

- Проверьте `MAX_MESSAGES_PER_ROOM` (500 по умолчанию).
- Проверьте `rooms` в `/health`.
- Перезапуск: `pm2 restart video-chat`.

### 5.5. `getUserMedia` не работает

**Симптом:** браузер отказывает в доступе.

**Причина:** нет HTTPS.

**Решение:** деплой с HTTPS (см. `docs/deployment.md`).

---

## 6. Аварийные сценарии

### 6.1. Сервер упал

```bash
pm2 status
pm2 restart video-chat
pm2 logs video-chat --lines 100
```

**Если падает снова** — смотрите логи. **Возможные причины:**

- Нехватка памяти → `pm2 restart video-chat` (сбросит состояние).
- Порт занят → `sudo kill <PID>`, потом `pm2 restart`.
- Ошибка в коде → `git log`, откат (см. §4).

### 6.2. Сертификат Let's Encrypt истёк

```bash
sudo certbot renew
sudo systemctl reload nginx
```

**Авто-обновление** настроено certbot'ом. Если **не работает**:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### 6.3. DDoS / флуд

**Симптом:** сервер не отвечает, CPU 100%.

**Решение:**

- nginx: `limit_req_zone` + `limit_req`.
- Или временно закрыть порт:
  ```bash
  sudo ufw deny 443/tcp
  ```
- **Вне scope** тест-задания — rate-limit не реализован.

---

## 7. Бэкапы

### 7.1. Что бэкапить

- **Код** — в Git.
- **`.env`** — в защищённом месте (не в Git).
- **Сертификаты** — в `/etc/letsencrypt/` (управляет certbot).
- **Логи** — опционально, pm2 ротирует.

### 7.2. Резервная копия

```bash
tar -czf /backups/video-chat-$(date +%Y-%m-%d).tar.gz \
  --exclude=node_modules \
  /var/www/video-chat-room-fora-soft
```

### 7.3. Восстановление

```bash
tar -xzf /backups/video-chat-YYYY-MM-DD.tar.gz -C /var/www/
cd /var/www/video-chat-room-fora-soft
npm install
npm run build
pm2 restart video-chat
```

**Состояние комнат НЕ восстанавливается** — они в памяти.

---

## 8. Контакты

- **Разработчик:** Бельченко Елизавета Романовна
- **Email:** b09101412@gmail.com
- **Репозиторий:** https://github.com/BetTheFirst2025/video-chat-room-fora-soft
