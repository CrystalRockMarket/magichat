# The Complete Guide to Backing Up Your Web Server

## What You Need to Back Up (And Why)

When your web server crashes or gets compromised, simply having `/var/www` backed up isn't enough. Here's everything you need to ensure a full recovery.

---

## 1. Website Files (`/var/www`)

**What:** All your HTML, CSS, JavaScript, images, and application files.

**Why:** This is your actual website content. Without it, you have nothing to serve.

**Backup command:**
```bash
sudo tar -czf /backups/www-backup-$(date +%Y%m%d).tar.gz /var/www
```

**Pro tip:** If your sites are in Git, you have some protection, but still back up the live files in case of uncommitted changes or local config files.

---

## 2. Apache/Nginx Configuration (`/etc/apache2` or `/etc/nginx`)

**What:** Virtual host configs, SSL settings, modules, and server blocks.

**Why:** Your sites won't work without the proper server configuration. This includes:
- Virtual host files (`/etc/apache2/sites-available/`)
- SSL certificates and keys (`/etc/letsencrypt/`)
- Custom modules and settings

**Backup command:**
```bash
# Apache
sudo tar -czf /backups/apache-config-$(date +%Y%m%d).tar.gz /etc/apache2 /etc/letsencrypt

# Nginx
sudo tar -czf /backups/nginx-config-$(date +%Y%m%d).tar.gz /etc/nginx /etc/letsencrypt
```

---

## 3. SSL Certificates (`/etc/letsencrypt`)

**What:** Your Let's Encrypt certificates, private keys, and renewal configs.

**Why:** Without these, HTTPS won't work. Reissuing certs is possible but time-consuming and you might hit rate limits.

**Critical files:**
- `/etc/letsencrypt/live/` - Current certificates
- `/etc/letsencrypt/archive/` - Historical certificates
- `/etc/letsencrypt/renewal/` - Renewal configuration

**Backup command:**
```bash
sudo tar -czf /backups/ssl-certs-$(date +%Y%m%d).tar.gz /etc/letsencrypt
```

---

## 4. Database Backups (MySQL/PostgreSQL)

**What:** All your databases and user permissions.

**Why:** Dynamic websites store content in databases. Without them, you have empty templates.

**MySQL/MariaDB backup:**
```bash
# All databases
sudo mysqldump --all-databases > /backups/mysql-all-$(date +%Y%m%d).sql

# Specific database
sudo mysqldump -u root -p database_name > /backups/db-name-$(date +%Y%m%d).sql
```

**PostgreSQL backup:**
```bash
# All databases
sudo -u postgres pg_dumpall > /backups/postgres-all-$(date +%Y%m%d).sql

# Specific database
sudo -u postgres pg_dump database_name > /backups/db-name-$(date +%Y%m%d).sql
```

---

## 5. System Configuration Files

**What:** Critical system settings that affect your server operation.

**Why:** These control networking, firewall rules, user accounts, and scheduled tasks.

**Files to back up:**
```bash
# Create a system config backup
sudo tar -czf /backups/system-config-$(date +%Y%m%d).tar.gz \
  /etc/hosts \
  /etc/hostname \
  /etc/network/interfaces \
  /etc/netplan \
  /etc/ufw \
  /etc/ssh/sshd_config \
  /etc/cron.d \
  /etc/cron.daily \
  /etc/cron.weekly \
  /etc/cron.monthly \
  /var/spool/cron
```

---

## 6. User Data and Home Directories

**What:** User accounts, SSH keys, and personal configurations.

**Why:** Your SSH keys for Git access, user scripts, and environment configs live here.

**Backup command:**
```bash
# Backup all home directories (excluding cache)
sudo tar -czf /backups/home-dirs-$(date +%Y%m%d).tar.gz \
  --exclude='*/.cache' \
  --exclude='*/tmp' \
  /home
```

---

## 7. Installed Packages List

**What:** A list of all installed software packages.

**Why:** Reinstalling your server is much faster when you know exactly what was installed.

**Backup commands:**
```bash
# Debian/Ubuntu
dpkg --get-selections > /backups/installed-packages-$(date +%Y%m%d).txt

# CentOS/RHEL
rpm -qa > /backups/installed-packages-$(date +%Y%m%d).txt

# Also backup repositories
sudo tar -czf /backups/apt-sources-$(date +%Y%m%d).tar.gz /etc/apt/sources.list /etc/apt/sources.list.d
```

---

## 8. Application-Specific Configs

**What:** Configuration files for PHP, Node.js, Python apps, etc.

**Why:** Each application has its own settings that need to be preserved.

**Common locations:**
- `/etc/php/` - PHP configuration
- `/etc/php-fpm.d/` - PHP-FPM pools
- `/opt/` - Custom applications
- `/usr/local/bin/` - Custom scripts
- Application-specific `.env` files in `/var/www`

