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

# Go back to root and copy all code
WORKDIR /app
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

# Start all services - fixed paths
CMD ["npx", "concurrently", "-n", "web,agent,api", "-c", "cyan,magenta,green", \
     "npm start --prefix web-gui", \
     "node agent/index.js", \
     "node api/server.js"]