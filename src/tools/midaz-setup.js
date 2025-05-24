/**
 * Midaz Backend Setup Tools
 * Provides installation and deployment instructions for Midaz backend
 */

import { z } from "zod";
import { wrapToolHandler, validateArgs } from "../util/mcp-helpers.js";

/**
 * Register Midaz setup tools
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server MCP server instance
 */
export const registerMidazSetupTools = (server) => {
  // Local Docker setup instructions
  server.tool(
    "get-midaz-local-setup",
    "Get step-by-step instructions for setting up Midaz backend locally using Docker",
    {
      format: z.enum(["detailed", "quick"]).optional().describe("Level of detail in instructions")
    },
    wrapToolHandler(async (args, extra) => {
      const format = args.format || "detailed";
      
      const quickInstructions = `## Quick Local Setup

**Prerequisites:**
- Docker and Docker Compose installed

**Commands:**
\`\`\`bash
# Clone Midaz repository
git clone https://github.com/LerianStudio/midaz
cd midaz

# Set up environment variables
make set-env

# Start all services
make up
\`\`\`

**Services Started:**
- PostgreSQL, MongoDB, RabbitMQ, Redis, Grafana
- Onboarding Service (port 3000)
- Transaction Service (port 3001)

**Verification:**
- Onboarding API: http://localhost:3000
- Transaction API: http://localhost:3001
- Grafana Dashboard: http://localhost:3001/grafana`;

      const detailedInstructions = `## Detailed Local Setup Guide

### Prerequisites
- **Docker Desktop** or **Docker Engine** with Docker Compose
- **Git** for cloning the repository
- **Make** utility (usually pre-installed on macOS/Linux)

### Step-by-Step Installation

#### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/LerianStudio/midaz
cd midaz
\`\`\`

#### 2. Environment Setup
\`\`\`bash
# Set up environment variables and configuration
make set-env
\`\`\`
This command creates necessary environment files and configures the services.

#### 3. Start All Services
\`\`\`bash
# Start the complete Midaz stack
make up
\`\`\`
This command will:
- Pull required Docker images
- Start infrastructure services (databases, message queues, monitoring)
- Build and start Midaz microservices
- Set up networking between services

#### 4. Services Overview

**Infrastructure Services:**
- **PostgreSQL**: Primary database for transactional data
- **MongoDB**: Document storage for flexible data
- **RabbitMQ**: Message broker for async communication
- **Redis**: Caching and session storage
- **Grafana**: Monitoring and observability dashboard

**Core Services:**
- **Onboarding Service**: http://localhost:3000
  - Handles organizations, ledgers, accounts management
  - API documentation available at /swagger
- **Transaction Service**: http://localhost:3001
  - Manages transactions, operations, balances
  - API documentation available at /swagger

#### 5. Verification Steps
\`\`\`bash
# Check all services are running
docker-compose ps

# Test Onboarding API
curl http://localhost:3000/health

# Test Transaction API  
curl http://localhost:3001/health

# Access Grafana Dashboard
open http://localhost:3001/grafana
\`\`\`

#### 6. Development Commands
\`\`\`bash
# Run tests
make test

# Format code
make format

# Run linter
make lint

# Set up git hooks
make setup-git-hooks

# Stop services
make down

# Clean up (remove volumes)
make clean
\`\`\`

### Troubleshooting

**Common Issues:**
1. **Port conflicts**: Ensure ports 3000, 3001, 5432, 27017, 5672, 6379 are available
2. **Docker memory**: Increase Docker memory allocation to at least 4GB
3. **Permission issues**: Run \`sudo make up\` if permission errors occur

**Logs:**
\`\`\`bash
# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs onboarding-service
docker-compose logs transaction-service
\`\`\`

### Next Steps
Once running locally, configure your MCP server to connect:
\`\`\`bash
export MIDAZ_ONBOARDING_URL=http://localhost:3000
export MIDAZ_TRANSACTION_URL=http://localhost:3001
\`\`\``;

      return {
        success: true,
        instructions: format === "quick" ? quickInstructions : detailedInstructions,
        format: format,
        repositoryUrl: "https://github.com/LerianStudio/midaz",
        docsUrl: "https://docs.lerian.studio"
      };
    })
  );

  // Production deployment instructions
  server.tool(
    "get-midaz-production-setup",
    "Get instructions for deploying Midaz in production using Helm templates",
    {},
    wrapToolHandler(async (args, extra) => {
      const instructions = `## Production Deployment with Helm

### Prerequisites
- **Kubernetes cluster** (1.19+)
- **Helm 3.x** installed
- **kubectl** configured for your cluster
- **PostgreSQL** and **MongoDB** (managed or self-hosted)

### Deployment Steps

#### 1. Add Midaz Helm Repository
\`\`\`bash
# Add the Midaz Helm repository
helm repo add midaz https://charts.lerian.studio
helm repo update
\`\`\`

#### 2. Configure Values
Create a \`values.yaml\` file:
\`\`\`yaml
# values.yaml
global:
  domain: your-domain.com
  
onboarding:
  enabled: true
  replicas: 3
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

transaction:
  enabled: true
  replicas: 3
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

database:
  postgresql:
    external: true
    host: your-postgres-host
    port: 5432
    database: midaz
  mongodb:
    external: true
    host: your-mongo-host
    port: 27017
    database: midaz

ingress:
  enabled: true
  className: nginx
  tls:
    enabled: true
    secretName: midaz-tls
\`\`\`

#### 3. Install Midaz
\`\`\`bash
# Create namespace
kubectl create namespace midaz

# Install with Helm
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --values values.yaml
\`\`\`

#### 4. Verify Deployment
\`\`\`bash
# Check pod status
kubectl get pods -n midaz

# Check services
kubectl get svc -n midaz

# Check ingress
kubectl get ingress -n midaz
\`\`\`

### Configuration Options

**Scaling:**
- Set \`replicas\` for each service
- Configure HPA (Horizontal Pod Autoscaler)
- Set resource limits and requests

**Security:**
- Enable TLS/SSL certificates
- Configure network policies
- Set up RBAC
- Use secrets for sensitive data

**Monitoring:**
- Enable Prometheus metrics
- Configure Grafana dashboards
- Set up log aggregation

### Health Checks
\`\`\`bash
# Check service health
curl https://your-domain.com/onboarding/health
curl https://your-domain.com/transaction/health
\`\`\`

For detailed Helm chart documentation, visit: https://docs.lerian.studio/deployment/helm`;

      return {
        success: true,
        instructions: instructions,
        deploymentType: "production",
        helmRepository: "https://charts.lerian.studio",
        docsUrl: "https://docs.lerian.studio/deployment/helm"
      };
    })
  );

  // Cloud deployment instructions
  server.tool(
    "get-midaz-cloud-setup",
    "Get instructions for deploying Midaz in cloud environments using Terraform + Helm",
    {
      provider: z.enum(["aws", "gcp", "azure"]).optional().describe("Cloud provider preference")
    },
    wrapToolHandler(async (args, extra) => {
      const provider = args.provider || "aws";
      
      const instructions = `## Cloud Deployment with Terraform + Helm

### Overview
Midaz cloud deployment uses:
- **Terraform**: Infrastructure provisioning
- **Helm**: Application deployment
- **Kubernetes**: Container orchestration

### Prerequisites
- **Terraform** 1.0+ installed
- **Helm** 3.x installed
- **kubectl** configured
- **Cloud CLI** (aws-cli, gcloud, or az) configured

### ${provider.toUpperCase()} Deployment

#### 1. Clone Infrastructure Templates
\`\`\`bash
git clone https://github.com/LerianStudio/midaz-terraform
cd midaz-terraform/${provider}
\`\`\`

#### 2. Configure Terraform Variables
Edit \`terraform.tfvars\`:
\`\`\`hcl
# terraform.tfvars
region = "${provider === 'aws' ? 'us-west-2' : provider === 'gcp' ? 'us-central1' : 'East US'}"
cluster_name = "midaz-production"
node_count = 3
node_size = "${provider === 'aws' ? 't3.medium' : provider === 'gcp' ? 'e2-medium' : 'Standard_B2s'}"

# Database configuration
database_tier = "production"
database_backup_enabled = true

# Networking
vpc_cidr = "10.0.0.0/16"
enable_nat_gateway = true
\`\`\`

#### 3. Provision Infrastructure
\`\`\`bash
# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply
\`\`\`

This creates:
- **Kubernetes cluster** (${provider === 'aws' ? 'EKS' : provider === 'gcp' ? 'GKE' : 'AKS'})
- **Managed databases** (${provider === 'aws' ? 'RDS PostgreSQL + DocumentDB' : provider === 'gcp' ? 'Cloud SQL + Firestore' : 'Azure Database for PostgreSQL + Cosmos DB'})
- **Load balancers** and networking
- **IAM roles** and security groups

#### 4. Configure kubectl
\`\`\`bash
# ${provider === 'aws' ? 'AWS' : provider === 'gcp' ? 'GCP' : 'Azure'} specific command
${provider === 'aws' 
  ? 'aws eks update-kubeconfig --region us-west-2 --name midaz-production'
  : provider === 'gcp'
  ? 'gcloud container clusters get-credentials midaz-production --zone us-central1'
  : 'az aks get-credentials --resource-group midaz-rg --name midaz-production'
}
\`\`\`

#### 5. Deploy Midaz with Helm
\`\`\`bash
# Add Helm repository
helm repo add midaz https://charts.lerian.studio
helm repo update

# Create values file from Terraform outputs
terraform output -json > terraform-outputs.json

# Deploy Midaz
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --create-namespace \\
  --values cloud-values.yaml
\`\`\`

#### 6. Configure DNS and TLS
\`\`\`bash
# Get load balancer IP/hostname
kubectl get svc -n midaz

# Configure DNS records
# Point your domain to the load balancer

# Install cert-manager for TLS
helm install cert-manager jetstack/cert-manager \\
  --namespace cert-manager \\
  --create-namespace \\
  --set installCRDs=true
\`\`\`

### Monitoring and Scaling

**Monitoring Stack:**
\`\`\`bash
# Install monitoring
helm install prometheus prometheus-community/kube-prometheus-stack \\
  --namespace monitoring \\
  --create-namespace
\`\`\`

**Auto-scaling:**
\`\`\`bash
# Configure HPA
kubectl apply -f hpa-config.yaml
\`\`\`

### Cost Optimization
- Use spot instances for non-critical workloads
- Configure cluster autoscaler
- Set resource requests/limits
- Monitor and optimize database usage

### Security Best Practices
- Enable network policies
- Use managed identity/IAM roles
- Encrypt data at rest and in transit
- Regular security updates

For complete cloud deployment guides, visit: https://docs.lerian.studio/deployment/cloud`;

      return {
        success: true,
        instructions: instructions,
        provider: provider,
        terraformRepository: "https://github.com/LerianStudio/midaz-terraform",
        docsUrl: `https://docs.lerian.studio/deployment/cloud/${provider}`
      };
    })
  );

  // Complete deployment comparison
  server.tool(
    "compare-midaz-deployments",
    "Compare different Midaz deployment options (local, production, cloud)",
    {},
    wrapToolHandler(async (args, extra) => {
      const comparison = `## Midaz Deployment Options Comparison

### 🖥️ Local Development (Docker)
**Best for:** Development, testing, proof-of-concept

**Pros:**
- Quick setup (5 minutes)
- No external dependencies
- Full feature access
- Easy debugging
- Cost-free

**Cons:**
- Single machine limitations
- Not suitable for production
- Limited scalability
- No high availability

**Setup Time:** 5-10 minutes
**Cost:** Free
**Command:** \`make up\`

---

### 🏢 Production (Helm on Kubernetes)
**Best for:** Production workloads, enterprise deployments

**Pros:**
- High availability
- Horizontal scaling
- Rolling updates
- Production-ready
- Monitoring integration

**Cons:**
- Requires Kubernetes knowledge
- More complex setup
- Infrastructure management needed
- Higher cost

**Setup Time:** 2-4 hours
**Cost:** Infrastructure dependent
**Skills:** Kubernetes, Helm

---

### ☁️ Cloud (Terraform + Helm)
**Best for:** Enterprise, multi-region, high-scale deployments

**Pros:**
- Fully managed infrastructure
- Auto-scaling
- Multi-region deployment
- Disaster recovery
- Cloud-native services

**Cons:**
- Highest complexity
- Cloud vendor lock-in
- Highest cost
- Requires cloud expertise

**Setup Time:** 4-8 hours
**Cost:** \$500-2000+/month
**Skills:** Terraform, Cloud platforms, Kubernetes

---

### 🎯 Decision Matrix

| Requirement | Local | Production | Cloud |
|-------------|-------|------------|-------|
| Development | ✅ Perfect | ❌ Overkill | ❌ Overkill |
| Testing | ✅ Ideal | ⚠️ Complex | ❌ Expensive |
| Staging | ⚠️ Limited | ✅ Good | ✅ Perfect |
| Production | ❌ No | ✅ Good | ✅ Perfect |
| High Availability | ❌ No | ✅ Yes | ✅ Yes |
| Auto-scaling | ❌ No | ⚠️ Manual | ✅ Automatic |
| Disaster Recovery | ❌ No | ⚠️ Manual | ✅ Automatic |
| Cost (Monthly) | Free | \$100-500 | \$500-2000+ |

### 🚀 Recommended Path

1. **Start Local:** Begin with Docker for development
2. **Staging Environment:** Use Helm on managed Kubernetes
3. **Production:** Graduate to cloud deployment with Terraform

### Quick Start Commands

**Local (Immediate):**
\`\`\`bash
git clone https://github.com/LerianStudio/midaz && cd midaz && make set-env && make up
\`\`\`

**Production (Kubernetes Ready):**
\`\`\`bash
helm repo add midaz https://charts.lerian.studio && helm install midaz midaz/midaz
\`\`\`

**Cloud (Infrastructure as Code):**
\`\`\`bash
git clone https://github.com/LerianStudio/midaz-terraform && cd midaz-terraform && terraform apply
\`\`\``;

      return {
        success: true,
        comparison: comparison,
        recommendations: {
          development: "local",
          staging: "production",
          production: "cloud"
        },
        nextSteps: "Start with local development, then progress to cloud deployment"
      };
    })
  );
};