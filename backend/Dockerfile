# Qimlik API. Yapi baglami depo kokudur (Coolify base_directory=/).
FROM node:20-alpine

WORKDIR /app

# Once manifest: bagimliliklar kaynak degisiminde yeniden kurulmasin (katman onbellegi).
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Veritabani imajin ICINDE degil, kalici diskte durur (TURSO_DATABASE_URL ile gosterilir).
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3303
EXPOSE 3303

CMD ["node", "server.js"]
