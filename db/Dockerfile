# Use the official PostgreSQL image from Docker Hub
FROM postgres:latest

# Set environment variables for database configuration
ENV POSTGRES_USER=root
ENV POSTGRES_PASSWORD=root
ENV POSTGRES_DB=root


# Copy custom initialization scripts into the container
COPY init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432

# Start PostgreSQL service automatically when the container starts
CMD ["postgres"]
