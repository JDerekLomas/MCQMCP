FROM node:20-slim

WORKDIR /app

# Install dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Create data directory
RUN mkdir -p /data

ENV MCQMCP_DATA_DIR=/data

CMD ["node", "dist/index.js", "--http"]
