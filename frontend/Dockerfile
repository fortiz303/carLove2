# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --force
COPY frontend . 
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/next-env.d.ts ./
COPY --from=builder /app/styles ./styles

RUN npm install --force --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
