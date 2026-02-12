# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build


# ---------- Run stage ----------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# If you use .env inside container (optional)
# COPY .env .env

# Change this if your server uses another port
EXPOSE 8080

# Start
CMD ["node", "dist/server.js"]
