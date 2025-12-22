# Docker Setup Guide

This project includes Docker support for easy deployment using rootless Docker.

## Rootless Docker Installation

This guide uses rootless Docker (no sudo required):

```bash
# Install rootless Docker
curl -fsSL https://get.docker.com/rootless | sh

# Setup with skip iptables (if you encounter nf_tables errors)
~/bin/dockerd-rootless-setuptool.sh install --skip-iptables

# Add to your shell configuration (~/.zshrc or ~/.bashrc)
export PATH=$HOME/bin:$PATH
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock

# Reload shell configuration
source ~/.zshrc  # or source ~/.bashrc

# Start Docker daemon
systemctl --user start docker

# Enable Docker to start on boot
systemctl --user enable docker
loginctl enable-linger $(whoami)
```

**Important Notes:**
- Docker socket will be at `$XDG_RUNTIME_DIR/docker.sock`
- Port binding below 1024 requires additional configuration (see Troubleshooting)
- Use `docker compose` (with space) instead of `docker-compose`

## Quick Start

1. **Set up environment variables**
   ```bash
   # Edit the .env file in the root directory
   nano .env
   ```

2. **Build and start all services**
   ```bash
   docker compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Spring Boot backend on port 8080
   - Angular frontend on port 8000

3. **Check service status**
   ```bash
   docker compose ps
   ```

4. **View logs**
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f backend
   docker compose logs -f frontend
   docker compose logs -f db
   ```

## Access the Application

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## Cleaning Up

### Clean Build Artifacts

Remove build artifacts and Docker cache to save space:

```bash
# Use the cleanup script
./clean.sh

# Or manually clean
rm -rf backend/blog/target frontend/.angular frontend/dist
docker system prune -f
```

This removes:
- Maven build artifacts (target/)
- Angular cache (.angular/)
- Build outputs (dist/)
- Unused Docker resources

## Stopping the Services

```bash
# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (WARNING: deletes data)
docker compose down -v
```

## Development

### Rebuild after code changes

```bash
# Rebuild and restart a specific service
docker compose up -d --build backend
docker compose up -d --build frontend

# Rebuild all services
docker compose up -d --build
```

### Accessing service shells

```bash
# Backend container
docker compose exec backend sh

# Database
docker compose exec db psql -U bloguser -d blogdb

# Frontend container
docker compose exec frontend sh
```

### Viewing container logs

```bash
# All services
docker compose logs -f

# Specific service with last 100 lines
docker compose logs --tail=100 backend

# Follow new logs only
docker compose logs -f --tail=0 backend
```

## Production Considerations

1. **Security**:
   - Change the default passwords in `.env`
   - Use strong JWT secrets (at least 256 bits)
   - Configure proper firewall rules
   - Enable HTTPS with SSL certificates
   - Update CORS origins to match production domain

2. **Performance**:
   - Adjust PostgreSQL memory settings in docker-compose.yml
   - Configure backend connection pool sizes
   - Use a reverse proxy (nginx/traefik) for SSL termination
   - Enable CDN for static assets

3. **Backups**:
   - Regularly backup the PostgreSQL volume
   - Backup uploaded files volume
   ```bash
   # Backup database
   docker compose exec db pg_dump -U bloguser blogdb > backup.sql
   
   # Backup uploads
   docker compose cp blog-backend:/app/uploads ./uploads-backup
   
   # Restore database
   docker compose exec -T db psql -U bloguser blogdb < backup.sql
   ```

4. **Monitoring**:
   - Monitor container health: `docker compose ps`
   - View logs: `docker compose logs -f`
   - Check resource usage: `docker stats`

## Volumes

- `postgres_data`: PostgreSQL database files
- `backend_uploads`: User uploaded files

To inspect volumes:
```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect 01blog_postgres_data
docker volume inspect 01blog_backend_uploads
```

## Troubleshooting

### Rootless Docker Issues

**Docker daemon not running:**
```bash
# Check daemon status
systemctl --user status docker

# Start daemon
systemctl --user start docker

# View daemon logs
journalctl --user -u docker
```

