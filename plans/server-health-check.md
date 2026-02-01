# Server Health Check Guide

Post-recovery checklist to ensure your server is fully operational after a hard reset.

---

## Step 1: Basic Connectivity & System Status

Once you're logged in via SSH, run these commands:

```bash
# Check system uptime (should be low after reset)
uptime

# Check current kernel version
uname -a

# Check available kernel versions installed
dpkg -l | grep linux-image

# Check if a kernel update is available
sudo apt update
apt list --upgradable | grep linux-image
```

---

## Step 2: Disk & Memory Health

```bash
# Check disk space on all partitions
df -h

# Check for disk errors (run on each partition if needed)
sudo fsck -n /dev/sda1

# Check memory usage
free -h

# Check for out-of-memory issues in logs
sudo dmesg | grep -i "out of memory"
sudo dmesg | grep -i "killed process"

# Check swap usage
swapon --show
```

---

## Step 3: Check System Logs for Issues

```bash
# Check boot log for errors
sudo journalctl -xb | grep -i "error\|fail\|warning" | head -30

# Check system logs around the time of the crash
sudo journalctl --since "2 hours ago" | tail -100

# Check kernel messages
sudo dmesg | tail -50

# Check for hardware errors
sudo dmesg | grep -i "hardware\|error\|fail"
```

---

## Step 4: Service Status Check

```bash
# Check all running services
sudo systemctl list-units --type=service --state=running

# Check for failed services
sudo systemctl --failed

# Check Apache
sudo systemctl status apache2

# Check SSH
sudo systemctl status sshd

# Check if services are enabled to start on boot
sudo systemctl is-enabled apache2
sudo systemctl is-enabled sshd
```

---

## Step 5: Network & Firewall

```bash
# Check network interfaces
ip addr show

# Check routing table
ip route

# Check if SSH port is listening
sudo ss -tlnp | grep :22

# Check Apache ports
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# Check firewall status
sudo ufw status verbose

# Check iptables rules
sudo iptables -L -n -v
```

---

## Step 6: Website Functionality Test

```bash
# Test Apache is serving content locally
curl -I http://localhost

# Should return HTTP/1.1 200 OK

# Test your specific sites
curl -I http://localhost/index.html

# Check Apache error logs
sudo tail -50 /var/log/apache2/error.log

# Check Apache access logs
sudo tail -20 /var/log/apache2/access.log
```

---

## Step 7: SSL Certificate Check

```bash
# Check SSL certificate status
sudo certbot certificates

# Test SSL renewal (dry run)
sudo certbot renew --dry-run

# Check certificate expiry dates
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Step 8: Security Check

```bash
# Check for unauthorized users
who
last | head -20

# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Check for listening ports
sudo netstat -tulpn | grep LISTEN

# Check for suspicious processes
ps aux --sort=-%mem | head -20
```

---

## Step 9: Update & Patch

```bash
# Update package lists
sudo apt update

# Check for available updates
apt list --upgradable

# Apply security updates only
sudo apt upgrade -y

# Or full distribution upgrade (be careful)
# sudo apt dist-upgrade -y

# Remove old packages
sudo apt autoremove -y
sudo apt autoclean

# Check if reboot is required
if [ -f /var/run/reboot-required ]; then
    echo "Reboot required!"
fi
```

---

## Step 10: Kernel Update (if needed)

```bash
# Check current kernel
uname -r

# List installed kernels
dpkg -l | grep linux-image

# Install latest kernel (if update available)
sudo apt install -y linux-image-generic

# Remove old kernels (keep current + 1 previous)
# First, identify old kernels
sudo dpkg -l | grep linux-image | grep -v $(uname -r)

# Remove old kernels (be careful!)
# sudo apt remove --purge linux-image-OLD-VERSION

# Update GRUB
sudo update-grub
```

---

## Automated Health Check Script

Save this as `/usr/local/bin/health-check.sh`:

```bash
#!/bin/bash

echo "=== Server Health Check ==="
echo "Date: $(date)"
echo ""

echo "--- Uptime ---"
uptime
echo ""

echo "--- Disk Usage ---"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

echo "--- Memory Usage ---"
free -h
echo ""

echo "--- Failed Services ---"
systemctl --failed --no-pager
echo ""

echo "--- Apache Status ---"
systemctl is-active apache2 && echo "Apache: RUNNING" || echo "Apache: NOT RUNNING"
echo ""

echo "--- SSH Status ---"
systemctl is-active sshd && echo "SSH: RUNNING" || echo "SSH: NOT RUNNING"
echo ""

echo "--- Listening Ports ---"
ss -tlnp | grep -E "(:22|:80|:443)"
echo ""

echo "--- Recent Errors ---"
journalctl -p err --since "1 hour ago" --no-pager | tail -10
echo ""

echo "=== End of Health Check ==="
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/health-check.sh
```

Run it:
```bash
sudo /usr/local/bin/health-check.sh
```

---

## Quick Reference: One-Liner Health Check

```bash
echo "=== Quick Health Check ===" && echo "Uptime:" && uptime && echo -e "\nDisk:" && df -h / && echo -e "\nMemory:" && free -h | grep Mem && echo -e "\nServices:" && systemctl is-active apache2 sshd && echo -e "\nFailed Services:" && systemctl --failed --no-pager && echo -e "\nRecent Errors:" && sudo journalctl -p err --since "1 hour ago" --no-pager | tail -5
```

---

## What to Look For

| Check | Good | Bad |
|-------|------|-----|
| Disk usage | < 80% | > 90% |
| Memory usage | < 80% | > 95% or OOM errors |
| Failed services | None | Any failed services |
| Apache | Active (running) | Inactive or failed |
| SSH | Active (running) | Inactive or failed |
| Boot log | Clean | Kernel panics, disk errors |
| SSL cert | Valid, not expired | Expired or missing |

---

## If Issues Are Found

1. **Disk full**: Clean logs, remove old packages
2. **Memory issues**: Check for memory leaks, add swap
3. **Failed services**: `sudo systemctl restart <service>`
4. **Kernel issues**: Update kernel, check for hardware problems
5. **SSL expired**: `sudo certbot renew --force-renewal`

---

## Schedule Regular Checks

Add to crontab for daily health checks:

```bash
sudo crontab -e
```

Add:
```
# Daily health check at 8 AM
0 8 * * * /usr/local/bin/health-check.sh >> /var/log/health-check.log 2>&1
```
