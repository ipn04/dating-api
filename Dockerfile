# Use Node 20 Alpine for small image
FROM node:20-alpine

# Install tools for building native modules (Prisma, etc.)
RUN apk add --no-cache bash build-base python3

# Set working directory
WORKDIR /app

# Copy only package.json & package-lock.json first to leverage cache
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS TypeScript code
RUN npm run build

# Expose NestJS port
EXPOSE 3333

# Start the app in staging/prod mode
CMD ["npm", "run", "start:prod"]
