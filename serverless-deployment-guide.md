# MindCare Hub - Serverless Architecture Deployment Guide

## Overview
Complete serverless deployment using AWS Lambda, API Gateway, RDS, EC2, S3, and CloudWatch for the MindCare Hub mental health platform.

## Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- Serverless Framework installed globally: `npm install -g serverless`

---

## Step 1: VPC and Network Infrastructure

### 1.1 Create VPC
```bash
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=mindcare-hub-vpc}]'

# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=mindcare-hub-vpc" --query 'Vpcs[0].VpcId' --output text)
```

### 1.2 Create Subnets
```bash
# Public Subnet
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mindcare-hub-public-subnet}]'

# Private Subnet 1
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mindcare-hub-private-subnet-1}]'

# Private Subnet 2
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mindcare-hub-private-subnet-2}]'

# Get Subnet IDs
PUBLIC_SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=mindcare-hub-public-subnet" --query 'Subnets[0].SubnetId' --output text)
PRIVATE_SUBNET_1_ID=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=mindcare-hub-private-subnet-1" --query 'Subnets[0].SubnetId' --output text)
PRIVATE_SUBNET_2_ID=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=mindcare-hub-private-subnet-2" --query 'Subnets[0].SubnetId' --output text)
```

### 1.3 Create Internet Gateway
```bash
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=mindcare-hub-igw}]'

IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=mindcare-hub-igw" --query 'InternetGateways[0].InternetGatewayId' --output text)

aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID
```

### 1.4 Configure Route Tables
```bash
# Create public route table
aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=mindcare-hub-public-rt}]'

PUBLIC_RT_ID=$(aws ec2 describe-route-tables --filters "Name=tag:Name,Values=mindcare-hub-public-rt" --query 'RouteTables[0].RouteTableId' --output text)

# Add route to internet gateway
aws ec2 create-route \
  --route-table-id $PUBLIC_RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate public subnet with route table
aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_ID \
  --route-table-id $PUBLIC_RT_ID
```

---

## Step 2: Security Groups Configuration

### 2.1 Create Security Groups
```bash
# Lambda Security Group
aws ec2 create-security-group \
  --group-name mindcare-hub-lambda-sg \
  --description "Security group for MindCare Hub Lambda functions" \
  --vpc-id $VPC_ID

LAMBDA_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=mindcare-hub-lambda-sg" --query 'SecurityGroups[0].GroupId' --output text)

# RDS Security Group
aws ec2 create-security-group \
  --group-name mindcare-hub-rds-sg \
  --description "Security group for MindCare Hub RDS database" \
  --vpc-id $VPC_ID

RDS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=mindcare-hub-rds-sg" --query 'SecurityGroups[0].GroupId' --output text)

# EC2 Security Group
aws ec2 create-security-group \
  --group-name mindcare-hub-ec2-sg \
  --description "Security group for MindCare Hub EC2 worker instance" \
  --vpc-id $VPC_ID

EC2_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=mindcare-hub-ec2-sg" --query 'SecurityGroups[0].GroupId' --output text)
```

### 2.2 Configure Security Group Rules
```bash
# RDS Security Group - Allow PostgreSQL from Lambda and EC2
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $LAMBDA_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $EC2_SG_ID

# EC2 Security Group - Allow SSH and HTTP
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Lambda Security Group - Allow HTTPS outbound
aws ec2 authorize-security-group-egress \
  --group-id $LAMBDA_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-egress \
  --group-id $LAMBDA_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $RDS_SG_ID
```

---

## Step 3: S3 Buckets Setup

