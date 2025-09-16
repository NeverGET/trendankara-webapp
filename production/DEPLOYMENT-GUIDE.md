# 📦 Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Radio Station CMS to production via SSH.

## Prerequisites

### On Production Server
- Ubuntu/Debian Linux (or similar)
- Node.js 20+ installed
- PM2 for process management (`npm install -g pm2`)
- Nginx for reverse proxy
- MySQL 8.0 running
- MinIO running
- Git installed

### Required Information
- SSH access to server
- MySQL root/admin credentials
- MinIO admin credentials
- Domain name configured

## 🚀 Quick Deploy

```bash
# On your local machine
cd production
./deploy.sh production
```

## 📋 Step-by-Step Manual Deployment

### 1. Prepare Local Files

```bash
# Build the application locally
npm run build

# Create deployment package
cd production
./prepare-deploy.sh
```

### 2. Upload to Server

```bash
# Copy files to server
scp -r deployment.tar.gz user@yourserver.com:/home/user/
scp -r production/* user@yourserver.com:/home/user/setup/

# SSH into server
ssh user@yourserver.com
```

### 3. Setup Database

```bash
# Run database setup
cd ~/setup
chmod +x setup-database.sh
./setup-database.sh

# You'll be prompted for:
# - MySQL root password
# - New database name (radio_db)
# - New database user (radiouser)
# - New database password
```

### 4. Setup MinIO Storage

```bash
# Run MinIO setup
chmod +x setup-minio.sh
./setup-minio.sh

# You'll be prompted for:
# - MinIO endpoint
# - MinIO access key
# - MinIO secret key
# - Bucket name (media)
```

### 5. Configure Environment

```bash
# Edit production environment file
cp .env.production.template .env.production
nano .env.production

# Update with your actual values:
# - Database credentials
# - MinIO credentials
# - Domain URLs
# - Secret keys
```

### 6. Deploy Application

```bash
# Extract and setup application
cd /var/www
sudo tar -xzf ~/deployment.tar.gz
sudo chown -R www-data:www-data radio-cms

# Install dependencies
cd radio-cms
npm install --production

# Run database migrations
node scripts/migrate-production.js

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 7. Configure Nginx

```bash
# Copy nginx configuration
sudo cp ~/setup/nginx.conf /etc/nginx/sites-available/radio-cms
sudo ln -s /etc/nginx/sites-available/radio-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔍 Health Checks

```bash
# Check all services
cd ~/setup
./health-check.sh

# Individual checks
curl http://localhost:3000/api/health
pm2 status
systemctl status nginx
systemctl status mysql
```

## 📦 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=mysql://radiouser:password@localhost:3306/radio_db

# Storage
MINIO_ENDPOINT=localhost or minio.yourdomain.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=media
MINIO_USE_SSL=true  # Set to true if MinIO has SSL

# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Radio Configuration
RADIO_STREAM_URL=https://radyo.yayin.com.tr:5132/stream
RADIO_METADATA_URL=https://radyo.yayin.com.tr:5132/
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall (ufw)
- [ ] Setup SSL certificates
- [ ] Disable root SSH login
- [ ] Configure fail2ban
- [ ] Regular security updates
- [ ] Backup strategy in place

## 🔄 Update Deployment

```bash
# Pull latest changes
cd /var/www/radio-cms
git pull origin main

# Install new dependencies
npm install --production

# Run migrations
node scripts/migrate-production.js

# Rebuild
npm run build

# Restart PM2
pm2 restart all
```

## 💾 Backup

```bash
# Run backup script
cd ~/setup
./backup.sh

# Backups are stored in ~/backups/
# - Database: radio_db_YYYYMMDD.sql
# - Media: media_YYYYMMDD.tar.gz
```

## 🚨 Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs

# Check Node version
node --version  # Should be 20+

# Check environment variables
pm2 env 0
```

### Database connection failed
```bash
# Test MySQL connection
mysql -u radiouser -p -h localhost radio_db

# Check MySQL status
systemctl status mysql

# Check credentials in .env.production
```

### MinIO connection failed
```bash
# Check MinIO status
curl http://localhost:9000/minio/health/live

# Test with MinIO client
mc alias set myminio http://localhost:9000 accesskey secretkey
mc ls myminio/media
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

## 📊 Monitoring

### Setup monitoring with PM2
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View metrics
pm2 monit
```

### Application metrics endpoint
```
GET https://yourdomain.com/api/metrics
```

## 📞 Support Commands

```bash
# View all logs
pm2 logs

# Restart application
pm2 restart radio-cms

# Stop application
pm2 stop radio-cms

# View real-time metrics
pm2 monit

# Database console
mysql -u radiouser -p radio_db

# MinIO console
http://yourdomain.com:9001
```

## 🔗 Important URLs

After deployment, access your services at:

- **Application**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin
- **API Health**: https://yourdomain.com/api/health
- **MinIO Console**: https://yourdomain.com:9001
- **phpMyAdmin**: https://yourdomain.com/dbadmin (if installed)

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] Database connected and initialized
- [ ] MinIO bucket created and accessible
- [ ] Media uploads working
- [ ] SSL certificate installed
- [ ] PM2 configured for auto-restart
- [ ] Nginx properly configured
- [ ] Backups scheduled
- [ ] Monitoring enabled
- [ ] Environment variables secured

---

For automated deployment, use the provided scripts in the `production/` directory.