# Frontend Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Increase Node memory limit and disable CI warnings as errors
ENV NODE_OPTIONS=--max_old_space_size=4096
ENV CI=false
ENV GENERATE_SOURCEMAP=false

# Copy package files (yarn.lock is optional)
COPY package.json ./
COPY yarn.lock* ./

# Install ALL dependencies (including devDependencies for craco build)
# Use --frozen-lockfile only if yarn.lock exists
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile --network-timeout 600000; \
    else \
      yarn install --network-timeout 600000; \
    fi

# Copy all source files
COPY . .

# Build the app with craco
RUN yarn build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
