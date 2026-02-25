# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json && npm cache clean --force && npm install --registry=https://registry.npmjs.org/ --fetch-timeout=600000 --fetch-retries=5

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Optional custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]