---

## Complete Backup Script

Save this as `/usr/local/bin/full-server-backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting full server backup at $(date)"

# 1. Website files
echo "Backing up website files..."
sudo tar -czf $BACKUP_DIR/www-$DATE.tar.gz /var/www

# 2. Apache config
echo "Backing up Apache configuration..."
sudo tar -czf $BACKUP_DIR/apache-config-$DATE.tar.gz /etc/apache2 /etc/letsencrypt

# 3. MySQL databases (if installed)
if command -v mysqldump &> /dev/null; then
    echo "Backing up MySQL databases..."
    sudo mysqldump --all-databases > $BACKUP_DIR/mysql-all-$DATE.sql
fi

# 4. PostgreSQL databases (if installed)
if command -v pg_dumpall &> /dev/null; then
    echo "Backing up PostgreSQL databases..."
    sudo -u postgres pg_dumpall > $BACKUP_DIR/postgres-all-$DATE.sql
fi

# 5. System configuration
echo "Backing up system configuration..."
sudo tar -czf $BACKUP_DIR/system-config-$DATE.tar.gz \
    /etc/hosts /etc/hostname /etc/ssh/sshd_config \
    /etc/ufw /etc/cron.d /etc/cron.daily /etc/cron.weekly

# 6. User data
echo "Backing up home directories..."
sudo tar -czf $BACKUP_DIR/home-dirs-$DATE.tar.gz \
    --exclude='*/.cache' --exclude='*/tmp' /home

# 7. Installed packages
echo "Backing up package list..."
dpkg --get-selections > $BACKUP_DIR/packages-$DATE.txt

# 8. Create a manifest
echo "Creating backup manifest..."
cat > $BACKUP_DIR/backup-manifest-$DATE.txt << EOF
Backup Date: $(date)
Server: $(hostname)
IP: $(hostname -I)

Backup Files:
$(ls -lh $BACKUP_DIR/*-$DATE.*)

Disk Usage:
$(df -h)

Memory:
$(free -h)
EOF

echo "Backup complete!"

# Clean up old backups (keep last $RETENTION_DAYS days)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.txt" -mtime +$RETENTION_DAYS -delete

echo "Backup process finished at $(date)"
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/full-server-backup.sh
```

---

## Automating Backups

Add to crontab for daily backups:

```bash
sudo crontab -e
```

Add this line for daily backups at 2 AM:
```
0 2 * * * /usr/local/bin/full-server-backup.sh >> /var/log/server-backup.log 2>&1
```

---

## Off-Site Backup Storage

**Local backups aren't enough!** If the server dies, your backups die too.

### Option 1: Rsync to Another Server
```bash
# Add to backup script
rsync -avz --delete /backups/ user@backup-server:/remote/backup/path/
```

### Option 2: Cloud Storage (AWS S3, Google Cloud Storage, etc.)
```bash
# Using AWS CLI
aws s3 sync /backups/ s3://your-backup-bucket/server-backups/

# Using rclone (supports many cloud providers)
rclone sync /backups/ remote:backup-bucket
```

### Option 3: Dedicated Backup Services
- **BorgBase** - Borg backup hosting
- **Backblaze B2** - Affordable cloud storage
- **rsync.net** - ZFS-based backup storage

---

## Testing Your Backups

**A backup you can't restore is worthless.** Test regularly:

```bash
# Test extraction
cd /tmp
tar -tzf /backups/www-20260129.tar.gz | head -20

# Test database restore
sudo mysql -e "CREATE DATABASE test_restore;"
sudo mysql test_restore < /backups/mysql-all-20260129.sql

# Verify data
sudo mysql -e "SHOW TABLES;" test_restore
```

---

## Quick Recovery Checklist

If your server dies, here's the order to restore:

1. **Provision new server** with same OS version
2. **Restore system config** (network, firewall, SSH)
3. **Install packages** from your package list
4. **Restore Apache/Nginx config**
5. **Restore SSL certificates**
6. **Restore website files** to `/var/www`
7. **Restore databases**
8. **Test everything**

---

## Summary: What to Back Up

| Component | Location | Priority |
|-----------|----------|----------|
| Website files | `/var/www` | Critical |
| Web server config | `/etc/apache2` or `/etc/nginx` | Critical |
| SSL certificates | `/etc/letsencrypt` | Critical |
| Databases | MySQL/PostgreSQL dumps | Critical |
| System config | `/etc/hosts`, `/etc/ssh`, etc. | High |
| User data | `/home` | Medium |
| Package list | `dpkg --get-selections` | Medium |
| Application configs | `/etc/php/`, `/opt/`, etc. | Medium |

**Remember:** Test your backups regularly. A backup that can't be restored is just wasted storage.