### 3.1 Create S3 Buckets
```bash
# Static assets bucket
STATIC_BUCKET_NAME="mindcare-hub-static-$(date +%s)"
aws s3 mb s3://$STATIC_BUCKET_NAME --region us-east-1

# File uploads bucket
UPLOADS_BUCKET_NAME="mindcare-hub-uploads-$(date +%s)"
aws s3 mb s3://$UPLOADS_BUCKET_NAME --region us-east-1

# Serverless deployment bucket
DEPLOYMENT_BUCKET_NAME="mindcare-hub-serverless-$(date +%s)"
aws s3 mb s3://$DEPLOYMENT_BUCKET_NAME --region us-east-1
```

### 3.2 Configure S3 Bucket Policies
```bash
# Create CORS configuration for uploads bucket
cat > s3-cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "MaxAgeSeconds": 3000,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket $UPLOADS_BUCKET_NAME \
  --cors-configuration file://s3-cors-config.json

# Enable versioning on static bucket
aws s3api put-bucket-versioning \
  --bucket $STATIC_BUCKET_NAME \
  --versioning-configuration Status=Enabled
```

---

## Step 4: RDS PostgreSQL Database Setup

### 4.1 Create DB Subnet Group
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name mindcare-hub-db-subnet-group \
  --db-subnet-group-description "Subnet group for MindCare Hub database" \
  --subnet-ids $PRIVATE_SUBNET_1_ID $PRIVATE_SUBNET_2_ID
```

### 4.2 Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier mindcare-hub-prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "MindCare2024!SecureDB" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-name mindcare_hub_prod \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name mindcare-hub-db-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted \
  --no-multi-az \
  --no-publicly-accessible \
  --deletion-protection

# Wait for RDS to be available
aws rds wait db-instance-available --db-instance-identifier mindcare-hub-prod-db

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier mindcare-hub-prod-db --query 'DBInstances[0].Endpoint.Address' --output text)
```

---

## Step 5: EC2 Worker Instance Setup

### 5.1 Create Key Pair
```bash
aws ec2 create-key-pair \
  --key-name mindcare-hub-worker-key \
  --query 'KeyMaterial' \
  --output text > mindcare-hub-worker-key.pem

chmod 400 mindcare-hub-worker-key.pem
```

### 5.2 Create EC2 User Data Script
```bash
cat > ec2-worker-userdata.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y git postgresql15

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create app directory
mkdir -p /opt/mindcare-worker
cd /opt/mindcare-worker

# Clone repository
git clone https://github.com/yourusername/mindcare-hub.git .

# Install dependencies
npm install

# Create environment file
cat > .env.production << ENVEOF
DATABASE_URL="postgresql://postgres:MindCare2024!SecureDB@RDS_ENDPOINT_PLACEHOLDER:5432/mindcare_hub_prod"
JWT_SECRET="a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0"
NODE_ENV=production
AWS_REGION=us-east-1
ENVEOF

# Replace RDS endpoint placeholder
sed -i "s/RDS_ENDPOINT_PLACEHOLDER/$RDS_ENDPOINT/g" .env.production

# Install PM2 for process management
npm install -g pm2

# Create worker service
cat > worker.js << WORKEREOF
const { getDatabase } = require('./lib/database');

async function processBackgroundTasks() {
  console.log('Worker started at', new Date());
  // Add background task processing logic here
  setInterval(() => {
    console.log('Processing background tasks...', new Date());
  }, 60000); // Run every minute
}

processBackgroundTasks().catch(console.error);
WORKEREOF

# Start worker with PM2
pm2 start worker.js --name mindcare-worker
pm2 startup
pm2 save

# Setup log rotation
pm2 install pm2-logrotate
EOF

# Replace RDS endpoint in user data
sed -i "s/RDS_ENDPOINT_PLACEHOLDER/$RDS_ENDPOINT/g" ec2-worker-userdata.sh
```

### 5.3 Launch EC2 Instance
```bash
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t3.micro \
  --key-name mindcare-hub-worker-key \
  --security-group-ids $EC2_SG_ID \
  --subnet-id $PUBLIC_SUBNET_ID \
  --associate-public-ip-address \
  --user-data file://ec2-worker-userdata.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mindcare-hub-worker}]'

# Get EC2 instance ID
EC2_INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=mindcare-hub-worker" "Name=instance-state-name,Values=running" --query 'Reservations[0].Instances[0].InstanceId' --output text)
```

