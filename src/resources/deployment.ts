/**
 * Midaz Deployment Resources
 * Provides comprehensive deployment guides and recipes
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Register deployment resources
 * @param server MCP server instance
 */
export const registerDeploymentResources = (server: McpServer) => {
  // Local development deployment guide
  server.resource(
    'local-deployment',
    'midaz://deployment/local',
    async (uri) => {
      const content = `# Midaz Local Development Setup

## Quick Start
\`\`\`bash
git clone https://github.com/LerianStudio/midaz
cd midaz
make set-env && make up
\`\`\`

## Prerequisites
- Docker Desktop or Docker Engine with Docker Compose
- Git for repository cloning
- Make utility (pre-installed on macOS/Linux)

## Services Architecture

### Infrastructure Stack
- **PostgreSQL**: Primary transactional database
- **MongoDB**: Document storage for flexible schemas
- **RabbitMQ**: Message broker for async communication
- **Redis**: Caching and session management
- **Grafana**: Monitoring and observability

### Core Microservices
- **Onboarding Service** (port 3000): Organizations, ledgers, accounts
- **Transaction Service** (port 3001): Transactions, operations, balances

## Step-by-Step Setup

### 1. Repository Setup
\`\`\`bash
# Clone the main repository
git clone https://github.com/LerianStudio/midaz
cd midaz

# Verify repository structure
ls -la
\`\`\`

### 2. Environment Configuration
\`\`\`bash
# Set up all environment variables and configs
make set-env

# This creates:
# - .env files for each service
# - Docker Compose configuration
# - Database initialization scripts
\`\`\`

### 3. Service Startup
\`\`\`bash
# Start complete Midaz stack
make up

# Monitor startup process
docker-compose logs -f
\`\`\`

### 4. Verification
\`\`\`bash
# Check all services are running
docker-compose ps

# Test API endpoints
curl http://localhost:3000/health    # Onboarding API
curl http://localhost:3001/health    # Transaction API

# Access monitoring
open http://localhost:3000/grafana   # Grafana dashboard
\`\`\`

## Development Workflow

### Daily Commands
\`\`\`bash
# Start services
make up

# View logs
make logs

# Stop services
make down

# Restart specific service
docker-compose restart onboarding-service
\`\`\`

### Code Quality
\`\`\`bash
# Run all tests
make test

# Format code
make format

# Run linter
make lint

# Setup git hooks for quality checks
make setup-git-hooks
\`\`\`

### Database Management
\`\`\`bash
# Reset databases (destructive)
make clean && make up

# Backup data
docker-compose exec postgres pg_dump -U midaz midaz > backup.sql

# Restore data
docker-compose exec -T postgres psql -U midaz midaz < backup.sql
\`\`\`

## Connecting MCP Server

Once Midaz is running locally, configure your MCP server:

\`\`\`bash
# Set environment variables
export MIDAZ_ONBOARDING_URL=http://localhost:3000
export MIDAZ_TRANSACTION_URL=http://localhost:3001

# Start MCP server with local backend
npx --yes @lerianstudio/midaz-mcp-server
\`\`\`

Or in your MCP client configuration:
\`\`\`json
{
  "mcpServers": {
    "midaz": {
      "command": "npx",
      "args": [
        "--yes",
        "@lerianstudio/midaz-mcp-server",
        "--onboarding-url=http://localhost:3000",
        "--transaction-url=http://localhost:3001"
      ]
    }
  }
}
\`\`\`

## Troubleshooting

### Common Issues

**Port Conflicts:**
\`\`\`bash
# Check what's using ports
lsof -i :3000 -i :3001 -i :5432 -i :27017 -i :5672 -i :6379

# Kill conflicting processes
sudo lsof -ti:3000 | xargs kill -9
\`\`\`

**Memory Issues:**
- Increase Docker memory allocation to at least 4GB
- Close other resource-intensive applications

**Permission Errors:**
\`\`\`bash
# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo
sudo make up
\`\`\`

### Service-Specific Debugging

**Database Connection Issues:**
\`\`\`bash
# Check PostgreSQL
docker-compose exec postgres psql -U midaz -d midaz -c "SELECT version();"

# Check MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ismaster')"
\`\`\`

**Service Health Checks:**
\`\`\`bash
# Individual service logs
docker-compose logs onboarding-service
docker-compose logs transaction-service

# Follow logs in real-time
docker-compose logs -f --tail=100 onboarding-service
\`\`\`

## Performance Optimization

### Resource Allocation
Edit \`docker-compose.yml\` to adjust:
\`\`\`yaml
services:
  onboarding-service:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
\`\`\`

### Database Optimization
\`\`\`bash
# PostgreSQL performance tuning
docker-compose exec postgres psql -U midaz -c "
  ALTER SYSTEM SET shared_buffers = '256MB';
  ALTER SYSTEM SET max_connections = 100;
  SELECT pg_reload_conf();
"
\`\`\`

## Next Steps

1. **API Exploration**: Use the MCP server to explore Midaz APIs
2. **Custom Development**: Modify services for your use case
3. **Testing**: Write integration tests for your modifications
4. **Production**: Graduate to Kubernetes deployment when ready

## Resources

### Core Platform
- [GitHub Repository](https://github.com/LerianStudio/midaz)
- [API Documentation](https://docs.lerian.studio)

### Infrastructure & Deployment
- [Helm Charts](https://github.com/LerianStudio/helm) - Kubernetes deployment charts
- [Terraform Foundation](https://github.com/LerianStudio/midaz-terraform-foundation) - Multi-cloud infrastructure
- [Network Infrastructure](https://github.com/LerianStudio/midaz-network-infra) - Network setup

### SDKs & Client Libraries
- [Go SDK](https://github.com/LerianStudio/midaz-sdk-golang) - Official Go client
- [TypeScript SDK](https://github.com/LerianStudio/midaz-sdk-typescript) - Official Node.js/TypeScript client

### Community
- [Discord Community](https://discord.gg/DnhqKwkGv3)
- [Issue Tracker](https://github.com/LerianStudio/midaz/issues)
`;

      return { contents: [{ uri: uri.href, text: content }] };
    }
  );

  // Production deployment guide
  server.resource(
    'production-deployment',
    'midaz://deployment/production',
    async (uri) => {
      const content = `# Midaz Production Deployment

## Overview

Production deployment uses Kubernetes with Helm charts for:
- High availability and fault tolerance
- Horizontal scaling capabilities
- Rolling updates and rollbacks
- Production-grade monitoring and alerting

## Prerequisites

### Infrastructure Requirements
- **Kubernetes cluster** (1.19+) with at least 3 nodes
- **Helm 3.x** package manager
- **kubectl** configured for cluster access
- **External databases**: PostgreSQL and MongoDB (managed preferred)
- **Container registry** access (Docker Hub or private)

### Resource Requirements
- **Minimum**: 8 vCPUs, 16GB RAM, 100GB storage
- **Recommended**: 16 vCPUs, 32GB RAM, 500GB storage
- **Network**: Load balancer with SSL termination

## Installation Steps

### 1. Cluster Preparation

\`\`\`bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Create namespace
kubectl create namespace midaz

# Set default namespace
kubectl config set-context --current --namespace=midaz
\`\`\`

### 2. Add Helm Repository

\`\`\`bash
# Add Midaz Helm repository
helm repo add midaz https://charts.lerian.studio
helm repo update

# Verify charts are available
helm search repo midaz
\`\`\`

### 3. Configure Database Connections

Create \`database-values.yaml\`:
\`\`\`yaml
database:
  postgresql:
    external: true
    host: "your-postgres-host.com"
    port: 5432
    database: "midaz_production"
    username: "midaz_user"
    # Password should be in Kubernetes secret
    existingSecret: "midaz-db-secret"
    secretKey: "postgres-password"
    
  mongodb:
    external: true
    host: "your-mongo-host.com"
    port: 27017
    database: "midaz_production"
    username: "midaz_user"
    existingSecret: "midaz-db-secret"
    secretKey: "mongo-password"
\`\`\`

### 4. Create Kubernetes Secrets

\`\`\`bash
# Create database credentials secret
kubectl create secret generic midaz-db-secret \\
  --from-literal=postgres-password="your-postgres-password" \\
  --from-literal=mongo-password="your-mongo-password" \\
  --namespace=midaz

# Create TLS certificate secret (if using custom certs)
kubectl create secret tls midaz-tls \\
  --cert=path/to/tls.crt \\
  --key=path/to/tls.key \\
  --namespace=midaz
\`\`\`

### 5. Configure Production Values

Create \`production-values.yaml\`:
\`\`\`yaml
global:
  environment: production
  domain: "api.yourdomain.com"
  
# Onboarding Service Configuration
onboarding:
  enabled: true
  replicaCount: 3
  
  image:
    repository: lerianstudio/midaz-onboarding
    tag: "latest"
    pullPolicy: Always
    
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"
      
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    
  service:
    type: ClusterIP
    port: 3000

# Transaction Service Configuration  
transaction:
  enabled: true
  replicaCount: 3
  
  image:
    repository: lerianstudio/midaz-transaction
    tag: "latest"
    pullPolicy: Always
    
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"
      
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    
  service:
    type: ClusterIP
    port: 3001

# Ingress Configuration
ingress:
  enabled: true
  className: "nginx"
  
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
  hosts:
    - host: "api.yourdomain.com"
      paths:
        - path: "/onboarding"
          pathType: Prefix
          service: onboarding
        - path: "/transaction"
          pathType: Prefix
          service: transaction
          
  tls:
    - secretName: midaz-tls
      hosts:
        - "api.yourdomain.com"

# Monitoring Configuration
monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
    adminPassword: "secure-admin-password"
    
# Logging Configuration
logging:
  level: "info"
  format: "json"
  
# Security Configuration
security:
  podSecurityPolicy:
    enabled: true
  networkPolicy:
    enabled: true
  rbac:
    create: true
\`\`\`

### 6. Deploy Midaz

\`\`\`bash
# Deploy with custom values
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --values database-values.yaml \\
  --values production-values.yaml \\
  --timeout 10m

# Monitor deployment
kubectl get pods -w
helm status midaz
\`\`\`

## Post-Deployment Configuration

### 1. Verify Services

\`\`\`bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=midaz

# Check services
kubectl get svc

# Check ingress
kubectl get ingress

# Test health endpoints
curl https://api.yourdomain.com/onboarding/health
curl https://api.yourdomain.com/transaction/health
\`\`\`

### 2. Configure Monitoring

\`\`\`bash
# Access Grafana dashboard
kubectl port-forward svc/midaz-grafana 3000:80

# Import Midaz dashboards
# Visit http://localhost:3000 (admin/secure-admin-password)
\`\`\`

### 3. Set Up Alerts

Create \`alerting-rules.yaml\`:
\`\`\`yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: midaz-alerts
  namespace: midaz
spec:
  groups:
  - name: midaz.rules
    rules:
    - alert: MidazServiceDown
      expr: up{job=~"midaz-.*"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Midaz service is down"
        
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
\`\`\`

## Maintenance Operations

### Updates and Rollbacks

\`\`\`bash
# Update to new version
helm upgrade midaz midaz/midaz \\
  --namespace midaz \\
  --values production-values.yaml \\
  --set onboarding.image.tag=v1.2.0 \\
  --set transaction.image.tag=v1.2.0

# Rollback if needed
helm rollback midaz 1 --namespace midaz

# Check rollout status
kubectl rollout status deployment/midaz-onboarding
kubectl rollout status deployment/midaz-transaction
\`\`\`

### Scaling

\`\`\`bash
# Manual scaling
kubectl scale deployment midaz-onboarding --replicas=5
kubectl scale deployment midaz-transaction --replicas=5

# Update HPA settings
kubectl patch hpa midaz-onboarding -p '{"spec":{"maxReplicas":15}}'
\`\`\`

### Backup and Recovery

\`\`\`bash
# Backup Helm configuration
helm get values midaz > midaz-backup-values.yaml

# Backup Kubernetes resources
kubectl get all,configmap,secret -o yaml > midaz-k8s-backup.yaml

# Database backups should be handled by your database provider
\`\`\`

## Troubleshooting

### Common Issues

**Pod Startup Issues:**
\`\`\`bash
# Check pod logs
kubectl logs -l app.kubernetes.io/name=midaz-onboarding
kubectl logs -l app.kubernetes.io/name=midaz-transaction

# Describe problematic pods
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
\`\`\`

**Database Connection Issues:**
\`\`\`bash
# Test database connectivity from pod
kubectl exec -it <pod-name> -- nc -zv postgres-host 5432
kubectl exec -it <pod-name> -- nc -zv mongo-host 27017

# Check secret configuration
kubectl get secret midaz-db-secret -o yaml
\`\`\`

**Ingress Issues:**
\`\`\`bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Verify SSL certificates
kubectl describe certificate midaz-tls

# Test ingress rules
kubectl describe ingress midaz
\`\`\`

### Performance Tuning

**Resource Optimization:**
\`\`\`bash
# Monitor resource usage
kubectl top pods
kubectl top nodes

# Adjust resource requests/limits based on metrics
# Update values.yaml and upgrade
\`\`\`

**Database Optimization:**
- Use connection pooling
- Optimize database queries
- Consider read replicas for scaling
- Monitor slow queries

## Security Best Practices

### Network Security
- Enable Kubernetes Network Policies
- Use service mesh for mTLS (Istio/Linkerd)
- Regularly update ingress controller

### Pod Security
- Use non-root containers
- Enable Pod Security Standards
- Scan images for vulnerabilities

### Secret Management
- Use external secret managers (AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials regularly
- Encrypt secrets at rest

## High Availability Considerations

### Multi-Zone Deployment
\`\`\`yaml
# Add to values.yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - midaz-onboarding
        topologyKey: kubernetes.io/hostname
\`\`\`

### Disaster Recovery
- Implement database backup strategy
- Document recovery procedures
- Test failover scenarios regularly
- Consider multi-region deployment for critical workloads

## Resources

### Platform Documentation
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Production Checklist](https://docs.lerian.studio/deployment/production-checklist)

### Midaz Resources
- [Core Repository](https://github.com/LerianStudio/midaz)
- [Helm Charts Repository](https://github.com/LerianStudio/helm)
- [Go SDK](https://github.com/LerianStudio/midaz-sdk-golang)
- [TypeScript SDK](https://github.com/LerianStudio/midaz-sdk-typescript)
`;

      return { contents: [{ uri: uri.href, text: content }] };
    }
  );

  // Cloud deployment guide
  server.resource(
    'cloud-deployment',
    'midaz://deployment/cloud',
    async (uri) => {
      const content = `# Midaz Cloud Deployment

## Overview

Enterprise-grade cloud deployment combining:
- **Terraform**: Infrastructure as Code for reproducible environments
- **Helm**: Application deployment and lifecycle management
- **Kubernetes**: Container orchestration with cloud-native features
- **Managed Services**: Databases, monitoring, and security services

## Architecture

### Cloud Components
- **Kubernetes Service** (EKS/GKE/AKS): Managed container orchestration
- **Managed Databases**: PostgreSQL and MongoDB as cloud services  
- **Load Balancers**: Application and network load balancing
- **CDN**: Content delivery and API acceleration
- **Monitoring**: Cloud-native observability stack
- **Security**: IAM, secrets management, and network security

### Multi-Region Setup
- **Primary Region**: Main deployment with read/write databases
- **Secondary Region**: Disaster recovery with read replicas
- **Edge Locations**: CDN and caching for global performance

## Prerequisites

### Tools and Access
- **Terraform** 1.0+ with cloud provider CLI
- **Helm** 3.x and **kubectl**
- **Cloud account** with appropriate permissions
- **Domain name** with DNS management access
- **SSL certificates** (or cert-manager setup)

### Infrastructure Requirements
- **Production**: 3+ availability zones, managed databases
- **Development**: Single zone, smaller instances acceptable
- **Monitoring**: Separate cluster or managed services

## AWS Deployment

### 1. Infrastructure Setup

Clone Terraform templates:
\`\`\`bash
git clone https://github.com/LerianStudio/midaz-terraform
cd midaz-terraform/aws
\`\`\`

Configure \`terraform.tfvars\`:
\`\`\`hcl
# Region and availability zones
region = "us-west-2"
availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]

# Cluster configuration
cluster_name = "midaz-production"
cluster_version = "1.28"

# Node groups
node_groups = {
  general = {
    instance_types = ["t3.large"]
    scaling_config = {
      desired_size = 6
      max_size     = 20
      min_size     = 6
    }
  }
  compute = {
    instance_types = ["c5.xlarge"]
    scaling_config = {
      desired_size = 3
      max_size     = 10
      min_size     = 0
    }
  }
}

# Database configuration
rds_instance_class = "db.r5.large"
rds_multi_az = true
rds_backup_retention_period = 30

documentdb_instance_class = "db.r5.large"
documentdb_cluster_size = 3
documentdb_backup_retention_period = 7

# Networking
vpc_cidr = "10.0.0.0/16"
private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

# Domain and SSL
domain_name = "api.yourdomain.com"
create_route53_zone = true
create_acm_certificate = true

# Monitoring
enable_cloudwatch_logs = true
enable_prometheus = true
enable_grafana = true

# Tags
tags = {
  Environment = "production"
  Project     = "midaz"
  Owner       = "platform-team"
}
\`\`\`

Deploy infrastructure:
\`\`\`bash
# Initialize and apply
terraform init
terraform plan
terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name midaz-production
\`\`\`

### 2. Application Deployment

Install cluster addons:
\`\`\`bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \\
  --namespace kube-system \\
  --set clusterName=midaz-production \\
  --set serviceAccount.create=false \\
  --set serviceAccount.name=aws-load-balancer-controller

# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \\
  --namespace cert-manager \\
  --create-namespace \\
  --set installCRDs=true

# Install external-dns
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm install external-dns external-dns/external-dns \\
  --namespace external-dns \\
  --create-namespace \\
  --set provider=aws \\
  --set aws.zoneType=public \\
  --set txtOwnerId=midaz-production
\`\`\`

Configure Midaz deployment values:
\`\`\`yaml
# aws-production-values.yaml
global:
  environment: production
  cloud:
    provider: aws
    region: us-west-2
  domain: api.yourdomain.com

# Service configuration
onboarding:
  replicaCount: 6
  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"  
      cpu: "1000m"
  nodeSelector:
    node.kubernetes.io/instance-type: t3.large

transaction:
  replicaCount: 6
  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "1000m"
  nodeSelector:
    node.kubernetes.io/instance-type: t3.large

# Database connections (from Terraform outputs)
database:
  postgresql:
    external: true
    host: "midaz-postgres.cluster-xyz.us-west-2.rds.amazonaws.com"
    port: 5432
    database: "midaz"
    username: "midaz_user"
    existingSecret: "midaz-db-credentials"
    
  mongodb:
    external: true  
    host: "midaz-docdb.cluster-xyz.us-west-2.docdb.amazonaws.com"
    port: 27017
    database: "midaz"
    username: "midaz_user"
    existingSecret: "midaz-db-credentials"

# AWS-specific ingress
ingress:
  enabled: true
  className: "alb"
  
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789:certificate/xxx
    external-dns.alpha.kubernetes.io/hostname: api.yourdomain.com
    
  hosts:
    - host: api.yourdomain.com
      paths:
        - path: /onboarding
          pathType: Prefix
          service: onboarding
        - path: /transaction
          pathType: Prefix  
          service: transaction

# Monitoring with CloudWatch
monitoring:
  cloudwatch:
    enabled: true
    region: us-west-2
  prometheus:
    enabled: true
    storageClass: gp3
  grafana:
    enabled: true
    persistence:
      enabled: true
      storageClass: gp3

# Autoscaling
autoscaling:
  enabled: true
  minReplicas: 6
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

# Security
security:
  aws:
    iamRoles:
      serviceAccounts: true
    secretsManager:
      enabled: true
    kms:
      enabled: true
  networkPolicy:
    enabled: true
  podSecurityStandards:
    enabled: true
    profile: restricted
\`\`\`

Deploy Midaz:
\`\`\`bash
# Get database credentials from AWS Secrets Manager
aws secretsmanager get-secret-value \\
  --secret-id midaz-production-db \\
  --query SecretString --output text | \\
  kubectl create secret generic midaz-db-credentials \\
  --from-file=/dev/stdin --dry-run=client -o yaml | \\
  kubectl apply -f -

# Deploy Midaz
helm repo add midaz https://charts.lerian.studio
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --create-namespace \\
  --values aws-production-values.yaml \\
  --timeout 15m
\`\`\`

## Google Cloud (GCP) Deployment

### Infrastructure Configuration

\`\`\`hcl
# gcp-terraform.tfvars
project_id = "your-project-id"
region = "us-central1"
zones = ["us-central1-a", "us-central1-b", "us-central1-c"]

# GKE configuration
cluster_name = "midaz-production"
kubernetes_version = "1.28"

node_pools = {
  general = {
    machine_type = "e2-standard-4"
    min_count    = 6
    max_count    = 20
    disk_size_gb = 100
  }
  compute = {
    machine_type = "c2-standard-8"
    min_count    = 0
    max_count    = 10
    disk_size_gb = 100
  }
}

# Cloud SQL configuration
postgres_tier = "db-standard-2"
postgres_availability_type = "REGIONAL"
postgres_disk_size = 100

# Firestore configuration  
firestore_location = "us-central1"

# Networking
network_name = "midaz-vpc"
subnet_name = "midaz-subnet"
subnet_cidr = "10.0.0.0/16"

# Domain and DNS
domain_name = "api.yourdomain.com"
create_dns_zone = true
\`\`\`

### Deployment Commands

\`\`\`bash
# Deploy infrastructure
cd midaz-terraform/gcp
terraform init
terraform apply

# Configure kubectl
gcloud container clusters get-credentials midaz-production \\
  --zone us-central1 --project your-project-id

# Install GCP-specific addons
helm install nginx-ingress ingress-nginx/ingress-nginx \\
  --set controller.service.type=LoadBalancer \\
  --set controller.service.loadBalancerIP=<static-ip>
\`\`\`

## Azure Deployment

### Infrastructure Configuration

\`\`\`hcl
# azure-terraform.tfvars
location = "East US"
resource_group_name = "midaz-production"

# AKS configuration
cluster_name = "midaz-production"
kubernetes_version = "1.28"

node_pools = {
  general = {
    vm_size   = "Standard_D4s_v3"
    min_count = 6
    max_count = 20
  }
  compute = {
    vm_size   = "Standard_F8s_v2"
    min_count = 0
    max_count = 10
  }
}

# Azure Database for PostgreSQL
postgres_sku_name = "GP_Gen5_2"
postgres_storage_mb = 102400

# Cosmos DB
cosmosdb_offer_type = "Standard"
cosmosdb_consistency_level = "Session"

# Networking
vnet_cidr = "10.0.0.0/16"
subnet_cidr = "10.0.1.0/24"

# Domain
domain_name = "api.yourdomain.com"
\`\`\`

## Monitoring and Observability

### Comprehensive Monitoring Stack

\`\`\`bash
# Install monitoring stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \\
  --namespace monitoring \\
  --create-namespace \\
  --values monitoring-values.yaml

# Install logging stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch \\
  --namespace logging \\
  --create-namespace
helm install kibana elastic/kibana --namespace logging
helm install filebeat elastic/filebeat --namespace logging
\`\`\`

### Custom Dashboards

\`\`\`yaml
# grafana-dashboards.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: midaz-dashboards
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  midaz-overview.json: |
    {
      "dashboard": {
        "title": "Midaz Overview",
        "panels": [
          {
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])"
              }
            ]
          }
        ]
      }
    }
\`\`\`

## Disaster Recovery

### Backup Strategy

\`\`\`bash
# Database backups (automated via cloud provider)
# For AWS RDS:
aws rds create-db-snapshot \\
  --db-instance-identifier midaz-postgres \\
  --db-snapshot-identifier midaz-backup-$(date +%Y%m%d)

# Application data backup
kubectl create job backup-job --from=cronjob/midaz-backup

# Kubernetes resource backup
velero backup create midaz-backup --include-namespaces midaz
\`\`\`

### Recovery Procedures

\`\`\`bash
# Restore from backup
velero restore create --from-backup midaz-backup

# Database point-in-time recovery
aws rds restore-db-instance-to-point-in-time \\
  --source-db-instance-identifier midaz-postgres \\
  --target-db-instance-identifier midaz-postgres-restored \\
  --restore-time 2024-01-15T10:30:00Z
\`\`\`

## Cost Optimization

### Resource Right-Sizing

\`\`\`bash
# Analyze resource usage
kubectl top pods --containers=true
kubectl describe nodes

# Implement Vertical Pod Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/vpa-v1-crd-gen.yaml
\`\`\`

### Spot Instances and Preemptible Nodes

\`\`\`yaml
# AWS Spot instances in Terraform
node_groups = {
  spot = {
    capacity_type = "SPOT"
    instance_types = ["m5.large", "m5a.large", "m4.large"]
    scaling_config = {
      desired_size = 3
      max_size     = 10
      min_size     = 0
    }
  }
}
\`\`\`

## Security Hardening

### Network Security

\`\`\`yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: midaz-network-policy
  namespace: midaz
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: midaz
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 27017 # MongoDB
\`\`\`

### Pod Security

\`\`\`yaml
# Pod Security Standards
apiVersion: v1
kind: Namespace
metadata:
  name: midaz
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
\`\`\`

## Performance Tuning

### Database Optimization

\`\`\`sql
-- PostgreSQL performance tuning
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
SELECT pg_reload_conf();
\`\`\`

### Application Tuning

\`\`\`yaml
# JVM tuning for Java services
env:
- name: JAVA_OPTS
  value: "-Xmx2g -Xms2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Go service tuning
env:
- name: GOMAXPROCS
  value: "4"
- name: GOMEMLIMIT
  value: "1GiB"
\`\`\`

## Maintenance and Operations

### Blue/Green Deployments

\`\`\`bash
# Create blue/green deployment pipeline
helm install midaz-green midaz/midaz \\
  --namespace midaz-green \\
  --values production-values.yaml \\
  --set global.environment=green

# Switch traffic
kubectl patch ingress midaz -p '{"spec":{"rules":[{"host":"api.yourdomain.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"midaz-green","port":{"number":80}}}}]}}]}}'
\`\`\`

### Canary Deployments

\`\`\`yaml
# Argo Rollouts canary strategy
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: midaz-onboarding
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 20
      - pause: {duration: 5m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 100
      canaryService: midaz-onboarding-canary
      stableService: midaz-onboarding-stable
\`\`\`

## Compliance and Governance

### Policy Enforcement

\`\`\`yaml
# Open Policy Agent Gatekeeper
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        properties:
          labels:
            type: array
            items:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          required := input.parameters.labels
          provided := input.review.object.metadata.labels
          missing := required[_]
          not provided[missing]
          msg := sprintf("Missing required label: %v", [missing])
        }
\`\`\`

### Audit Logging

\`\`\`bash
# Enable Kubernetes audit logging
# Add to API server configuration
--audit-log-path=/var/log/audit.log
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
--audit-log-maxage=30
--audit-log-maxbackup=10
--audit-log-maxsize=100
\`\`\`

## Scaling Strategies

### Horizontal Pod Autoscaler

\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: midaz-onboarding-hpa
  namespace: midaz
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: midaz-onboarding
  minReplicas: 6
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 5
        periodSeconds: 60
      selectPolicy: Max
\`\`\`

### Cluster Autoscaler

\`\`\`yaml
# Cluster Autoscaler configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/midaz-production
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-utilization-threshold=0.5
        - --max-node-provision-time=15m
\`\`\`

## Global Deployment

### Multi-Region Setup

\`\`\`bash
# Deploy to multiple regions
regions=("us-west-2" "eu-west-1" "ap-southeast-1")

for region in "\${regions[@]}"; do
  # Deploy infrastructure
  cd terraform/\${region}
  terraform apply -var="region=\${region}"
  
  # Configure kubectl context
  aws eks update-kubeconfig --region \${region} --name midaz-\${region}
  
  # Deploy Midaz
  helm install midaz-\${region} midaz/midaz \\
    --namespace midaz \\
    --values \${region}-values.yaml
done
\`\`\`

### Traffic Routing

\`\`\`yaml
# Route 53 weighted routing
Resources:
  DNSRecordUSWest2:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: api.yourdomain.com
      Type: A
      SetIdentifier: "us-west-2"
      Weight: 100
      AliasTarget:
        DNSName: !GetAtt LoadBalancerUSWest2.DNSName
        HostedZoneId: !GetAtt LoadBalancerUSWest2.CanonicalHostedZoneID
        
  DNSRecordEUWest1:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: api.yourdomain.com
      Type: A
      SetIdentifier: "eu-west-1"
      Weight: 0
      AliasTarget:
        DNSName: !GetAtt LoadBalancerEUWest1.DNSName
        HostedZoneId: !GetAtt LoadBalancerEUWest1.CanonicalHostedZoneID
\`\`\`

## Resources and Documentation

### Documentation
- [Cloud Deployment Guide](https://docs.lerian.studio/deployment/cloud)
- [Security Best Practices](https://docs.lerian.studio/security)
- [Performance Tuning](https://docs.lerian.studio/performance)
- [Troubleshooting Guide](https://docs.lerian.studio/troubleshooting)

### Infrastructure Repositories
- [Terraform Foundation](https://github.com/LerianStudio/midaz-terraform-foundation) - Multi-cloud infrastructure as code
- [Network Infrastructure](https://github.com/LerianStudio/midaz-network-infra) - Network setup and configuration
- [Helm Charts](https://github.com/LerianStudio/helm) - Kubernetes deployment manifests

### Client SDKs
- [Go SDK](https://github.com/LerianStudio/midaz-sdk-golang) - Official Go client library
- [TypeScript SDK](https://github.com/LerianStudio/midaz-sdk-typescript) - Official Node.js/TypeScript client

### Community and Support
- [Discord Community](https://discord.gg/DnhqKwkGv3)
- [GitHub Issues](https://github.com/LerianStudio/midaz/issues)
- [Professional Support](https://lerian.studio/support)

This comprehensive cloud deployment guide provides enterprise-grade deployment strategies with high availability, security, and scalability built-in from day one.
`;

      return { contents: [{ uri: uri.href, text: content }] };
    }
  );

  // Deployment comparison resource
  server.resource(
    'deployment-comparison',
    'midaz://deployment/comparison',
    async (uri) => {
      const content = `# Midaz Deployment Comparison

## Quick Decision Matrix

| Requirement | Local Docker | Production Helm | Enterprise Cloud |
|-------------|-------------|-----------------|------------------|
| **Development** | ✅ Perfect | ❌ Overkill | ❌ Too Complex |
| **Testing/CI** | ✅ Ideal | ⚠️ Complex Setup | ❌ Expensive |
| **Staging** | ⚠️ Limited | ✅ Excellent | ✅ Perfect |
| **Production** | ❌ Not Suitable | ✅ Production Ready | ✅ Enterprise Grade |
| **High Availability** | ❌ No | ✅ Yes | ✅ Multi-Region |
| **Auto Scaling** | ❌ Manual | ⚠️ HPA Only | ✅ Full Auto |
| **Disaster Recovery** | ❌ None | ⚠️ Manual | ✅ Automated |
| **Setup Time** | 5 minutes | 2-4 hours | 1-2 days |
| **Monthly Cost** | Free | \$200-1000 | \$1000-5000+ |
| **Expertise Required** | Docker basics | Kubernetes | Cloud + K8s + IaC |

## Detailed Comparison

### 🖥️ Local Docker Development

**Architecture:**
\`\`\`
┌─────────────────┐
│   Docker Host   │
├─────────────────┤
│ Onboarding:3000 │
│ Transaction:3001│
│ PostgreSQL:5432 │
│ MongoDB:27017   │
│ RabbitMQ:5672   │
│ Redis:6379      │
│ Grafana:3001    │
└─────────────────┘
\`\`\`

**Pros:**
- **Instant Setup**: \`git clone && make up\`
- **No Dependencies**: Everything runs locally
- **Development Friendly**: Hot reloading, easy debugging
- **Cost Effective**: Zero infrastructure costs
- **Learning**: Perfect for understanding Midaz architecture
- **Isolated**: No interference with other services

**Cons:**
- **Single Point of Failure**: No redundancy
- **Resource Limited**: Constrained by local machine
- **Not Production Ready**: No load balancing, scaling
- **Data Loss Risk**: No backup strategies
- **Performance**: Limited by local hardware

**Best For:**
- Initial development and prototyping
- Learning Midaz architecture
- Local testing and validation
- Development team onboarding
- Proof of concept demonstrations

**Resource Requirements:**
- 8GB RAM minimum, 16GB recommended
- 4 CPU cores
- 20GB disk space
- Docker Desktop or Engine

---

### 🏢 Production Kubernetes with Helm

**Architecture:**
\`\`\`
┌─────────────────────────────────────┐
│           Kubernetes Cluster        │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐   │
│  │ Onboarding  │ │ Transaction │   │
│  │   Pods      │ │    Pods     │   │
│  │ (3 replicas)│ │ (3 replicas)│   │
│  └─────────────┘ └─────────────┘   │
├─────────────────────────────────────┤
│         Load Balancer + Ingress     │
├─────────────────────────────────────┤
│  External Databases & Services      │
│  PostgreSQL | MongoDB | Monitoring  │
└─────────────────────────────────────┘
\`\`\`

**Pros:**
- **High Availability**: Multiple replicas, health checks
- **Horizontal Scaling**: HPA for traffic spikes
- **Rolling Updates**: Zero-downtime deployments
- **Health Monitoring**: Kubernetes native health checks
- **Resource Management**: Requests, limits, scheduling
- **Service Discovery**: Native Kubernetes networking
- **Configuration Management**: ConfigMaps, Secrets

**Cons:**
- **Complexity**: Requires Kubernetes expertise
- **Infrastructure Overhead**: Need to manage K8s cluster
- **Limited Auto-scaling**: Only pod-level scaling
- **Manual Disaster Recovery**: Requires operational procedures
- **Monitoring Setup**: Need separate monitoring stack

**Best For:**
- Production workloads with predictable traffic
- Teams with Kubernetes expertise
- Single-region deployments
- Budget-conscious production deployments
- Hybrid cloud or on-premises requirements

**Resource Requirements:**
- 3+ node Kubernetes cluster
- 16GB RAM per node minimum
- External PostgreSQL and MongoDB
- Load balancer capability
- Persistent storage

**Setup Steps:**
\`\`\`bash
# 1. Prepare cluster
kubectl create namespace midaz

# 2. Configure databases
kubectl create secret generic midaz-db-secret \\
  --from-literal=postgres-password="secure-password"

# 3. Deploy with Helm
helm repo add midaz https://charts.lerian.studio
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --values production-values.yaml

# 4. Configure ingress
kubectl apply -f ingress-config.yaml
\`\`\`

---

### ☁️ Enterprise Cloud Deployment

**Architecture:**
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Region Cloud                       │
├─────────────────────────────────────────────────────────────┤
│  Region 1 (Primary)     │    Region 2 (DR)                 │
│  ┌─────────────────┐    │    ┌─────────────────┐           │
│  │  Managed K8s    │    │    │  Managed K8s    │           │
│  │  (EKS/GKE/AKS)  │<───┼────│  (EKS/GKE/AKS)  │           │
│  │                 │    │    │                 │           │
│  │ Auto-scaling    │    │    │ Read Replicas   │           │
│  │ Load Balancing  │    │    │ Standby Mode    │           │
│  └─────────────────┘    │    └─────────────────┘           │
├─────────────────────────┼─────────────────────────────────┤
│  Managed Databases      │    Database Replication         │
│  RDS/Cloud SQL/Azure DB │    Cross-region backups         │
├─────────────────────────┼─────────────────────────────────┤
│  CDN + Global LB        │    Monitoring & Alerting        │
│  CloudFront/CloudCDN    │    CloudWatch/Stackdriver       │
└─────────────────────────┴─────────────────────────────────┘
\`\`\`

**Pros:**
- **Global Scale**: Multi-region deployment
- **Full Automation**: Infrastructure as Code
- **Cloud-Native Services**: Managed databases, monitoring
- **Disaster Recovery**: Automated failover and backup
- **Auto-scaling**: Cluster and application level
- **Security**: Cloud provider security services
- **Compliance**: SOC2, PCI DSS, GDPR ready
- **Performance**: CDN, edge locations, optimized routing

**Cons:**
- **Highest Complexity**: Requires cloud + K8s + IaC expertise
- **Vendor Lock-in**: Cloud provider specific services
- **Highest Cost**: Premium for managed services
- **Learning Curve**: Multiple tools and concepts
- **Over-engineering**: May be overkill for simple use cases

**Best For:**
- Enterprise production workloads
- Global customer base
- Compliance requirements (SOC2, PCI DSS)
- High availability requirements (99.9%+ uptime)
- Variable/unpredictable traffic patterns
- Teams with cloud expertise

**Resource Requirements:**
- Multi-AZ Kubernetes clusters
- Managed database services
- Global load balancers and CDN
- Monitoring and logging services
- Backup and disaster recovery systems

**Setup Process:**
\`\`\`bash
# 1. Deploy infrastructure with Terraform
cd midaz-terraform/aws
terraform init && terraform apply

# 2. Configure kubectl for multiple regions
aws eks update-kubeconfig --region us-west-2 --name midaz-prod
aws eks update-kubeconfig --region eu-west-1 --name midaz-dr

# 3. Deploy to primary region
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --values aws-production-values.yaml

# 4. Configure disaster recovery
helm install midaz-dr midaz/midaz \\
  --namespace midaz \\
  --values aws-dr-values.yaml \\
  --set global.mode=standby
\`\`\`

## Migration Paths

### Local → Production
\`\`\`bash
# 1. Export local configuration
docker-compose config > local-config.yaml

# 2. Convert to Kubernetes manifests
kompose convert -f local-config.yaml

# 3. Create Helm values from manifests
# Manual process to create production-values.yaml

# 4. Deploy to staging first
helm install midaz-staging midaz/midaz \\
  --namespace midaz-staging \\
  --values staging-values.yaml

# 5. Test and validate
kubectl port-forward svc/midaz-onboarding 3000:3000
curl http://localhost:3000/health

# 6. Deploy to production
helm install midaz midaz/midaz \\
  --namespace midaz \\
  --values production-values.yaml
\`\`\`

### Production → Cloud
\`\`\`bash
# 1. Plan infrastructure
cd midaz-terraform/aws
terraform plan

# 2. Deploy infrastructure
terraform apply

# 3. Migrate databases
# Use cloud provider migration tools
aws dms create-replication-task...

# 4. Deploy application
helm install midaz midaz/midaz \\
  --values cloud-values.yaml

# 5. Gradual traffic migration
# Blue/green or canary deployment
\`\`\`

## Cost Analysis

### Local Development
**Monthly Cost: \$0**
- No infrastructure costs
- Only local compute resources
- Development productivity benefits

### Production Kubernetes
**Monthly Cost: \$200-1000**
- Managed Kubernetes: \$72-144/month
- Worker nodes (3x t3.large): \$150-300/month
- Managed PostgreSQL: \$50-200/month
- Managed MongoDB: \$100-300/month
- Load balancer: \$20/month
- Monitoring: \$50-100/month

### Enterprise Cloud
**Monthly Cost: \$1000-5000+**
- Multi-region Kubernetes: \$300-600/month
- Auto-scaling nodes: \$500-2000/month
- Multi-AZ databases: \$300-1000/month
- CDN and global LB: \$100-500/month
- Advanced monitoring: \$100-300/month
- Backup and DR: \$200-600/month

## Performance Characteristics

| Metric | Local | Production | Cloud |
|--------|-------|------------|-------|
| **Latency** | <10ms | 10-50ms | 5-20ms (with CDN) |
| **Throughput** | 100 RPS | 1,000 RPS | 10,000+ RPS |
| **Availability** | 90% | 99.5% | 99.9%+ |
| **Recovery Time** | Manual | 5-30 min | <5 min |
| **Scalability** | 1x | 10x | 100x+ |

## Security Comparison

### Local Development
- Basic Docker security
- No network isolation
- Local firewall protection
- Development credentials

### Production Kubernetes
- Kubernetes RBAC
- Network policies
- Pod security standards
- Encrypted secrets
- Regular security updates

### Enterprise Cloud
- Cloud provider security services
- WAF and DDoS protection
- Identity and access management
- Encryption at rest and in transit
- Compliance certifications
- Security monitoring and alerting

## Operational Complexity

### Daily Operations
| Task | Local | Production | Cloud |
|------|-------|------------|-------|
| **Startup** | \`make up\` | \`kubectl get pods\` | Monitor dashboards |
| **Scaling** | Manual restart | \`kubectl scale\` | Automatic |
| **Updates** | \`git pull && make up\` | \`helm upgrade\` | CI/CD pipeline |
| **Monitoring** | Container logs | Grafana + Prometheus | Cloud monitoring |
| **Backup** | Manual export | Scheduled jobs | Automated |
| **Troubleshooting** | Docker logs | \`kubectl describe\` | Cloud debugging tools |

## Recommendation Framework

### Choose Local Docker If:
- ✅ Development or learning environment
- ✅ Single developer or small team
- ✅ Proof of concept or prototyping
- ✅ Budget constraints
- ✅ Quick experimentation needed

### Choose Production Kubernetes If:
- ✅ Stable production workload
- ✅ Team has Kubernetes expertise
- ✅ Predictable traffic patterns
- ✅ Single region deployment sufficient
- ✅ Cost optimization important
- ✅ Existing Kubernetes infrastructure

### Choose Enterprise Cloud If:
- ✅ Mission-critical production system
- ✅ Global user base
- ✅ High availability requirements (99.9%+)
- ✅ Variable or unpredictable traffic
- ✅ Compliance requirements
- ✅ Disaster recovery needed
- ✅ Budget for premium services

## Getting Started

### Immediate Next Steps by Path

**Local Development (Start Here):**
\`\`\`bash
git clone https://github.com/LerianStudio/midaz
cd midaz && make set-env && make up
\`\`\`

**Production Deployment:**
\`\`\`bash
helm repo add midaz https://charts.lerian.studio
kubectl create namespace midaz
helm install midaz midaz/midaz --namespace midaz
\`\`\`

**Enterprise Cloud:**
\`\`\`bash
git clone https://github.com/LerianStudio/midaz-terraform-foundation
cd midaz-terraform-foundation/examples/aws && terraform init && terraform apply
\`\`\`

### Gradual Adoption Strategy

1. **Week 1-2**: Start with local development
2. **Week 3-4**: Deploy to staging with Kubernetes
3. **Month 2**: Production deployment with Helm
4. **Month 3+**: Evaluate cloud migration needs
5. **Quarter 2**: Implement enterprise cloud if needed

This phased approach minimizes risk while building expertise gradually.

## Essential Resources

### Infrastructure & Deployment
- [Helm Charts Repository](https://github.com/LerianStudio/helm) - Production-ready Kubernetes deployments
- [Terraform Foundation](https://github.com/LerianStudio/midaz-terraform-foundation) - Multi-cloud infrastructure as code
- [Network Infrastructure](https://github.com/LerianStudio/midaz-network-infra) - Network setup and security

### Client Development
- [Go SDK](https://github.com/LerianStudio/midaz-sdk-golang) - Official Go client library
- [TypeScript SDK](https://github.com/LerianStudio/midaz-sdk-typescript) - Official Node.js/TypeScript client
- [Core Platform](https://github.com/LerianStudio/midaz) - Main repository with API reference
`;

      return { contents: [{ uri: uri.href, text: content }] };
    }
  );
};