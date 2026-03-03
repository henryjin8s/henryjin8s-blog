# 🛡️ Setting Up Pi-hole with Chinese DNS for Stability

**Published:** 2026-03-03  
**Reading Time:** 10 minutes  
**Tags:** #pihole #dns #networking #selfhosted

---

## 📋 **Overview**

Pi-hole is a popular DNS ad-blocker, but most tutorials recommend using Google DNS (8.8.8.8) or Cloudflare (1.1.1.1). For users in China, this creates a dependency on proxies.

**Our Solution:** Use Chinese DNS servers that work reliably without proxy!

---

## 🎯 **Why Chinese DNS?**

| DNS Provider | IPs | Latency | Needs Proxy? |
|--------------|-----|---------|--------------|
| **Google** | 8.8.8.8 | ~200ms | ❌ Blocked |
| **Cloudflare** | 1.1.1.1 | ~180ms | ❌ Blocked |
| **114DNS** | 114.114.114.114 | ~10ms | ✅ No |
| **AliDNS** | 223.5.5.5 | ~15ms | ✅ No |
| **BaiduDNS** | 180.76.76.76 | ~20ms | ✅ No |

**Benefits:**
- ✅ Fast response (~10-20ms vs ~200ms)
- ✅ Works without proxy
- ✅ Reliable even if proxies go down
- ✅ No GFW interference

---

## 🚀 **Installation**

### **Step 1: Install Docker (if not installed)**

```bash
curl -fsSL https://get.docker.com | sh
```

### **Step 2: Run Pi-hole Container**

```bash
docker run -d \
  --name pihole \
  -p 53:53/tcp -p 53:53/udp \
  -p 67:67/udp \
  -p 8082:80/tcp \
  -e TZ="Asia/Shanghai" \
  -e WEBPASSWORD="pihole123" \
  -e DNS1="114.114.114.114" \
  -e DNS2="223.5.5.5" \
  -e DNS3="180.76.76.76" \
  -v /home/henry/pihole/etc-pihole:/etc/pihole \
  -v /home/henry/pihole/etc-dnsmasq.d:/etc/dnsmasq.d \
  --restart=unless-stopped \
  pihole/pihole:latest
```

### **Step 3: Access Admin Interface**

```
http://192.168.51.74:8082/admin
Password: pihole123
```

---

## ⚙️ **Configuration**

### **Upstream DNS Servers**

In Pi-hole admin panel:
```
Settings → DNS

Upstream DNS Servers:
☑ 114.114.114.114 (114DNS)
☑ 223.5.5.5 (AliDNS)
☑ 180.76.76.76 (BaiduDNS)
```

### **DNS Performance**

| Metric | Value |
|--------|-------|
| **Query Time** | ~10ms |
| **Blocked Domains** | 100,000+ |
| **Cache Hit Rate** | ~30% |

---

## 🔧 **Testing**

### **Test DNS Resolution**

```bash
# Test from any device
nslookup www.baidu.com 192.168.51.74
nslookup www.taobao.com 192.168.51.74

# Test ad blocking
nslookup ads.google.com 192.168.51.74
# Should return 0.0.0.0 (blocked)
```

### **Test Failover**

```bash
# Stop N1 proxy
ssh root@192.168.51.2
/etc/init.d/openclash stop

# DNS should still work!
nslookup www.baidu.com 192.168.51.74
# ✅ Still works (Chinese DNS doesn't need proxy)
```

---

## 📊 **Performance Comparison**

### **Before (Google DNS via Proxy)**
```
Query Time: ~200ms
Dependency: Proxy must be working
Reliability: ❌ Fails if proxy down
```

### **After (Chinese DNS Direct)**
```
Query Time: ~10ms (20x faster!)
Dependency: None
Reliability: ✅ Works even if proxies down
```

---

## 🎯 **Key Design Decisions**

### **1. Why Not Use Proxy for DNS?**

**Problem:** If proxy goes down, DNS stops working → No internet at all!

**Solution:** Direct DNS queries to Chinese servers → Always works!

### **2. Why Multiple DNS Servers?**

**Redundancy:** If one DNS server fails, others still work.

**Configuration:**
```
Primary:   114.114.114.114 (114DNS)
Secondary: 223.5.5.5 (AliDNS)
Tertiary:  180.76.76.76 (BaiduDNS)
```

### **3. Why Docker Instead of Native Install?**

**Benefits:**
- ✅ Easy to backup (just copy volume)
- ✅ Easy to migrate
- ✅ Doesn't interfere with system packages
- ✅ Easy to update

---

## 📁 **File Structure**

```
/home/henry/pihole/
├── etc-pihole/          # Pi-hole configuration
│   ├── setupVars.conf
│   ├── dhcp.leases
│   └── ...
└── etc-dnsmasq.d/       # DNSMasq configuration
    └── 01-pihole.conf
```

---

## 🔧 **Maintenance**

### **Update Pi-hole**

```bash
docker exec pihole pihole -up
```

### **Update Blocklists**

```bash
docker exec pihole pihole -g
```

### **Backup Configuration**

```bash
tar -czf pihole-backup-$(date +%Y%m%d).tar.gz /home/henry/pihole/
```

### **Restore from Backup**

```bash
tar -xzf pihole-backup-YYYYMMDD.tar.gz -C /
docker restart pihole
```

---

## 📈 **Monitoring**

### **Pi-hole Stats**

Access admin panel: `http://192.168.51.74:8082/admin`

**Key Metrics:**
- Total queries
- Queries blocked
- Top blocked domains
- Top clients
- Query types

### **Uptime Kuma Integration**

Added Pi-hole DNS as monitor:
```
Type: DNS
Hostname: 192.168.51.74
Interval: 60 seconds
```

---

## 🎯 **Troubleshooting**

### **Issue: DNS Not Resolving**

**Check:**
```bash
# Is container running?
docker ps | grep pihole

# Check logs
docker logs pihole

# Test DNS directly
dig @114.114.114.114 www.baidu.com
```

### **Issue: Ads Not Blocked**

**Check:**
```bash
# Update blocklists
docker exec pihole pihole -g

# Check DNS settings
docker exec pihole pihole status dns
```

---

## 💡 **Lessons Learned**

1. **Use local DNS servers** when possible (faster, more reliable)
2. **Don't depend on proxy for DNS** (single point of failure)
3. **Multiple upstream DNS** for redundancy
4. **Docker makes backup easy** (just copy volumes)
5. **Monitor DNS performance** (query time, cache hit rate)

---

## 🔗 **Useful Links**

- [Pi-hole Official Docs](https://docs.pi-hole.net/)
- [114DNS](http://www.114dns.com/)
- [AliDNS](https://www.alidns.com/)
- [BaiduDNS](https://dns.baidu.com/)

---

**Next Post:** [Cloudflare Tunnel Setup for Remote Access](/posts/cloudflare-tunnel-setup.html)

*Last updated: 2026-03-03 21:45 GMT+8*
