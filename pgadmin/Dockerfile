FROM dpage/pgadmin4

# Set environment variables (optional, can also be set in docker-compose.yml)
ARG PGADMIN_DEFAULT_EMAIL
ENV PGADMIN_DEFAULT_EMAIL=${PGADMIN_DEFAULT_EMAIL}
ARG PGADMIN_DEFAULT_PASSWORD
ENV PGADMIN_DEFAULT_PASSWORD=${PGADMIN_DEFAULT_PASSWORD}

# Expose pgAdmin's default port
EXPOSE 80

CMD ["/entrypoint.sh"]
