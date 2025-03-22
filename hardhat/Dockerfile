# Use Node.js 18 alpine image for a lightweight base
FROM node:18-alpine

# Install bash (optional, only if needed)
RUN apk add --no-cache bash

# Set working directory
WORKDIR /hardhat

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm uninstall -g hardhat

# Install dependencies (ensure Hardhat is installed locally)
RUN npm ci  # npm install is not reliable, use ci for clean install

# Copy the rest of the application code
COPY . .

# Set the default CMD
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
