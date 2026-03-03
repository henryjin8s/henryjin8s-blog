# 🚀 Building My Self-Hosted AI Assistant Infrastructure

**Published:** 2026-03-03  
**Reading Time:** 15 minutes  
**Tags:** #selfhosted #ai #infrastructure #raspberrypi #openclaw

---

## 📋 **Overview**

Over the past two days (March 2-3, 2026), I built a comprehensive self-hosted AI assistant infrastructure on my Raspberry Pi 5. This post documents everything we accomplished, the challenges we faced, and the solutions we implemented.

---

## 🎯 **What We Built**

### **1. N1 Clash Proxy System**

**Goal:** Create a reliable proxy for international traffic with automatic failover.

**Hardware:**
- Phicomm N1 (TV box flashed with OpenWrt)
- IP: `192.168.51.2`
- Role: Primary Clash proxy

**Setup:**
```
Internet → ChinaNet (192.168.1.1) → Redmi Router (192.168.51.1) → N1 Proxy (192.168.51.2)
```

**Features:**
- OpenClash with Meta core
- Automatic failover to backup proxy (192.168.31.11)
- Telegram notifications on failover
- Health checks every 2 minutes

---

### **2. Pi-hole DNS Ad-Blocker**

**Goal:** Network-wide ad blocking with DNS that works even when proxies are down.

**Installation:**
```bash
docker run -d \
  --name pihole \
  -p 53:53/tcp -p 53:53/udp \
  -p 8082:80/tcp \
  -e DNS1="114.114.114.114" \
  -e DNS2="223.5.5.5" \
  -v /home/henry/pihole/etc-pihole:/etc/pihole \
  pihole/pihole:latest
```

**Key Decision:** Used Chinese DNS servers instead of Google/Cloudflare.

**Why?**
- ✅ Works without proxy
- ✅ Fast response (~10ms)
- ✅ Reliable even if all proxies go down
- ✅ No GFW interference

**Access:** `http://192.168.51.74:8082/admin`

---

### **3. Pi Dashboard (System Monitor)**

**Goal:** Real-time monitoring of system stats and services.

**Tech Stack:**
- Node.js backend
- HTML/CSS frontend
- PM2 process management
- nginx reverse proxy

**Features:**
- Live CPU, Memory, Temperature monitoring
- Top 5 processes by memory
- Uptime Kuma integration
- Auto-refresh every 30 seconds

**Access:**
- Local: `http://192.168.51.74:8080/admin/`
- Domain: `http://henryjin8s.xyz:8080/admin/`

---

### **4. Cloudflare Tunnel**

**Goal:** Make dashboard accessible from anywhere without port forwarding.

**Key Learning:** Cloudflare tunnel needs proxy to CONNECT (GFW blocks Cloudflare API) but NOT for traffic (already routed through tunnel).

**Important:** Added Cloudflare domains to Clash DIRECT list to prevent routing loop!

```yaml
rules:
  - DOMAIN,henryjin8s.xyz,DIRECT
  - DOMAIN-SUFFIX,cloudflare.com,DIRECT
```

---

### **5. Uptime Kuma Monitoring**

**Goal:** Monitor all services and get alerts when something goes down.

**Monitors Added:**
- Pi Dashboard (HTTP check every 60s)
- Website
- OpenClaw Gateway
- SSH
- Alibaba Cloud TCP

**Access:** `http://192.168.51.74:3001`

---

## 📊 **Final Architecture**

```
Internet → ChinaNet (1.1) → Redmi (51.1) → Switch
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
              Pi5 (51.74)                         N1 (51.2)
              - Pi-hole (8082)                    - Clash Proxy
              - Dashboard (8080)                    (7890)
              - Uptime Kuma (3001)                - OpenWrt
              - OpenClaw
                    ↓
              Cloudflare Tunnel
              henryjin8s.xyz:8080
```

---

## 🎯 **Challenges & Solutions**

### **Challenge 1: Google Custom Search API Not Working**

**Problem:** API returned 403 "Permission Denied"

**Root Cause:** Google discontinued Custom Search JSON API for new customers in 2022.

**Solution:** Switched to Jina AI Reader (r.jina.ai) - free, unlimited!

---

### **Challenge 2: Cloudflare Tunnel 502 Errors**

**Problem:** Domain access returned HTTP 502

**Solution:** Added proxy configuration to cloudflared service

**Key Learning:** Cloudflare API needs proxy to CONNECT, but traffic through tunnel doesn't need proxy.

---

### **Challenge 3: Clash Routing Loop**

**Problem:** Domain worked in private browser tab but not regular tab

**Solution:** Added Cloudflare domains to Clash DIRECT list

---

### **Challenge 4: Dashboard Not Loading**

**Problems:**
1. Frontend fetch missing credentials
2. Login not calling API
3. PM2 cluster mode issues
4. Browser cache

**Solutions:**
1. Added `{credentials: 'include'}` to fetch calls
2. Fixed login to call `/api/login` API
3. Changed PM2 from cluster to fork mode
4. Added no-cache headers to HTML

---

## 📈 **Current Status**

| Service | Status | Access |
|---------|--------|--------|
| **N1 Clash Proxy** | ✅ Running | 192.168.51.2:7890 |
| **Proxy Failover** | ✅ Active | 51.2 → 31.11 |
| **Pi-hole** | ✅ Running | 192.168.51.74:8082 |
| **Pi Dashboard** | ✅ Running | Local + Domain |
| **Uptime Kuma** | ✅ Monitoring | 192.168.51.74:3001 |
| **Cloudflare Tunnel** | ✅ Connected | 3 connections |

---

## 💡 **Key Learnings**

1. **Cloudflare Tunnel** needs proxy to connect (GFW) but not for traffic
2. **Clash routing** - Don't proxy tunneled traffic (creates loops)
3. **Browser cache** - Major source of "works in private tab" issues
4. **Google APIs** - Read documentation carefully (some discontinued)
5. **Jina AI Reader** - Great free alternative for URL fetching
6. **PM2 modes** - Use fork for single-instance apps

---

## 📁 **Files Created**

15+ configuration files, scripts, and documentation files created during this project.

---

## 🎯 **What's Next**

### **Completed** ✅
- [x] N1 Clash proxy setup
- [x] Proxy failover monitoring
- [x] Pi-hole installation
- [x] Pi Dashboard creation
- [x] Uptime Kuma monitoring
- [x] Cloudflare Tunnel setup

### **Optional Future Enhancements** ⏳
- [ ] SearXNG self-hosted search
- [ ] Morning briefing Telegram reports
- [ ] Stock price monitoring
- [ ] More Uptime Kuma monitors

---

## 🔗 **Useful Links**

- [OpenClaw Documentation](https://docs.openclaw.ai)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/)
- [Pi-hole Documentation](https://docs.pi-hole.net/)
- [Uptime Kuma](https://github.com/louislam/uptime-kuma)
- [Jina AI Reader](https://r.jina.ai/)

---

*Thanks for reading! Next Post: Setting Up Pi-hole with Chinese DNS for Stability*

**Last updated:** 2026-03-03 21:42 GMT+8
