# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install bash and necessary dependencies
RUN apk add --no-cache bash

# Set working directory inside the container
WORKDIR /hardhat

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies (Ensure Hardhat is installed locally)
RUN npm install && npm install --save-dev hardhat

# Copy the rest of the Hardhat project files
COPY . .

# Ensure the entry script is executable
RUN chmod +x node_modules/.bin/hardhat

# Expose the Hardhat default port
EXPOSE 8545

# Run Hardhat using the local installation
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
