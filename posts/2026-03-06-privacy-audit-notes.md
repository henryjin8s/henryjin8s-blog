# 🔒 Website Privacy Audit Notes

**Date:** 2026-03-06  
**Auditor:** AI Assistant  
**Scope:** Public website content review

---

## ✅ **What's Safe (No Changes Needed)**

| Content | Status | Notes |
|---------|--------|-------|
| Personal bio (about.html) | ✅ OK | No sensitive info |
| Work experience | ✅ OK | Public career info |
| Skills/certifications | ✅ OK | Professional info |
| Contact (placeholder) | ✅ OK | No real email/phone |
| Blog post content | ✅ OK | Technical, no secrets |

---

## ⚠️ **What Was Generalized**

### **Network Topology (AI Infra Post)**

**Before (Specific):**
```
Internet → ChinaNet (192.168.1.1) → Redmi (192.168.51.1) → N1 (192.168.51.2)
                                              ↓
                                        Pi5 (192.168.51.74)
```

**After (General):**
```
Internet → Main Router → Secondary Router → Proxy Server
                              ↓
                        Pi Server
                        - Pi-hole
                        - Dashboard
                        - Monitoring
```

**Why:** Specific IPs reveal internal network structure.

---

### **Service Ports**

**Before:** Listed exact ports (7890, 8080, 8082, 3001)  
**After:** "Standard ports" or "configured ports"

**Why:** Port scanning + known services = attack surface.

---

### **Proxy Configuration**

**Before:** Specific proxy IP and credentials format  
**After:** "Configured proxy server" (no IPs)

**Why:** Proxy details = network access info.

---

## 🔐 **What's NOT on Website (Good!)**

- ✅ No API keys
- ✅ No passwords
- ✅ No SSH keys
- ✅ No Telegram bot tokens
- ✅ No Cloudflare credentials
- ✅ No real email addresses
- ✅ No phone numbers
- ✅ No physical address

---

## 📋 **Recommendations**

### **For Technical Posts**

1. ✅ **Use generic IPs** - `192.168.x.x` instead of `192.168.51.74`
2. ✅ **Omit exact ports** - "web interface" not "port 8080"
3. ✅ **Generalize topology** - "router → switch → devices"
4. ✅ **No credentials** - Even example passwords
5. ✅ **Domain OK** - Public domains are fine (henryjin8s.xyz)

### **For About/Resume**

1. ✅ **City level** - "Toronto" OK, not street address
2. ✅ **Company names** - Public info, OK to list
3. ✅ **Dates** - Employment dates fine
4. ✅ **Technologies** - Skills are meant to be public

---

## 🎯 **Privacy Philosophy**

**Public Website = Marketing + Portfolio**

**DO Share:**
- Skills and expertise
- Project experience (high-level)
- Contact methods (email, LinkedIn)
- Public domains/projects

**DON'T Share:**
- Internal network details
- Credentials (even examples)
- Physical addresses
- Private infrastructure configs

---

## 📁 **Files Reviewed**

| File | Status | Changes |
|------|--------|---------|
| index.html | ✅ OK | None needed |
| about.html | ✅ OK | None needed |
| AI infra post | ⚠️ Updated | Generalized network |
| Pi-hole post | ⚠️ Updated | Removed specific IPs |
| Cloudflare post | ⚠️ Updated | Generic config examples |
| New OCR post | ✅ New | Privacy-safe by design |
| New CVE post | ✅ New | Security-focused, safe |

---

## 🔧 **Ongoing Maintenance**

**Before Publishing:**
1. Search for IP addresses: `grep -r "192\.168\." posts/`
2. Search for ports: `grep -r ":[0-9]\{4\}" posts/`
3. Check for credentials: `grep -ri "password\|token\|key" posts/`
4. Review network diagrams

**Quarterly:**
- Review all public content
- Update outdated info
- Check for accidental leaks

---

*This audit ensures the website is informative without compromising security.*

*Last reviewed: 2026-03-06*
