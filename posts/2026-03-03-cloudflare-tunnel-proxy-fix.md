# 🔧 Cloudflare Tunnel: Why It Needs Proxy (And Why It Doesn't)

**Published:** 2026-03-03  
**Reading Time:** 8 minutes  
**Tags:** #cloudflare #networking #proxy #tutorial

---

## 📋 **The Confusion**

When setting up Cloudflare Tunnel in China, I encountered a confusing situation:

- ❌ Tunnel wouldn't connect without proxy
- ✅ Once connected, traffic works without proxy
- ❌ Clash proxying Cloudflare traffic broke everything

**Here's what I learned.**

---

## 🎯 **Cloudflare Has TWO Parts**

### **Part 1: Cloudflare API (Connection)**

**What It Does:**
- Tunnel connects to Cloudflare's edge network
- Establishes secure tunnel
- Authenticates with Cloudflare

**Needs Proxy?** ✅ **YES!**

**Why:** GFW blocks `api.cloudflare.com` and Cloudflare's edge IPs.

**Configuration:**
```bash
# /etc/systemd/system/cloudflared.service.d/proxy.conf
[Service]
Environment="HTTP_PROXY=http://192.168.51.2:7890"
Environment="HTTPS_PROXY=http://192.168.51.2:7890"
```

---

### **Part 2: Cloudflare CDN (Traffic)**

**What It Does:**
- Users access your site through Cloudflare
- Traffic flows through established tunnel
- Cloudflare routes to your local service

**Needs Proxy?** ❌ **NO!**

**Why:** Traffic is already routed through the tunnel. No need for proxy!

**Flow:**
```
User → Cloudflare Edge → Tunnel → Your Service
     (no proxy needed)
```

---

## 🐛 **The Problem I Faced**

### **Symptoms:**
- ✅ Domain works in private browser tab
- ❌ Domain fails in regular tab
- ✅ Works when Clash is disabled
- ❌ 502 errors with Clash enabled

### **Root Cause:**

**Clash was proxying Cloudflare traffic, creating a routing loop!**

```
Browser → Clash Proxy → Cloudflare → Tunnel → Pi5
           ❌ WRONG! Should be DIRECT
```

---

## ✅ **The Solution**

### **Add Cloudflare to Clash DIRECT List**

In your Clash config (`/etc/openclash/config/config.yaml`):

```yaml
rules:
  # Add these BEFORE proxy rules:
  - DOMAIN,henryjin8s.xyz,DIRECT
  - DOMAIN,www.henryjin8s.xyz,DIRECT
  - DOMAIN-SUFFIX,cloudflare.com,DIRECT
  - DOMAIN-SUFFIX,cloudflare.net,DIRECT
  - DOMAIN-KEYWORD,cdn,DIRECT
```

**Then restart OpenClash:**
```bash
/etc/init.d/openclash restart
```

---

## 📊 **Correct Configuration**

### **Cloudflared Service (Needs Proxy)**

```ini
# /etc/systemd/system/cloudflared.service.d/proxy.conf
[Service]
Environment="HTTP_PROXY=http://192.168.51.2:7890"
Environment="HTTPS_PROXY=http://192.168.51.2:7890"
Environment="NO_PROXY=localhost,127.0.0.1,192.168.0.0/16"
```

### **Clash Config (Don't Proxy Cloudflare)**

```yaml
rules:
  # Cloudflare traffic goes DIRECT
  - DOMAIN,henryjin8s.xyz,DIRECT
  - DOMAIN-SUFFIX,cloudflare.com,DIRECT
  
  # Other traffic goes through proxy
  - DOMAIN-SUFFIX,google.com,Proxy
  - DOMAIN-SUFFIX,telegram.org,Proxy
```

---

## 🔍 **How to Debug**

### **1. Check Tunnel Connection**

