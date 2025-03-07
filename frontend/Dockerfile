# Use Node.js 16 alpine image for a lightweight base
FROM node:18-alpine

RUN apk add --no-cache bash  # Install bash package

# Set working directory
WORKDIR /frontend

RUN npm cache clean --force
RUN npm install -g ethers
RUN npm install -g ethers @ethersproject/providers

# Copy package.json and package-lock.json (or yarn.lock)
ADD package*.json ./

# Expose React development server port (default: 3000)
EXPOSE 3000

# Mount the local frontend folder as a volume (replace 'frontend' with your actual folder name)
VOLUME ["frontend"]

# Install dependencies (use npm ci for exact version control)
RUN npm ci

# Use a separate non-root user for the running container (recommended)
#RUN adduser --disabled-password --shell /bin/sh appuser
#USER appuser

# Switch to the command that starts the React development server 
CMD [ "npm", "start" ]
