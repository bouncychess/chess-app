# Deployment Guide

## Architecture

The frontend is deployed using:
- **S3** for static file hosting
- **CloudFront** for CDN and HTTPS
- **Route53** for DNS
- **ACM** for SSL certificate
- **GitHub Actions** for CI/CD

## Prerequisites

### 1. SSL Certificate (ACM)

You need an SSL certificate for `dev.chess.biz` (or `*.chess.biz` wildcard) in the **us-east-1** region (required for CloudFront).

To create one:
```bash
aws acm request-certificate \
  --domain-name '*.chess.biz' \
  --subject-alternative-names 'chess.biz' \
  --validation-method DNS \
  --region us-east-1
```

Then validate the certificate using DNS validation in Route53.

### 2. GitHub OIDC Role

The workflow uses the existing IAM role: `arn:aws:iam::578613961467:role/chess-github-actions-deploy`

Ensure this role has the following permissions:
- `cloudformation:*` (for stack management)
- `s3:*` (for bucket operations)
- `cloudfront:*` (for distribution operations)
- `acm:ListCertificates` and `acm:DescribeCertificate` (for certificate lookup)

### 3. Route53 Hosted Zone

You need a hosted zone for `chess.biz` in Route53.

## Deployment

### Automatic Deployment

Push to the `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Deploy frontend"
git push origin main
```

The workflow will:
1. Build the Vite app
2. Deploy CloudFormation infrastructure
3. Sync files to S3
4. Invalidate CloudFront cache

### Manual Deployment

You can also deploy manually:

```bash
# Build the app
npm run build

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file infra/template.yml \
  --stack-name chess-app-stack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DomainName=dev.chess.biz \
    CertificateArn=<your-certificate-arn> \
    Environment=prod

# Get bucket name and distribution ID
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name chess-app-stack \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" \
  --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name chess-app-stack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

# Sync files to S3
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## DNS Configuration

After the first deployment, you need to configure DNS:

1. Get the CloudFront distribution domain name:
```bash
aws cloudformation describe-stacks \
  --stack-name chess-app-stack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" \
  --output text
```

2. Create an A record (Alias) in Route53 pointing `dev.chess.biz` to the CloudFront distribution.

Alternatively, use the AWS Console:
- Go to Route53 > Hosted Zones > chess.biz
- Create a new A record
- Name: dev
- Type: A
- Alias: Yes
- Alias Target: Select your CloudFront distribution

## Environment Variables

The app uses environment-specific `.env` files:
- `.env.development` - for local development
- `.env.production` - for production builds

Make sure to update the WebSocket endpoint in `.env.production` to match your backend:
```
VITE_WS_URL=wss://ws.dev.chess.biz
```

## Stack Outputs

After deployment, the CloudFormation stack provides:
- **WebsiteBucketName**: S3 bucket name
- **CloudFrontDistributionId**: Distribution ID
- **CloudFrontDomainName**: CloudFront domain
- **WebsiteURL**: Final website URL (https://dev.chess.biz)

## Troubleshooting

### Certificate not found
If the deployment fails with "No ACM certificate found", create a wildcard certificate in us-east-1:
```bash
aws acm request-certificate \
  --domain-name '*.chess.biz' \
  --subject-alternative-names 'chess.biz' \
  --validation-method DNS \
  --region us-east-1
```

### CloudFront cache issues
If changes aren't visible, invalidate the cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### 404 errors on refresh
The CloudFormation template is configured to serve `index.html` for 404/403 errors to support client-side routing.