---

## Step 6: Database Migration

### 6.1 Connect to EC2 and Setup Database
```bash
# Wait for EC2 to be running
aws ec2 wait instance-running --instance-ids $EC2_INSTANCE_ID

# Get EC2 public IP
EC2_PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $EC2_INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# SSH to EC2 and run database setup
ssh -i mindcare-hub-worker-key.pem ec2-user@$EC2_PUBLIC_IP << 'SSHEOF'
cd /opt/mindcare-worker

# Run database migrations
psql "postgresql://postgres:MindCare2024!SecureDB@$RDS_ENDPOINT:5432/mindcare_hub_prod" << 'SQLEOF'
-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'psychiatrist', 'counselor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES users(user_id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'group', 'family', 'consultation')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    meeting_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mood_entries table
CREATE TABLE mood_entries (
    entry_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
    anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    sleep_hours DECIMAL(3,1),
    notes TEXT,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create community_posts table
CREATE TABLE community_posts (
    post_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderated_by INTEGER REFERENCES users(user_id),
    moderated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resources table
CREATE TABLE resources (
    resource_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    category VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table
CREATE TABLE conversations (
    conversation_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(conversation_id),
    sender_id INTEGER REFERENCES users(user_id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test users
INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active) VALUES
('arun.bohara', 'arunbohara57@gmail.com', 'admin123', 'Arun Bohara', '+60123456789', 'admin', true),
('khusi.ray', 'khusburay160@gmail.com', 'doctor123', 'Khusbu Ray', '+60123456790', 'psychiatrist', true),
('denish.thapa', 'denishkumarthapa@gmail.com', 'counselor123', 'Denish Thapa', '+60123456792', 'counselor', true),
('Unisha.Shrestha', 'unishacharming2020@gmail.com', 'password123', 'Unisha Shrestha', '+977-9852145626', 'patient', true);

-- Create indexes for performance
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

SELECT 'Database setup completed successfully!' as result;
SQLEOF
SSHEOF
```

---

## Step 7: Serverless Framework Configuration

### 7.1 Update serverless.yml
```yaml
service: mindcare-hub-serverless

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: prod
  timeout: 30
  memorySize: 1024
  
  environment:
    DATABASE_URL: "postgresql://postgres:MindCare2024!SecureDB@${env:RDS_ENDPOINT}:5432/mindcare_hub_prod"
    JWT_SECRET: "a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0"
    NODE_ENV: production
    AWS_REGION: us-east-1
    S3_UPLOADS_BUCKET: ${env:UPLOADS_BUCKET_NAME}
    S3_STATIC_BUCKET: ${env:STATIC_BUCKET_NAME}
  
  vpc:
    securityGroupIds:
      - ${env:LAMBDA_SG_ID}
    subnetIds:
      - ${env:PRIVATE_SUBNET_1_ID}
      - ${env:PRIVATE_SUBNET_2_ID}
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: "*"
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: 
            - "arn:aws:s3:::${env:UPLOADS_BUCKET_NAME}/*"
            - "arn:aws:s3:::${env:STATIC_BUCKET_NAME}/*"
        - Effect: Allow
          Action:
            - ec2:CreateNetworkInterface
            - ec2:DescribeNetworkInterfaces
            - ec2:DeleteNetworkInterface
          Resource: "*"

functions:
  # Main application handler
  app:
    handler: lambda/app.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

  # API route handlers
  auth:
    handler: lambda/auth.handler
    events:
      - http:
          path: /api/auth/{proxy+}
          method: ANY
          cors: true

  appointments:
    handler: lambda/appointments.handler
    events:
      - http:
          path: /api/appointments/{proxy+}
          method: ANY
          cors: true

  mood:
    handler: lambda/mood.handler
    events:
      - http:
          path: /api/mood/{proxy+}
          method: ANY
          cors: true

  community:
    handler: lambda/community.handler
    events:
      - http:
          path: /api/community/{proxy+}
          method: ANY
          cors: true

  patients:
    handler: lambda/patients.handler
    events:
      - http:
          path: /api/patients/{proxy+}
          method: ANY
          cors: true

  counselor:
    handler: lambda/counselor.handler
    events:
      - http:
          path: /api/counselor/{proxy+}
          method: ANY
          cors: true

  resources:
    handler: lambda/resources.handler
    events:
      - http:
          path: /api/resources/{proxy+}
          method: ANY
          cors: true

  messages:
    handler: lambda/messages.handler
    events:
      - http:
          path: /api/messages/{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-plugin-warmup

custom:
  warmup:
    enabled: true
    prewarm: true
  serverless-offline:
    httpPort: 3000
    lambdaPort: 3002

package:
  exclude:
    - .git/**
    - .next/**
    - node_modules/.cache/**
    - "*.md"
    - "*.log"
```

