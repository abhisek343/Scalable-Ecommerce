#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}🚀 Starting CartFlow Demo Environment...${NC}\n"

# 1. Start the Microservices Stack
echo -e "${BLUE}➡️  Starting Docker services...${NC}"
docker compose up -d

# 2. Wait for Nginx to be healthy
echo -e "${BLUE}⏳ Waiting for API Gateway (Nginx) to be ready...${NC}"
until curl --output /dev/null --silent --head --fail http://localhost:80; do
    printf '.'
    sleep 2
done
echo -e "\n${GREEN}✅ Services are UP and Running!${NC}\n"

# 3. Start Cloudflare Tunnel (using a temporary docker container)
echo -e "${BLUE}🌐 Establishing Secure Internet Tunnel (Cloudflared)...${NC}"
echo -e "${BLUE}----------------------------------------------------------------${NC}"
echo -e "${GREEN}👇 COPY THIS URL AND SEND IT TO HR/INTERVIEWER 👇${NC}"
echo -e "${BLUE}----------------------------------------------------------------${NC}"

# Run cloudflared and grep the URL
# We use 'host.docker.internal' to access the host's localhost:80 from inside the tunnel container
# Note: Linux users may need '--add-host host.docker.internal:host-gateway'
docker run --rm --name cartflow-tunnel \
  --add-host host.docker.internal:host-gateway \
  cloudflare/cloudflared:latest tunnel --url http://host.docker.internal:80 2>&1 | grep --color=always "trycloudflare.com"

# The script will hang here as long as the tunnel is open, which is what we want.
