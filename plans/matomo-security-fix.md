# Matomo Security Fix: Protect Private Directories

Matomo is warning that sensitive directories are publicly accessible. Here's how to secure them.

---

## The Problem

These directories should NOT be accessible via browser:
- `/config/` - Contains database credentials
- `/tmp/` - Temporary files
- `/lang/` - Language files

## The Solution

Add `.htaccess` files to block access or update your Apache virtual host config.

---

## Option 1: .htaccess Files (Quickest)

### 1. Create `/var/www/matomo/config/.htaccess`

```bash
sudo nano /var/www/matomo/config/.htaccess
```

Add:
```apache
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
```

### 2. Create `/var/www/matomo/tmp/.htaccess`

```bash
sudo nano /var/www/matomo/tmp/.htaccess
```

Add same content:
```apache
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
```

### 3. Create `/var/www/matomo/lang/.htaccess`

```bash
sudo nano /var/www/matomo/lang/.htaccess
```

Add same content:
```apache
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
```

### 4. Set Ownership

```bash
sudo chown -R www-data:www-data /var/www/matomo/config/.htaccess
sudo chown -R www-data:www-data /var/www/matomo/tmp/.htaccess
sudo chown -R www-data:www-data /var/www/matomo/lang/.htaccess
```

---

## Option 2: Apache Virtual Host Config (More Secure)

Edit your Matomo virtual host file:

```bash
sudo nano /etc/apache2/sites-available/matomo.conf
```

Add these directives inside the `<VirtualHost>` block:

```apache
<Directory "/var/www/matomo/config">
    Require all denied
</Directory>

<Directory "/var/www/matomo/tmp">
    Require all denied
</Directory>

<Directory "/var/www/matomo/lang">
    Require all denied
</Directory>

# Also protect these files specifically
<Files "config.ini.php">
    Require all denied
</Files>
```

Then reload Apache:
```bash
sudo systemctl reload apache2
```

---

## Verify the Fix

Test these URLs in your browser - they should return **403 Forbidden**:

- `https://matomo.fullmanifest.com/config/config.ini.php`
- `https://matomo.fullmanifest.com/tmp/cache/tracker/matomocache_general.php`
- `https://matomo.fullmanifest.com/tmp/`
- `https://matomo.fullmanifest.com/lang/en.json`>

---

## Complete Security .htaccess for Matomo Root

You can also add this to `/var/www/matomo/.htaccess` for additional protection:

```apache
# Protect sensitive files
<FilesMatch "^\.">
    Require all denied
</FilesMatch>

<FilesMatch "\.(ini|log|sh|sql)$">
    Require all denied
</FilesMatch>

# Protect directories
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Deny access to config
    RewriteRule ^config/ - [F,L]
    
    # Deny access to tmp
    RewriteRule ^tmp/ - [F,L]
    
    # Deny access to lang
    RewriteRule ^lang/ - [F,L]
</IfModule>
```

---

## Quick Fix Commands

Run all at once:

```bash
# Create .htaccess files
sudo tee /var/www/matomo/config/.htaccess << 'EOF'
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
EOF

sudo tee /var/www/matomo/tmp/.htaccess << 'EOF'
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
EOF

sudo tee /var/www/matomo/lang/.htaccess << 'EOF'
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order deny,allow
    Deny from all
</IfModule>
EOF

# Set ownership
sudo chown www-data:www-data /var/www/matomo/config/.htaccess
sudo chown www-data:www-data /var/www/matomo/tmp/.htaccess
sudo chown www-data:www-data /var/www/matomo/lang/.htaccess

# Test
curl -I https://matomo.fullmanifest.com/config/config.ini.php
# Should return: HTTP/1.1 403 Forbidden
```

---

## Why This Matters

If PHP stops working (module disabled, misconfiguration), these files become readable as plain text:
- **config.ini.php** - Contains MySQL username/password
- **Tracker cache files** - May contain sensitive user data
- **Language files** - Could reveal server paths

Blocking access prevents attackers from exploiting this information.
