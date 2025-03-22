# Base image
FROM node:18-alpine AS builder

RUN apk add --no-cache bash  # Install bash package

# Set working directory
WORKDIR /backend

RUN npm cache clean --force
RUN npm -g install nodemon

# Copy package.json and package-lock.json (or yarn.lock)
ADD package*.json ./

# Install dependencies
RUN npm ci

# Development stage (copy everything)
FROM builder AS dev

# Mount your local source code directory as a volume
VOLUME ["/backend"]

# Copy everything from the builder stage
COPY --from=builder . .

# Expose port for your Node.js application (adjust if needed)
EXPOSE 3100

# Add these lines to your Dockerfile
ENV NODE_OPTIONS='--inspect=0.0.0.0:9229'
EXPOSE 9229

# Run development script with nodemon for hot-reloading
# CMD [ "nodemon", "--watch", ".", "--ext", "js,json", "--ignore", "node_modules/", "server.js" ]
CMD ["nodemon", "--watch", ".", "--ext", "js,json", "--ignore", "node_modules/", "--inspect=0.0.0.0:9229", "server.js"]

