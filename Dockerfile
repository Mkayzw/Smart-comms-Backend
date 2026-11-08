FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY start-services.js ./start-services.js

ENV NODE_ENV=production PORT=3000
EXPOSE 3000

# The gateway (port 3000) proxies to the other services, so start them all.
# No migrations folder exists, so sync the schema on start; db push refuses
# changes that would lose data.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node start-services.js"]
