FROM node:18 AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

COPY . .

# Build the specific app using Nx
RUN pnpm nx build licenses

# Expose the app's port (adjust as necessary)
EXPOSE 3000

# Start the application
CMD pnpm nx migration:run licenses && node dist/apps/licenses/main.js
