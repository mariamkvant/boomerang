FROM node:20-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm install

# Build server TypeScript
COPY tsconfig.json ./
COPY server/ ./server/
RUN npx tsc -p tsconfig.json

# Build client
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "dist/server/index.js"]
