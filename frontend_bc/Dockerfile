# ---------- Stage 1: Build the React app ----------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy rest of the source code
COPY . .

# Build the app → dist/

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ---------- Stage 2: Serve with Nginx ----------
FROM nginx:alpine

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: replace default nginx.conf for React Router (SPA support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