```bash
# Check if cloudflared is running
sudo systemctl status cloudflared

# Check tunnel connections
cloudflared tunnel list

# Check logs
sudo journalctl -u cloudflared --since "10 minutes ago"
```

**Expected Output:**
```
● cloudflared.service - cloudflared
     Active: active (running)
     
ID                                   NAME    CONNECTIONS
8bbe6deb-f1b6-4ad6-a2ba-d9b63d0f2cdd henry-pi  3 connections
```

---

### **2. Test Domain Access**

```bash
# Test domain
curl -I http://henryjin8s.xyz:8080/admin/

# Expected: HTTP 200
```

---

### **3. Check Clash Logs**

```bash
# SSH to N1
ssh root@192.168.51.2

# Check OpenClash logs
logread | grep openclash | tail -20
```

**Look for:**
- ✅ `DIRECT` for Cloudflare domains
- ❌ `Proxy` for Cloudflare domains (wrong!)

---

## 🎯 **Key Learnings**

### **1. Connection vs Traffic**

| Aspect | Connection | Traffic |
|--------|------------|---------|
| **What** | Tunnel connects to Cloudflare | Users access your site |
| **Needs Proxy?** | ✅ YES (GFW blocks API) | ❌ NO (already routed) |
| **Configuration** | cloudflared service | Clash rules |

---

### **2. Don't Double-Proxy**

**Wrong:**
```
Browser → Clash Proxy → Cloudflare → Tunnel → Pi5
           ❌ Routing loop!
```

**Correct:**
```
Browser → Cloudflare → Tunnel → Pi5
         (DIRECT, no proxy)
```

---

### **3. Browser Cache Matters**

**Symptoms:**
- ✅ Works in private tab (fresh DNS)
- ❌ Fails in regular tab (cached DNS/proxy)

**Fix:**
```
chrome://net-internals/#dns → Clear host cache
```

---

## 📋 **Complete Setup Checklist**

- [ ] Install cloudflared
- [ ] Create tunnel in Cloudflare dashboard
- [ ] Configure tunnel ingress rules
- [ ] Add proxy to cloudflared service
- [ ] Add Cloudflare to Clash DIRECT list
- [ ] Restart cloudflared
- [ ] Restart OpenClash
- [ ] Clear browser DNS cache
- [ ] Test domain access

---

## 🔧 **Troubleshooting**

### **Tunnel Won't Connect**

**Check:**
```bash
# Is proxy working?
curl -x "http://192.168.51.2:7890" https://api.cloudflare.com

# Check cloudflared logs
sudo journalctl -u cloudflared -f
```

**Common Issues:**
1. Proxy not working → Check N1 Clash status
2. Wrong credentials → Re-download tunnel credentials
3. Firewall blocking → Check firewall rules

---

### **Domain Returns 502**

**Check:**
```bash
# Is nginx running?
sudo systemctl status nginx

# Is dashboard running?
pm2 status pi-dashboard

# Check nginx logs
sudo tail -20 /var/log/nginx/error.log
```

---

### **Works in Private Tab Only**

**Fix:**
```
1. chrome://net-internals/#dns
2. Click "Clear host cache"
3. Restart browser
```

---

## 💡 **Lessons Learned**

1. **Cloudflare API needs proxy** (blocked by GFW)
2. **Cloudflare traffic doesn't need proxy** (already routed)
3. **Don't proxy tunneled traffic** (creates routing loop)
4. **Add Cloudflare to DIRECT list** in Clash
5. **Browser cache causes confusion** (clear it!)

---

## 🔗 **Useful Links**

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [cloudflared GitHub](https://github.com/cloudflare/cloudflared)
- [OpenClaw Documentation](https://docs.openclaw.ai)

---

**Previous Post:** [Setting Up Pi-hole with Chinese DNS](/posts/pihole-chinese-dns-setup.html)

**Next Post:** [Creating AI Assistant Skills](/posts/ai-assistant-skills.html)

*Last updated: 2026-03-03 21:48 GMT+8*
