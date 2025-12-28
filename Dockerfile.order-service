# ---- Builder Stage ----
FROM node:18-alpine AS builder

# Copy shared library
COPY shared /shared

WORKDIR /app

# Copy package files
COPY order-service/package*.json ./
RUN npm install

# Copy application code
COPY order-service .

# Install shared library explicitly
WORKDIR /shared
RUN npm install && npm run build

WORKDIR /app
RUN npm install /shared

# Build TypeScript code
# Ensure tsconfig.json is present and correctly configured for 'outDir': './dist'
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine

# Copy shared library and build it
COPY shared /shared
WORKDIR /shared
RUN npm install && npm run build

WORKDIR /app

# Copy package files
COPY order-service/package*.json ./

# Install only production dependencies
# Also install shared library
RUN npm install --omit=dev && npm install /shared --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Expose the correct port the application runs on
EXPOSE 5003

# Command to run the application
CMD [ "node", "dist/index.js" ]
