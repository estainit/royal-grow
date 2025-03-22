# Use the official PostgreSQL image from Docker Hub
FROM postgres:latest

# Set environment variables for database configuration
ARG POSTGRES_USER
ENV POSTGRES_USER=${POSTGRES_USER}
ARG POSTGRES_PASSWORD
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ARG POSTGRES_DB
ENV POSTGRES_DB=${POSTGRES_DB}

# Copy custom initialization scripts into the container
COPY init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5433

# Start PostgreSQL service automatically when the container starts
CMD ["postgres"]
