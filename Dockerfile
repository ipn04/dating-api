# Use Node 20 Alpine for small image
FROM node:20-alpine

# Install tools for building native modules (Prisma, etc.)
RUN apk add --no-cache bash build-base python3

# Set working directory
WORKDIR /app

# Copy only package.json & package-lock.json for caching dependencies
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build TypeScript (NestJS)
RUN npm run build

# Expose NestJS port
EXPOSE 3333

# Start server (generate Prisma client at runtime)
CMD ["sh", "-c", "npx prisma generate && npm run start:prod"]
