# AWS DEPLOYMENT ARCHITECTURE
## Rozi Khan Dropshipping Platform

**Document Version:** 1.0
**Author:** Senior DevOps Engineer & AWS Solutions Architect

---

## 1. System Architecture Overview
The Rozi Khan platform is deployed on AWS utilizing a highly available, scalable, and secure architecture designed to handle thousands of concurrent retailers and high-throughput background processing.

### 1.1 Infrastructure Diagram
```mermaid
graph TD
    Internet --> Route53["Route 53 (DNS)"]
    Route53 --> CF["CloudFront (CDN)"]
    CF --> S3_React["S3 Bucket (React Frontend)"]
    
    Route53 --> ALB["Application Load Balancer"]
    ALB --> TG_API["Target Group (FastAPI)"]
    
    subgraph VPC [AWS VPC - Region: ap-south-1]
        subgraph Public Subnet
            ALB
            NatGateway["NAT Gateway"]
        end
        
        subgraph Private Subnet (App Layer)
            ASG_API["Auto Scaling Group: EC2 FastAPI"]
            ASG_Celery["Auto Scaling Group: EC2 Celery Workers"]
        end
        
        subgraph Private Subnet (Data Layer)
            RDS["RDS PostgreSQL (Multi-AZ)"]
            Redis["ElastiCache Redis"]
        end
        
        TG_API --> ASG_API
        ASG_API --> RDS
        ASG_API --> Redis
        ASG_Celery --> Redis
        ASG_Celery --> RDS
    end
    
    ASG_API -.->|Outbound APIs| NatGateway
    NatGateway -.-> Internet
```

---

## 2. Network & Security Architecture

### 2.1 VPC Design
* **CIDR:** `10.0.0.0/16`.
* **Public Subnets:** Contain ALB and NAT Gateway. Resources here have public IPs.
* **Private Subnets:** Contain EC2 instances (API, Celery), RDS, and Redis. No direct internet access; outbound traffic routes through the NAT Gateway.

### 2.2 Security Groups (Firewalls)
* **ALB-SG:** Allows Inbound 443 (HTTPS) / 80 (HTTP) from `0.0.0.0/0`.
* **API-SG:** Allows Inbound 8000 only from `ALB-SG`.
* **DB-SG:** Allows Inbound 5432 (Postgres) only from `API-SG` and `Celery-SG`.
* **Redis-SG:** Allows Inbound 6379 only from `API-SG` and `Celery-SG`.

---

## 3. Core AWS Services Configuration

* **EC2 & Auto Scaling:** FastAPI runs on `t3.medium` instances via Gunicorn/Uvicorn. CPU Utilization > 60% triggers scale-out policies.
* **Amazon RDS:** PostgreSQL 15. Multi-AZ deployment enabled for synchronous replication and automatic failover. Automated backups enabled (30-day retention).
* **ElastiCache:** Redis Cluster mode disabled, Primary + 1 Replica for high availability of task queues and caching.
* **S3 & CloudFront:** React Frontend is compiled and stored in an S3 bucket, served globally via CloudFront. User uploads (KYC docs, products) go to a separate private S3 bucket.
* **Route 53 & ACM:** Domain routing and automated free TLS/SSL certificate provisioning via AWS Certificate Manager.
* **AWS SES:** Simple Email Service handles transactional emails (OTP, Order Confirmations).

---

## 4. CI/CD & Deployment Pipeline

Using **GitHub Actions**:
1. **Push to `main`** triggers the workflow.
2. **Frontend:** Runs `npm run build`, syncs output to S3 bucket, invalidates CloudFront cache.
3. **Backend:** Builds a Docker image, pushes to Amazon ECR. Updates AWS ECS or triggers AWS CodeDeploy to perform a rolling update on EC2 Auto Scaling Groups, ensuring zero downtime.

---

## 5. Monitoring & Logging

* **CloudWatch Logs:** FastAPI application logs and Celery worker logs are streamed via CloudWatch Agent.
* **CloudWatch Alarms:** Alerts configured via SNS (SMS/Email) if:
  * 5XX Error Rate > 2%
  * Database CPU > 80%
  * Celery Queue Depth > 1000 tasks
* **Datadog:** Deep Application Performance Monitoring (APM) for database query profiling and API latency tracking.
