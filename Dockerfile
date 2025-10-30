FROM node:20-alpine

# Install tools for building native modules (Prisma, etc.)
RUN apk add --no-cache bash build-base python3

WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./

RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy everything else after dependencies are installed
COPY . .

# Generate Prisma client (needed for dev)
RUN npx prisma generate

# Optional: build TypeScript (dev can also run without build)
RUN npm run build

EXPOSE 3333

# Start dev server
CMD [  "npm", "run", "start:migrate:prod" ]