### 7.2 Create Lambda Handlers
```bash
mkdir -p lambda

# Main app handler
cat > lambda/app.js << 'EOF'
const { createServer, proxy } = require('aws-serverless-express');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './' });
const handle = app.getRequestHandler();

let server;

exports.handler = async (event, context) => {
  if (!server) {
    await app.prepare();
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
  }
  
  return proxy(server, event, context, 'PROMISE').promise;
};
EOF

# Auth handler
cat > lambda/auth.js << 'EOF'
const { query } = require('../lib/database');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  
  try {
    if (httpMethod === 'POST' && path.includes('/login')) {
      const { username, password } = JSON.parse(body);
      
      const user = await query(
        'SELECT * FROM users WHERE username = $1 AND password_hash = $2 AND is_active = true',
        [username, password]
      );
      
      if (user.length === 0) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }
      
      const token = jwt.sign(
        { userId: user[0].user_id, role: user[0].role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user: user[0] })
      };
    }
    
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
EOF

# Create other handlers similarly...
```

---

## Step 8: CloudWatch Monitoring Setup

### 8.1 Create CloudWatch Dashboard
```bash
cat > cloudwatch-dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "mindcare-hub-serverless-prod-app"],
          [".", "Errors", ".", "."],
          [".", "Invocations", ".", "."],
          [".", "Throttles", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda App Performance",
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "mindcare-hub-serverless-prod"],
          [".", "Latency", ".", "."],
          [".", "4XXError", ".", "."],
          [".", "5XXError", ".", "."]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "API Gateway Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "mindcare-hub-prod-db"],
          [".", "DatabaseConnections", ".", "."],
          [".", "ReadLatency", ".", "."],
          [".", "WriteLatency", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/S3", "BucketSizeBytes", "BucketName", "UPLOADS_BUCKET_NAME", "StorageType", "StandardStorage"],
          [".", "NumberOfObjects", ".", ".", ".", "AllStorageTypes"]
        ],
        "period": 86400,
        "stat": "Average",
        "region": "us-east-1",
        "title": "S3 Storage Metrics"
      }
    }
  ]
}
EOF

# Replace bucket name placeholder
sed -i "s/UPLOADS_BUCKET_NAME/$UPLOADS_BUCKET_NAME/g" cloudwatch-dashboard.json

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "MindCare-Hub-Serverless-Monitoring" \
  --dashboard-body file://cloudwatch-dashboard.json
```