**Permission issues with volumes:**
Rootless Docker runs containers with your user ID. If you encounter permission issues:
```bash
# Ensure proper ownership of volume directories
docker compose down
docker volume rm 01blog_postgres_data 01blog_backend_uploads
docker compose up -d
```

**Port 8000 not accessible (rootless):**
Ports below 1024 require special handling in rootless mode. Use a higher port by editing docker-compose.yml:
```yaml
# Change frontend service ports
frontend:
  ports:
    - "8000:80"  # Already using port 8000, which is > 1024
```
Then access the frontend at http://localhost:8000

### Backend can't connect to database
- Check if database is healthy: `docker compose ps`
- Verify environment variables in `.env`
- Check logs: `docker compose logs db`
- Ensure database service is running: `docker compose ps db`

### Frontend shows API errors
- Ensure backend is running: `docker compose ps backend`
- Check backend logs: `docker compose logs backend`
- Verify CORS configuration allows `http://localhost:8000`
- Check if backend is accessible: `curl http://localhost:8080/api/auth/login`

### Port conflicts
If ports 8000, 8080, or 5432 are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
# Example: Change frontend to port 8001
frontend:
  ports:
    - "8001:80"  # Changed from 8000 to 8001

# Example: Change backend to port 8081
backend:
  ports:
    - "8081:8080"  # Changed from 8080 to 8081
```

**Important**: If you change the backend port, update the frontend API configuration to match.

### Docker Compose command not found (rootless)
If using rootless Docker and `docker-compose` is not found:
```bash
# Install Docker Compose plugin
mkdir -p ~/.docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose

# Use 'docker compose' (with space) instead of 'docker-compose'
docker compose up -d
```

### Container keeps restarting
Check the logs to identify the issue:
```bash
# View logs for specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Follow logs in real-time
docker compose logs -f backend
```

Common causes:
- Database connection issues (check DB_URL, DB_USERNAME, DB_PASSWORD in .env)
- Missing environment variables
- Port conflicts
- Insufficient memory

### Build failures
If you encounter build errors:
```bash
# Clean Docker build cache
docker builder prune -f

# Rebuild without cache
docker compose build --no-cache

# Start with fresh containers
docker compose down
docker compose up -d --build
```

## Environment Variables

The `.env` file in the root directory contains configuration for Docker Compose:

```env
# Database Password
DB_PASSWORD=blogpassword

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-key-change-this-in-production-at-least-256-bits-long-for-security
```

**Important for Production:**
- Never commit the `.env` file to version control
- Use strong, unique passwords
- Generate a secure JWT secret (256+ bits)
- Consider using Docker secrets for sensitive data

## Advanced Configuration

### Custom Network Configuration
```bash
# Create external network
docker network create blog-network

# Use in docker-compose.yml
networks:
  blog-network:
    external: true
```

### Resource Limits
Add resource limits to docker-compose.yml:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Health Checks
Backend health check has been removed for simplicity. To re-enable:
```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

## Tips and Best Practices

1. **Development Workflow**:
   - Use `docker compose up -d` for background execution
   - Use `docker compose logs -f <service>` to debug specific services
   - Rebuild only changed services to save time

2. **Database Management**:
   - Use `docker compose exec db psql -U bloguser -d blogdb` for database access
   - Regular backups before major changes
   - Use volume mounts for easy backup access

3. **Performance**:
   - Volumes are faster than bind mounts
   - Use `.dockerignore` to exclude unnecessary files
   - Multi-stage builds reduce image size

4. **Security**:
   - Keep Docker and images updated
   - Scan images for vulnerabilities: `docker scout quickview`
   - Use non-root users in containers when possible (rootless Docker helps)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Rootless Docker Documentation](https://docs.docker.com/engine/security/rootless/)
- [Spring Boot with Docker](https://spring.io/guides/topicals/spring-boot-docker/)
- [Angular Docker Deployment](https://angular.io/guide/deployment)
