# Frontend Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Increase Node memory limit
ENV NODE_OPTIONS=--max_old_space_size=4096

# Copy package files first
COPY package.json ./

# Install dependencies with npm (more reliable)
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build the app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
