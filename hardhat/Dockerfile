# Use Node.js 18 Alpine for a lightweight base
FROM node:18-alpine

# Install bash and required dependencies
RUN apk add --no-cache bash

# Set working directory inside the container
WORKDIR /hardhat

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Ensure Hardhat is installed locally
RUN npm install --save-dev hardhat && npm ci

# Copy the rest of the Hardhat project files
COPY . .

# Expose the Hardhat node's default port
EXPOSE 8545

# Run Hardhat node using the local installation
CMD ["node_modules/.bin/hardhat", "node", "--hostname", "0.0.0.0"]
