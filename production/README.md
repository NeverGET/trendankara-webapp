# 🚀 Production Deployment Files

This directory contains all necessary scripts and configuration files for deploying the Radio CMS to production.

## 📁 Files Overview

### Scripts
- **`setup-database.sh`** - Initialize MySQL database with schema and user
- **`setup-minio.sh`** - Configure MinIO storage and create buckets
- **`deploy.sh`** - Main deployment script for pushing code to production
- **`health-check.sh`** - Comprehensive health check for all services
- **`backup.sh`** - Automated backup for database and media files

### Configuration
- **`.env.production.template`** - Environment variables template
- **`nginx.conf`** - Nginx reverse proxy configuration
- **`ecosystem.config.js`** - PM2 process manager configuration
- **`DEPLOYMENT-GUIDE.md`** - Step-by-step deployment instructions

## 🚀 Quick Start

### 1. First Time Setup

```bash
# SSH into your server
ssh user@trendankara.com

# Create setup directory
mkdir ~/radio-cms-setup
cd ~/radio-cms-setup

# Upload all production files
# From your local machine:
scp -r production/* user@trendankara.com:~/radio-cms-setup/

# On server: make scripts executable
chmod +x *.sh
```

### 2. Setup Database

```bash
./setup-database.sh

# You'll be prompted for:
# - MySQL root password
# - Database name (default: radio_db)
# - Database user (default: radiouser)
# - New password for database user
```

### 3. Setup MinIO Storage

```bash
./setup-minio.sh

# You'll be prompted for:
# - MinIO endpoint (localhost)
# - MinIO port (9000)
# - Access key and secret key
# - Bucket name (default: media)
```

### 4. Configure Environment

```bash
# Copy and edit environment file
cp .env.production.template .env.production
nano .env.production

# Update with your actual values:
# - Database credentials from step 2
# - MinIO credentials from step 3
# - Your domain URLs
# - Generate secret: openssl rand -base64 32
```

### 5. Deploy Application

```bash
# From your local machine
cd production
./deploy.sh production
```

### 6. Setup Nginx

```bash
# On server
sudo cp nginx.conf /etc/nginx/sites-available/radio-cms
sudo ln -s /etc/nginx/sites-available/radio-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL Certificate

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d trendankara.com -d www.trendankara.com
```

## 🔍 Management Commands

### Check System Health
```bash
./health-check.sh
```

### Create Backup
```bash
./backup.sh
# Backups are saved to ~/backups/radio-cms/
```

### View Application Logs
```bash
pm2 logs radio-cms
pm2 monit  # Real-time monitoring
```

### Restart Application
```bash
pm2 restart radio-cms
pm2 reload radio-cms  # Zero-downtime reload
```

### Update Deployment
```bash
# From local machine
./deploy.sh production
```

## 📊 Monitoring

### Application Status
```bash
pm2 status
pm2 describe radio-cms
```

### System Resources
```bash
pm2 monit
htop
df -h  # Disk usage
free -h  # Memory usage
```

### Service Logs
```bash
# Application logs
pm2 logs radio-cms --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/radio-cms-access.log
sudo tail -f /var/log/nginx/radio-cms-error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

## 🔒 Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Configure firewall (`ufw`)
- [ ] Setup SSL certificates
- [ ] Disable root SSH login
- [ ] Configure fail2ban
- [ ] Set up automated backups
- [ ] Test restore procedure
- [ ] Configure monitoring alerts
- [ ] Review Nginx security headers
- [ ] Enable rate limiting

## 🚨 Troubleshooting

### Application won't start
```bash
pm2 logs radio-cms
pm2 describe radio-cms
node --version  # Should be 20+
```

### Database connection issues
```bash
mysql -u radiouser -p radio_db
systemctl status mysql
```

### MinIO issues
```bash
curl http://localhost:9000/minio/health/live
mc ls radiominio/media
```

### Nginx issues
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

## 📞 Important URLs

After deployment:

- **Application**: https://trendankara.com
- **Admin Panel**: https://trendankara.com/admin
- **API Health**: https://trendankara.com/api/health
- **MinIO Console**: http://localhost:9001 (tunnel via SSH)

## 🔄 Backup & Restore

### Create Manual Backup
```bash
./backup.sh
```

### Schedule Automatic Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 3 AM
0 3 * * * /home/user/radio-cms-setup/backup.sh

# Weekly backup on Sunday at 2 AM
0 2 * * 0 /home/user/radio-cms-setup/backup.sh
```

### Restore from Backup
```bash
# Extract backup
tar -xzf ~/backups/radio-cms/radio-cms_backup_YYYYMMDD.tar.gz

# Restore database
gunzip -c database/*.sql.gz | mysql -u radiouser -p radio_db

# Restore media files
tar -xzf media/*.tar.gz
mc mirror uploads radiominio/media/uploads

# Restore configuration
tar -xzf config/*.tar.gz
cp .env.production /var/www/radio-cms/
```

## 📝 Notes

- All scripts are idempotent (safe to run multiple times)
- Scripts include error handling and rollback capabilities
- Backups are retained for 30 days by default
- PM2 runs in cluster mode with 2 instances
- Nginx includes rate limiting for API endpoints
- SSL renewal is handled automatically by Certbot

## ⚠️ Important

- Always test deployments on staging first
- Keep production credentials secure
- Regular backups are essential
- Monitor disk space for media storage
- Review logs regularly for issues

---

For detailed instructions, see [`DEPLOYMENT-GUIDE.md`](./DEPLOYMENT-GUIDE.md)