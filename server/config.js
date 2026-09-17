import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MAX_PARTICIPANTS: parseInt(process.env.MAX_PARTICIPANTS || '4', 10),
  MAX_NAME_LEN: parseInt(process.env.MAX_NAME_LEN || '30', 10),
  MAX_MSG_LEN: parseInt(process.env.MAX_MSG_LEN || '1000', 10),
  MAX_MESSAGES_PER_ROOM: parseInt(process.env.MAX_MESSAGES_PER_ROOM || '500', 10),
  STUN_URLS: process.env.STUN_URLS || 'stun:stun.l.google.com:19302',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SSL_CERT: process.env.SSL_CERT || null,  
  SSL_KEY: process.env.SSL_KEY || null, 
};