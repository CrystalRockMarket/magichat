# Deployment Guide: Rainbow Magic Hat Website

This guide covers deploying the static HTML website to an existing Apache server with SSL configuration.

---

## Prerequisites

- SSH access to your server
- Apache 2.4+ installed and running
- A domain name pointing to your server's IP address
- Sudo/root privileges

---

## Step 1: SSH into Your Server

```bash
ssh user@your-server-ip
```

---

## Step 2: Clone the Repository

Navigate to the web root directory and clone:

```bash
# Navigate to Apache web root (adjust if your web root differs)
cd /var/www

# Clone the repository
sudo git clone https://github.com/yourusername/RainbowMagicHatPage.git magichatlink

# Set proper ownership (replace www-data with your Apache user if different)
sudo chown -R www-data:www-data /var/www/magichatlink

# Set proper permissions
sudo chmod -R 755 /var/www/magichatlink
```

**Note:** If using a different web root like `/var/www/html`, adjust paths accordingly.

---

## Step 3: Apache Virtual Host Configuration

### Create the Virtual Host File

```bash
sudo nano /etc/apache2/sites-available/magichatlink.conf
```

Add the following configuration (replace `your-domain.com` with your actual domain):

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/magichatlink

    # Enable directory indexing for the main page
    DirectoryIndex index.html

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/magichatlink-error.log
    CustomLog ${APACHE_LOG_DIR}/magichatlink-access.log combined

    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
    </IfModule>

    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType image/png "access plus 1 month"
        ExpiresByType image/jpeg "access plus 1 month"
    </IfModule>

    <Directory /var/www/magichatlink>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Enable Required Apache Modules

```bash
# Enable required modules
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires
sudo a2enmod rewrite
sudo a2enmod ssl

# Enable the site
sudo a2ensite magichatlink.conf

# Test configuration syntax
sudo apache2ctl configtest
```

You should see: `Syntax OK`

---

## Step 4: SSL Certificate Setup (Let's Encrypt)

### Install Certbot

**For Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-apache
```

**For CentOS/RHEL:**
```bash
sudo yum install -y certbot python3-certbot-apache
```

### Obtain SSL Certificate

```bash
# Replace with your actual domain
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter your email address
- Agree to the terms of service
- Choose whether to share your email with EFF
- Select whether to redirect HTTP to HTTPS (recommended: Yes)

### Verify Auto-Renewal

```bash
# Test auto-renewal (dry run)
sudo certbot renew --dry-run
```

---

## Step 5: Restart Apache

```bash
# Graceful restart (recommended)
sudo systemctl reload apache2

# OR full restart
sudo systemctl restart apache2

# Check status
sudo systemctl status apache2
```

---

## Step 6: Verification

### Test HTTP to HTTPS Redirect
```bash
curl -I http://your-domain.com
```
Should return a 301 redirect to HTTPS.

### Test HTTPS is Working
```bash
curl -I https://your-domain.com
```
Should return 200 OK.

### Verify SSL Certificate
```bash
openssl s_client -connect your-domain.com:443 -servername your-domain.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```

### Check Website in Browser
1. Visit `https://your-domain.com`
2. Verify the padlock icon appears (secure connection)
3. Test the Magic Hat link conversion functionality

---

## File Structure on Server

After deployment, your server should have:

```
/var/www/magichatlink/
├── index.html          # Main entry point
├── css/
│   └── styles.css      # Stylesheet
├── js/
│   └── script.js       # JavaScript functionality
├── LatestUpdatedHTML/
│   └── rainbow-magic-hat(4).html
├── original/
├── plans/
│   └── redesign-specification.md
├── ProperStructure/
└── wireframe.png
```

---

## Troubleshooting

### Apache Won't Start
```bash
# Check for syntax errors
sudo apache2ctl configtest

# Check error logs
sudo tail -f /var/log/apache2/error.log
```

### Permission Denied Errors
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/magichatlink
sudo chmod -R 755 /var/www/magichatlink
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Revoke and reissue (if needed)
sudo certbot revoke --cert-name your-domain.com
sudo certbot --apache -d your-domain.com
```

### 403 Forbidden Error
```bash
# Check directory permissions
ls -la /var/www/magichatlink

# Ensure index.html exists
ls -la /var/www/magichatlink/index.html
```

### CSS/JS Not Loading (404 Errors)
Check that the paths in `index.html` are correct:
- `css/styles.css`
- `js/script.js`

These are relative paths and should work if the repository structure is preserved.

---

## Maintenance Commands

### Update the Website
```bash
cd /var/www/magichatlink
sudo git pull origin main
sudo chown -R www-data:www-data .
```

### View Apache Logs
```bash
# Error log
sudo tail -f /var/log/apache2/magichatlink-error.log

# Access log
sudo tail -f /var/log/apache2/magichatlink-access.log
```

### Renew SSL Certificates Manually
```bash
sudo certbot renew
sudo systemctl reload apache2
```

---

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] HTTP redirects to HTTPS
- [ ] Security headers configured (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Directory listing disabled (`Options -Indexes`)
- [ ] Proper file permissions set (755 for directories, 644 for files)
- [ ] Apache running as non-root user
- [ ] Access logs enabled for monitoring

---

## Quick Reference Commands

```bash
# Start/Stop/Restart Apache
sudo systemctl start apache2
sudo systemctl stop apache2
sudo systemctl restart apache2
sudo systemctl reload apache2

# Enable/Disable site
sudo a2ensite magichatlink.conf
sudo a2dissite magichatlink.conf

# Enable/Disable module
sudo a2enmod module-name
sudo a2dismod module-name

# Check Apache status
sudo systemctl status apache2

# Test config
sudo apache2ctl configtest

# View SSL certificates
sudo certbot certificates
```

---

**Last Updated:** 2026-01-29
