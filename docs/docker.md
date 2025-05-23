# Running Midaz MCP Server in Docker

This guide explains how to run the Midaz MCP Server in a Docker container.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and run the container
docker-compose up -d

# View logs
docker-compose logs -f midaz-mcp-server

# Stop the container
docker-compose down
```

### Using Docker CLI

```bash
# Build the image
docker build -t midaz/mcp-server:latest .

# Run the container
docker run -it --name midaz-mcp-server \
  -e MIDAZ_USE_STUBS=true \
  -e MIDAZ_ONBOARDING_URL=http://host.docker.internal:3000 \
  -e MIDAZ_TRANSACTION_URL=http://host.docker.internal:3001 \
  -v $(pwd)/logs:/app/logs \
  midaz/mcp-server:latest
```

## Configuration

### Environment Variables

The Docker container supports all standard environment variables:

- `MIDAZ_ONBOARDING_URL` - Onboarding API URL (default: http://host.docker.internal:3000)
- `MIDAZ_TRANSACTION_URL` - Transaction API URL (default: http://host.docker.internal:3001)
- `MIDAZ_API_KEY` - API key for authentication
- `MIDAZ_USE_STUBS` - Use stub data (default: true)
- `MIDAZ_DOCS_URL` - Documentation URL (default: https://docs.lerian.studio)

### Connecting to Host Services

When running in Docker and connecting to services on your host machine:

- Use `host.docker.internal` instead of `localhost`
- Example: `http://host.docker.internal:3000`

### Volume Mounts

The container supports several volume mounts:

```yaml
volumes:
  - ./logs:/app/logs              # Audit logs
  - ./midaz-mcp-config.json:/app/midaz-mcp-config.json:ro  # Config file
```

## Integration with Claude Desktop

Since MCP uses stdio for communication, integrating Docker with Claude Desktop requires a bridge. Here are two approaches:

### Option 1: Using Docker Exec (Simpler)

1. Keep the container running:
```bash
docker run -d --name midaz-mcp-server \
  -e MIDAZ_USE_STUBS=true \
  midaz/mcp-server:latest \
  tail -f /dev/null
```

2. Configure Claude Desktop to use docker exec:
```json
{
  "mcpServers": {
    "midaz": {
      "command": "docker",
      "args": ["exec", "-i", "midaz-mcp-server", "node", "dist/index.js"]
    }
  }
}
```

### Option 2: Using Socket Bridge (Advanced)

1. Use docker-compose with the bridge service:
```bash
docker-compose up -d
```

2. Install socat on your host:
```bash
# macOS
brew install socat

# Linux
sudo apt-get install socat
```

3. Create a stdio-to-socket bridge:
```bash
socat STDIO TCP:localhost:3330
```

4. Configure Claude Desktop to use the bridge:
```json
{
  "mcpServers": {
    "midaz": {
      "command": "socat",
      "args": ["STDIO", "TCP:localhost:3330"]
    }
  }
}
```

## Security Considerations

The Docker image includes several security features:

1. **Non-root user**: Runs as `nodejs` user (UID 1001)
2. **Read-only filesystem**: Container filesystem is read-only
3. **No new privileges**: Prevents privilege escalation
4. **Minimal base image**: Uses Alpine Linux for smaller attack surface
5. **Isolated network**: Uses a dedicated Docker network

## Building Custom Images

To build a custom image with your modifications:

```dockerfile
# Dockerfile.custom
FROM midaz/mcp-server:latest

# Add custom configurations
COPY my-custom-config.json /app/midaz-mcp-config.json

# Add custom environment variables
ENV MIDAZ_CUSTOM_VAR=value
```

Build and run:
```bash
docker build -f Dockerfile.custom -t my-midaz-mcp:latest .
docker run -it my-midaz-mcp:latest
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker logs midaz-mcp-server
```

### Can't connect to host services

Ensure you're using `host.docker.internal`:
```bash
docker run -e MIDAZ_ONBOARDING_URL=http://host.docker.internal:3000 ...
```

### Permission issues with logs

Ensure the logs directory has proper permissions:
```bash
mkdir -p logs
chmod 755 logs
```

### Memory or CPU issues

Limit resources:
```bash
docker run --memory="512m" --cpus="0.5" ...
```

## Development with Docker

For development, mount your source code:

```bash
docker run -it \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/package.json:/app/package.json \
  --entrypoint /bin/sh \
  midaz/mcp-server:latest
```

Then inside the container:
```bash
npm run dev
```

## Docker Hub

The official image is available at:
```bash
docker pull midaz/mcp-server:latest
```

Tags:
- `latest` - Latest stable release
- `dev` - Development version
- `x.y.z` - Specific version