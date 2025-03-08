# Use Node.js 18 alpine image for a lightweight base
FROM node:18-alpine

# Install bash (optional, only if needed)
RUN apk add --no-cache bash

# Set working directory
WORKDIR /hardhat

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port Hardhat runs on (default: 8545)
EXPOSE 8545

# Start Hardhat node
CMD ["npx", "hardhat", "node"]