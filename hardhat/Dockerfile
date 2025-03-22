# Use Node.js 18 Alpine for a lightweight base
FROM node:18-alpine

# Install bash (optional)
RUN apk add --no-cache bash

# Set working directory
WORKDIR /hardhat

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install Hardhat explicitly as a local dependency
RUN npm install --save-dev hardhat && npm ci

# Copy the rest of the application code
COPY . .

# Verify that Hardhat is correctly installed
RUN ls -la node_modules/.bin && npx hardhat --version

# Expose the Hardhat node port
EXPOSE 8545

# Define the volume (persist blockchain data)
VOLUME ["hardhat"]

# Run Hardhat node using local installation
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
