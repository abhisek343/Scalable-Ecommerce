# ---- Builder Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build TypeScript code
# Ensure tsconfig.json is present and correctly configured for 'outDir': './dist'
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Expose the correct port the application runs on
EXPOSE 5004

# Command to run the application
CMD [ "node", "dist/index.js" ]
