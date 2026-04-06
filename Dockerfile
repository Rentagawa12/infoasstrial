FROM node:18-alpine as base

# Create app directory
WORKDIR /app

# Install dependencies and build frontend
FROM base as frontend
COPY FRONTEND/ ./frontend/
WORKDIR /app/frontend
# No build needed as it's static HTML/CSS/JS

# Install dependencies and build backend
FROM base as backend
WORKDIR /app/backend
COPY BACKEND/package*.json ./
RUN npm install
COPY BACKEND/ ./
# Create uploads directory
RUN mkdir -p uploads

# Final stage
FROM base
WORKDIR /app

# Copy frontend files
COPY --from=frontend /app/frontend ./FRONTEND

# Copy backend files and node_modules
COPY --from=backend /app/backend/node_modules ./BACKEND/node_modules
COPY --from=backend /app/backend ./BACKEND

# Set environment variables
ENV NODE_ENV=production
# PORT will be provided by Render at runtime

# Expose the port for the application - will be overridden by Render
EXPOSE 10000

# Command to run the application
CMD ["node", "BACKEND/server.js"] 