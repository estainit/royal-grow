# Use Node.js 18 Alpine
FROM node:18-alpine

# Install bash & required dependencies
RUN apk add --no-cache bash

# Set working directory
WORKDIR /hardhat

# Copy package.json and package-lock.json
COPY package*.json ./

# Force local installation of Hardhat
RUN npm install --save-dev hardhat && npm ci

# Copy remaining files
COPY . .

# Ensure Hardhat is installed in node_modules
RUN ls -la node_modules/.bin && npx hardhat --version

# Expose Hardhat's default port
EXPOSE 8545

# Force usage of local Hardhat installation
ENTRYPOINT ["npx", "hardhat"]
CMD ["node", "--hostname", "0.0.0.0"]
