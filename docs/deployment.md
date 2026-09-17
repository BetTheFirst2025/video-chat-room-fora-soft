
# Deployment Guide — Video Chat Room

Инструкция по деплою в production. Целевая среда — **Ubuntu/Debian** с **nginx** и **Node.js 20 LTS**.

---

## 1. Требования

- **Node.js** 20 LTS на сервере.
- **npm** 10+.
- **nginx** (или другой reverse-proxy).
- **Домен** с A-записью, указывающей на IP сервера.
- **Let's Encrypt** (certbot) — для TLS.
- **pm2** (опционально) — для управления процессом.

---

## 2. Клонирование и сборка

```bash
git clone https://github.com/BetTheFirst2025/video-chat-room-fora-soft.git
cd video-chat-room-fora-soft
npm install
npm run build   # собирает client/dist
```
