# Use official Node.js Alpine image for smaller size
FROM node:18-alpine

# Install necessary packages for building native dependencies
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for building
RUN npm ci

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript project
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the stdio interface (MCP uses stdio, not network ports)
# This is more for documentation purposes
EXPOSE 3330

# Set environment variables
ENV NODE_ENV=production
ENV MIDAZ_USE_STUBS=false
ENV MIDAZ_DOCS_URL=https://docs.lerian.studio

# The MCP server uses stdio, so we need to keep the container running
# and allow it to communicate via stdio
CMD ["node", "dist/index.js"]