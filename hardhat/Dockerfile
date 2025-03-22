# Use Node.js 18 alpine image for a lightweight base
FROM node:18-alpine

# Install bash (optional, only if needed)
RUN apk add --no-cache bash

# Set working directory
WORKDIR /hardhat

# Copy package.json and package-lock.json first (better for caching)
COPY package*.json ./

# Install dependencies **before** copying the rest of the project
RUN npm install hardhat --save-dev && npm ci

# Copy the rest of the application code
COPY . .

# Ensure the installed Hardhat version is working
RUN npx hardhat --version

# Expose the Hardhat node port
EXPOSE 8545

# Define the volume (persist blockchain data)
VOLUME ["/hardhat"]

# Run Hardhat node with explicit local installation
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
