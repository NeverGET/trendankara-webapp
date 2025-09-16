#!/bin/bash

# ====================================
# MinIO Setup Script for Production
# ====================================

set -e

echo "======================================"
echo "MinIO Storage Setup for Radio CMS"
echo "======================================"
echo ""

# Check if MinIO client is installed
if ! command -v mc &> /dev/null; then
    echo "MinIO client (mc) not found. Installing..."

    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    if [ "$ARCH" == "x86_64" ]; then
        ARCH="amd64"
    fi

    # Download MinIO client
    wget -q https://dl.min.io/client/mc/release/${OS}-${ARCH}/mc -O /tmp/mc
    chmod +x /tmp/mc
    sudo mv /tmp/mc /usr/local/bin/mc

    if command -v mc &> /dev/null; then
        echo "✅ MinIO client installed successfully"
    else
        echo "❌ Failed to install MinIO client"
        exit 1
    fi
fi

echo ""
echo "MinIO Configuration"
echo "==================="
echo ""

# Prompt for MinIO configuration
read -p "Enter MinIO endpoint (e.g., localhost or minio.domain.com): " MINIO_ENDPOINT
MINIO_ENDPOINT=${MINIO_ENDPOINT:-localhost}

read -p "Enter MinIO port (default: 9000): " MINIO_PORT
MINIO_PORT=${MINIO_PORT:-9000}

read -p "Use SSL/TLS? (y/n, default: n): " USE_SSL
if [[ $USE_SSL =~ ^[Yy]$ ]]; then
    PROTOCOL="https"
    SSL_FLAG="true"
else
    PROTOCOL="http"
    SSL_FLAG="false"
fi

read -p "Enter MinIO access key: " MINIO_ACCESS_KEY
read -sp "Enter MinIO secret key: " MINIO_SECRET_KEY
echo ""

read -p "Enter bucket name (default: media): " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-media}

read -p "Enter public URL for MinIO (e.g., https://storage.domain.com): " MINIO_PUBLIC_URL

echo ""
echo "Configuration Summary:"
echo "====================="
echo "Endpoint: ${PROTOCOL}://${MINIO_ENDPOINT}:${MINIO_PORT}"
echo "Access Key: $MINIO_ACCESS_KEY"
echo "Bucket: $BUCKET_NAME"
echo "Public URL: $MINIO_PUBLIC_URL"
echo ""

read -p "Proceed with MinIO setup? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 1
fi

echo ""
echo "Configuring MinIO client..."

# Configure MinIO client
ALIAS_NAME="radiominio"
mc alias set $ALIAS_NAME ${PROTOCOL}://${MINIO_ENDPOINT}:${MINIO_PORT} $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

if [ $? -ne 0 ]; then
    echo "❌ Failed to configure MinIO client"
    echo "Please check your MinIO server is running and credentials are correct"
    exit 1
fi

echo "✅ MinIO client configured"

# Create bucket if not exists
echo ""
echo "Creating bucket: $BUCKET_NAME"

if mc ls $ALIAS_NAME/$BUCKET_NAME &>/dev/null; then
    echo "Bucket already exists"
else
    mc mb $ALIAS_NAME/$BUCKET_NAME
    if [ $? -eq 0 ]; then
        echo "✅ Bucket created successfully"
    else
        echo "❌ Failed to create bucket"
        exit 1
    fi
fi

# Set bucket policy to allow public read for media files
echo ""
echo "Setting bucket policy..."

cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": ["*"]
            },
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}/uploads/*"
            ]
        }
    ]
}
EOF

mc anonymous set-json /tmp/bucket-policy.json $ALIAS_NAME/$BUCKET_NAME

if [ $? -eq 0 ]; then
    echo "✅ Bucket policy set successfully"
else
    echo "⚠️  Warning: Could not set bucket policy. You may need to configure this manually."
fi

rm -f /tmp/bucket-policy.json

# Create necessary folders
echo ""
echo "Creating folder structure..."

mc mb -p $ALIAS_NAME/$BUCKET_NAME/uploads/images/
mc mb -p $ALIAS_NAME/$BUCKET_NAME/uploads/audio/
mc mb -p $ALIAS_NAME/$BUCKET_NAME/uploads/documents/
mc mb -p $ALIAS_NAME/$BUCKET_NAME/backups/

echo "✅ Folder structure created"

# Test upload
echo ""
echo "Testing MinIO upload..."

echo "Test file for MinIO" > /tmp/test-minio.txt
mc cp /tmp/test-minio.txt $ALIAS_NAME/$BUCKET_NAME/uploads/test.txt

if [ $? -eq 0 ]; then
    echo "✅ Test upload successful"
    mc rm $ALIAS_NAME/$BUCKET_NAME/uploads/test.txt
    rm -f /tmp/test-minio.txt
else
    echo "❌ Test upload failed"
    exit 1
fi

# Generate environment configuration
echo ""
echo "========================================="
echo "✅ MinIO Setup Completed Successfully!"
echo "========================================="
echo ""
echo "Environment Configuration:"
echo "========================="
echo "MINIO_ENDPOINT=$MINIO_ENDPOINT"
echo "MINIO_PORT=$MINIO_PORT"
echo "MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY"
echo "MINIO_SECRET_KEY=$MINIO_SECRET_KEY"
echo "MINIO_BUCKET=$BUCKET_NAME"
echo "MINIO_USE_SSL=$SSL_FLAG"
echo "MINIO_PUBLIC_URL=$MINIO_PUBLIC_URL"
echo ""
echo "Add these values to your .env.production file"
echo ""
echo "MinIO Admin Console:"
echo "==================="
echo "${PROTOCOL}://${MINIO_ENDPOINT}:9001"
echo ""
echo "MinIO Client Commands:"
echo "====================="
echo "List files: mc ls $ALIAS_NAME/$BUCKET_NAME"
echo "Upload file: mc cp file.jpg $ALIAS_NAME/$BUCKET_NAME/uploads/"
echo "Download file: mc cp $ALIAS_NAME/$BUCKET_NAME/uploads/file.jpg ."
echo ""