### 8.2 Create CloudWatch Alarms
```bash
# Lambda Error Rate Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MindCare-Lambda-ErrorRate-High" \
  --alarm-description "Lambda function error rate is high" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=mindcare-hub-serverless-prod-app \
  --evaluation-periods 2 \
  --treat-missing-data notBreaching

# Lambda Duration Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MindCare-Lambda-Duration-High" \
  --alarm-description "Lambda function duration is high" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 25000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=mindcare-hub-serverless-prod-app \
  --evaluation-periods 2

# RDS CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MindCare-RDS-CPU-High" \
  --alarm-description "RDS CPU utilization is high" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=mindcare-hub-prod-db \
  --evaluation-periods 2

# RDS Connection Count Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MindCare-RDS-Connections-High" \
  --alarm-description "RDS connection count is high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 15 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=mindcare-hub-prod-db \
  --evaluation-periods 2

# API Gateway 5XX Error Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MindCare-APIGateway-5XX-High" \
  --alarm-description "API Gateway 5XX error rate is high" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=mindcare-hub-serverless-prod \
  --evaluation-periods 2
```

---

## Step 9: Deploy Serverless Application

### 9.1 Install Dependencies
```bash
npm install --save-dev serverless-offline serverless-plugin-warmup
npm install aws-serverless-express
```

### 9.2 Set Environment Variables
```bash
export RDS_ENDPOINT=$RDS_ENDPOINT
export LAMBDA_SG_ID=$LAMBDA_SG_ID
export PRIVATE_SUBNET_1_ID=$PRIVATE_SUBNET_1_ID
export PRIVATE_SUBNET_2_ID=$PRIVATE_SUBNET_2_ID
export UPLOADS_BUCKET_NAME=$UPLOADS_BUCKET_NAME
export STATIC_BUCKET_NAME=$STATIC_BUCKET_NAME
```

### 9.3 Deploy Application
```bash
# Build Next.js application
npm run build

# Deploy with Serverless Framework
serverless deploy --stage prod --region us-east-1 --verbose

# Get API Gateway URL
API_GATEWAY_URL=$(aws apigateway get-rest-apis --query "items[?name=='mindcare-hub-serverless-prod'].id" --output text)
echo "API Gateway URL: https://$API_GATEWAY_URL.execute-api.us-east-1.amazonaws.com/prod"
```

---

## Step 10: Post-Deployment Configuration

### 10.1 Upload Static Assets to S3
```bash
# Upload built assets to S3
aws s3 sync .next/static s3://$STATIC_BUCKET_NAME/static/ --delete

# Upload public assets
aws s3 sync public s3://$STATIC_BUCKET_NAME/public/ --delete

# Set public read permissions
aws s3api put-bucket-policy \
  --bucket $STATIC_BUCKET_NAME \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'$STATIC_BUCKET_NAME'/*"
      }
    ]
  }'
```

### 10.2 Configure CloudFront Distribution (Optional)
```bash
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "mindcare-hub-'$(date +%s)'",
    "Comment": "MindCare Hub CDN",
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-'$STATIC_BUCKET_NAME'",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0
    },
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-'$STATIC_BUCKET_NAME'",
          "DomainName": "'$STATIC_BUCKET_NAME'.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "Enabled": true
  }'
```

---

## Step 11: Testing and Verification

### 11.1 Test API Endpoints
```bash
# Get API Gateway URL
API_URL=$(serverless info --stage prod | grep "ServiceEndpoint" | awk '{print $2}')

# Test health endpoint
curl $API_URL/api/health

# Test authentication
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"arun.bohara","password":"admin123"}'

# Test database connection
curl $API_URL/api/test-db-connection
```

### 11.2 Monitor Logs
```bash
# View Lambda logs
serverless logs -f app --stage prod --tail

# View specific function logs
serverless logs -f auth --stage prod --tail

# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/mindcare-hub-serverless-prod"
```

---

## Step 12: Production Environment Variables

Create `.env.production`:
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:MindCare2024!SecureDB@mindcare-hub-prod-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/mindcare_hub_prod

# JWT Configuration
JWT_SECRET=a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0

