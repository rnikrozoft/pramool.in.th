# Step 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Run the app in a minimal environment
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
