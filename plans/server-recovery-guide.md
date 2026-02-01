# Server Recovery Guide: Google Cloud VM (34.57.221.53)

Your server is completely unreachable (no SSH, websites down). Here's how to recover it using Google Cloud Console.

---

## Step 1: Access Google Cloud Console

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Navigate to **Compute Engine** → **VM Instances**
3. Find your VM with IP `34.57.221.53`

---

## Step 2: Check VM Status

In the VM Instances list, check the **Status** column:

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 Running | VM is on | Go to Step 3 (Serial Console) |
| 🔴 Stopped | VM is off | Click **Start** button |
| 🟡 Repairing | Google is fixing it | Wait |
| ⚠️ Error | Problem detected | Go to Step 5 (Recovery) |

---

## Step 3: Connect via Serial Console (Browser-based)

Since SSH isn't working, use Google's browser console:

1. Click on your VM name
2. Click **Edit** (top menu)
3. Scroll down to **Remote access** section
4. Ensure **Enable connecting to serial ports** is checked
5. Click **Save**
6. Click **Connect to serial console** button (or use SSH dropdown → "Open in browser window")

This gives you a terminal in your browser, bypassing SSH network issues.

---

## Step 4: Diagnose from Serial Console

Once connected, run these commands:

```bash
# Check if server is responsive
date
whoami

# Check disk space (full disk prevents SSH)
df -h

# Check memory usage
free -h

# Check if SSH service is running
sudo systemctl status sshd

# Check Apache status
sudo systemctl status apache2

# Check network interfaces
ip addr show

# Check firewall rules
sudo iptables -L -n
```

---

## Step 5: Common Fixes

### Fix A: Disk Full (100% usage)

```bash
# Find large files
sudo du -sh /var/log/*
sudo du -sh /tmp/*

# Clear old logs
sudo find /var/log -name "*.log" -type f -mtime +7 -delete

# Clear package cache
sudo apt clean

# Check disk again
df -h
```

### Fix B: SSH Service Not Running

```bash
# Start SSH service
sudo systemctl start sshd

# Or for older systems
sudo service ssh start

# Enable on boot
sudo systemctl enable sshd
```

### Fix C: Firewall Blocking Port 22

```bash
# Check UFW status
sudo ufw status

# If active, allow SSH
sudo ufw allow 22/tcp
sudo ufw allow OpenSSH

# Check iptables
sudo iptables -L -n | grep 22

# If port 22 is DROPped, fix it
sudo iptables -D INPUT -p tcp --dport 22 -j DROP
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

### Fix D: Wrong Network Interface

```bash
# Restart networking
sudo systemctl restart networking

# Or
sudo netplan apply
```

### Fix E: Apache/Service Crashed from opencode

```bash
# Check what opencode might have done
history | tail -50

# Check system logs for crash
sudo journalctl -xe | tail -100

# Restart Apache
sudo systemctl restart apache2

# Check for OOM (out of memory) kills
dmesg | grep -i "out of memory"
```

---

## Step 6: If Serial Console Won't Connect

### Option 1: Reset Instance

1. In VM Instances list, click your VM
2. Click **Reset** button (like a reboot)
3. Wait 1-2 minutes and try SSH again

### Option 2: Stop and Start (Hard Reboot)

⚠️ **Warning:** Your ephemeral external IP may change

1. Click **Stop** button
2. Wait for status to show "Stopped"
3. Click **Start** button
4. Check if you have a new external IP
5. Update your DNS if IP changed

### Option 3: Rescue Mode (Advanced)

If the OS won't boot:

1. Click VM name → **Edit**
2. Under **Boot disk**, click **X** to detach it
3. Create a new temporary VM
4. Attach the old disk as secondary
5. Mount and fix the disk
6. Reattach to original VM

---

## Step 7: Google Cloud Firewall Rules

Even if VM firewall is fine, Google Cloud VPC firewall might be blocking you:

1. Go to **VPC Network** → **Firewall**
2. Look for rules affecting your VM
3. Ensure you have a rule allowing:
   - **Protocol:** TCP
   - **Port:** 22
   - **Source:** Your IP (or 0.0.0.0/0 for any)
4. If missing, click **Create Firewall Rule**:
   - Name: `allow-ssh`
   - Target tags: `allow-ssh` (add this tag to your VM)
   - Source IP ranges: `YOUR_IP/32` (or `0.0.0.0/0`)
   - Protocols and ports: `tcp:22`

---

## Step 8: Check for IP Changes

If you stopped/started the VM:

```bash
# In Google Cloud Console, check the External IP column
# If it changed from 34.57.221.53, update your DNS
```

To prevent this in the future:
1. Go to **VPC Network** → **IP Addresses**
2. Click **Reserve External Static Address**
3. Assign it to your VM

---

## Quick Recovery Checklist

- [ ] Open Google Cloud Console
- [ ] Check VM status (running/stopped)
- [ ] Start VM if stopped
- [ ] Open Serial Console (browser-based)
- [ ] Check disk space: `df -h`
- [ ] Check SSH service: `sudo systemctl status sshd`
- [ ] Check firewall: `sudo ufw status`
- [ ] Restart SSH: `sudo systemctl restart sshd`
- [ ] Try SSH from your local machine again
- [ ] Check Google Cloud VPC firewall rules allow port 22
- [ ] If still stuck, Reset or Stop/Start the VM

---

## After Recovery

Once you can SSH again:

```bash
# Check what caused the issue
sudo journalctl -xe | tail -200

# Check opencode logs if applicable
# Check system resource usage
htop

# Ensure services start on boot
sudo systemctl enable sshd
sudo systemctl enable apache2
```

---

## Prevention Tips

1. **Reserve a static IP** so it doesn't change on reboot
2. **Set up monitoring** (Google Cloud Monitoring/Uptime checks)
3. **Configure auto-restart** on crash: VM → Edit → Management → Automatic restart: On
4. **Add a secondary SSH port** (2222) in case 22 gets blocked
5. **Regular backups** using Google Cloud snapshots

---

**Need more help?** If the serial console shows boot errors or kernel panics, you may need to attach the disk to a rescue VM to recover data.