# AWS Configuration
AWS_REGION=us-east-1
S3_UPLOADS_BUCKET=mindcare-hub-uploads-1234567890
S3_STATIC_BUCKET=mindcare-hub-static-1234567890

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Monitoring
ENABLE_LOGGING=true
LOG_LEVEL=info
```

---

## Step 13: Cost Optimization

### 13.1 Lambda Reserved Concurrency
```bash
# Set reserved concurrency for main functions
aws lambda put-reserved-concurrency-config \
  --function-name mindcare-hub-serverless-prod-app \
  --reserved-concurrent-executions 10

aws lambda put-reserved-concurrency-config \
  --function-name mindcare-hub-serverless-prod-auth \
  --reserved-concurrent-executions 5
```

### 13.2 RDS Automated Backups
```bash
# Configure automated backups
aws rds modify-db-instance \
  --db-instance-identifier mindcare-hub-prod-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00"
```

---

## Step 14: Security Hardening

### 14.1 Enable AWS WAF (Optional)
```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name mindcare-hub-waf \
  --scope CLOUDFRONT \
  --default-action Allow={} \
  --rules '[
    {
      "Name": "RateLimitRule",
      "Priority": 1,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      },
      "Action": {
        "Block": {}
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimitRule"
      }
    }
  ]'
```

### 14.2 Enable VPC Flow Logs
```bash
# Create IAM role for VPC Flow Logs
aws iam create-role \
  --role-name flowlogsRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "vpc-flow-logs.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Create VPC Flow Logs
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids $VPC_ID \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name VPCFlowLogs \
  --deliver-logs-permission-arn arn:aws:iam::ACCOUNT-ID:role/flowlogsRole
```

---

## Step 15: Final Verification and Access

### 15.1 Application Access
- **API Gateway URL**: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`
- **CloudFront URL**: `https://xxxxxxxxxx.cloudfront.net` (if configured)

### 15.2 Test User Credentials
- **Admin**: `arun.bohara` / `admin123`
- **Psychiatrist**: `khusi.ray` / `doctor123`
- **Counselor**: `denish.thapa` / `counselor123`
- **Patient**: `Unisha.Shrestha` / `password123`

### 15.3 Monitoring URLs
- **CloudWatch Dashboard**: AWS Console → CloudWatch → Dashboards → MindCare-Hub-Serverless-Monitoring
- **Lambda Functions**: AWS Console → Lambda → Functions
- **API Gateway**: AWS Console → API Gateway → mindcare-hub-serverless-prod
- **RDS Database**: AWS Console → RDS → mindcare-hub-prod-db

---

## Estimated Monthly Costs

- **Lambda**: $5-15 (based on usage)
- **API Gateway**: $3-10 (per million requests)
- **RDS db.t3.micro**: $15-20
- **S3 Storage**: $1-5
- **CloudWatch**: $2-5
- **Data Transfer**: $1-10
- **Total**: $27-65/month

---

## Troubleshooting

### Common Issues:
1. **Lambda Timeout**: Increase timeout in serverless.yml
2. **Database Connection**: Check VPC configuration and security groups
3. **CORS Issues**: Verify API Gateway CORS settings
4. **Cold Starts**: Enable warmup plugin
5. **Memory Issues**: Increase Lambda memory allocation

### Useful Commands:
```bash
# View all stacks
aws cloudformation list-stacks

# Check Lambda function status
aws lambda get-function --function-name mindcare-hub-serverless-prod-app

# Test database connectivity from EC2
ssh -i mindcare-hub-worker-key.pem ec2-user@$EC2_PUBLIC_IP
psql "postgresql://postgres:MindCare2024!SecureDB@$RDS_ENDPOINT:5432/mindcare_hub_prod" -c "SELECT version();"

# View API Gateway logs
aws logs filter-log-events --log-group-name API-Gateway-Execution-Logs_xxxxxxxxxx/prod
```

Your MindCare Hub serverless application is now fully deployed and ready for production use!