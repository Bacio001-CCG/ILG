FROM node:22.6-alpine3.19

# Set the working directory
WORKDIR /app

# Copy package files for both root and web-gui
COPY package*.json ./
COPY web-gui/package*.json ./web-gui/

# Install root dependencies
RUN npm install --legacy-peer-deps

# Install web-gui dependencies
WORKDIR /app/web-gui
RUN npm install --legacy-peer-deps

# Go back to root
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Build the Next.js app
WORKDIR /app/web-gui
RUN npm run build

# Go back to root
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Expose the ports
EXPOSE 3000
EXPOSE 3001

# Start all services concurrently
CMD ["npx", "concurrently", "-n", "web,agent,api", "-c", "cyan,magenta,green", "cd web-gui && npm start", "node agent/index.js", "node api/server.js"]