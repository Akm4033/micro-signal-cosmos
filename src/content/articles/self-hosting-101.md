---
title: "Self-Hosting 101: Modern Production Infrastructure on a Budget"
description: "A production-tested blueprint for self-hosting developer services: Docker Compose orchestration, Caddy reverse proxy with automated TLS, Tailscale overlay networking, and restic backups."
slug: "self-hosting-101"
publishDate: "2026-11-04T08:00:00Z"
category: "developer-tools"
author: "marina"
tags: ["Self-Hosting", "DevOps", "Docker", "Linux", "Infrastructure", "Caddy"]
readingTime: "11 min read"
featured: false
hasAffiliateLinks: true
references:
  - title: "Caddy Server Architecture & Automatic HTTPS Documentation"
    source: "Caddy Community"
    url: "https://caddyserver.com/docs/"
  - title: "Restic Backups: Secure, Encrypted, Deduplicated Backups"
    source: "Restic Documentation"
  - title: "Tailscale WireGuard Mesh Architecture"
    source: "Tailscale Engineering Blog"
---

The cloud promises infinite scale and zero operational maintenance. In exchange, development teams and independent founders frequently face astronomical monthly invoices, vendor lock-in, and unpredictable billing models where a single recursive database query or spike in bandwidth can trigger thousands of dollars in surprise cloud costs.

In 2026, self-hosting is undergoing a renaissance. Modern tooling—Docker Compose, Caddy, Tailscale, and automated encrypted backup agents—has eliminated the brittle Bash scripts and complex sendmail configurations of the early 2000s. 

For **$10 to $25 per month**, you can run production-grade infrastructure that easily serves hundreds of thousands of monthly visitors, hosts private Git repositories, vector search nodes, and internal analytics, all on dedicated hardware you control.

---

## 1. Hardware Selection: VPS vs. Bare Metal

When architecting a self-hosted stack, avoid hyperscalers (AWS, Azure, GCP) for compute and bandwidth. Hyperscalers charge up to **$0.09 per gigabyte** of egress bandwidth; dedicated European and American hosters offer multi-terabyte pipes for free.

| Hosting Provider | Typical Spec | Monthly Cost | Bandwidth Included |
|---|---|---|---|
| **AWS EC2 (t4g.xlarge)** | 4 vCPU, 16GB RAM | ~$95 + Egress | 100GB free, then $0.09/GB |
| **DigitalOcean Droplet** | 4 vCPU, 8GB RAM | ~$48 / month | 5 TB included |
| **Hetzner Cloud (CPX31)** | 4 vCPU, 8GB RAM, 160GB NVMe | **~€12 / month** | **20 TB included** |

For reliable, budget-conscious infrastructure, provisioning an Ubuntu 24.04 LTS node on [Hetzner Cloud](https://hetzner.cloud/?ref=microsignal_self-hosting) ★ or [DigitalOcean](https://www.digitalocean.com/?ref=microsignal_self-hosting) ★ provides top-tier hardware economics.

---

## 2. Network Topology & Zero-Trust Access with Tailscale

The most critical rule of modern self-hosting: **Never expose internal administrative dashboards to the public internet.**

Historically, developers used complex OpenVPN gateways or port forwarding. Today, we utilize **Tailscale** (built on the peer-to-peer WireGuard protocol).

```
[Public Internet]
       |
       v (Port 80 / 443 ONLY)
+--------------------------------------------------------+
| Server VPS (Hetzner / DigitalOcean)                    |
|                                                        |
|  [Caddy Reverse Proxy]                                 |
|         |                                              |
|         +--> (app.example.com) --> [Production Web App]|
|                                                        |
|  [Internal Docker Bridge Network]                      |
|         |                                              |
|         +--> (Internal Only) ----> [PostgreSQL DB]     |
|         +--> (Internal Only) ----> [Redis Cache]       |
|                                                        |
|  [Tailscale Daemon (tailscale0)]                       |
|         ^                                              |
|         | WireGuard Mesh (100.x.y.z)                   |
+---------+----------------------------------------------+
          |
    [Developer Laptop] (Access internal Grafana, SSH, & DB directly)
```

Only ports `80` (HTTP) and `443` (HTTPS) are open on the public firewall (`ufw`). SSH (Port 22) and administrative interfaces (Grafana, Portainer, Database GUIs) are bound strictly to the Tailscale interface (`100.x.y.z`), completely insulating your server from automated brute-force scans.

---

## 3. The Reverse Proxy: Why Caddy Replaced Nginx

For over fifteen years, Nginx was the undisputed champion of web reverse proxies. In modern setups, **Caddy** has established itself as the superior choice:

1. **Automatic HTTPS by default**: Caddy automatically requests, provisions, and renews TLS certificates via Let's Encrypt or ZeroSSL.
2. **Human-readable syntax**: A complete reverse proxy with compression, security headers, and health checks takes only 10 lines of declarative config.

```caddyfile
# /etc/caddy/Caddyfile

app.example.com {
    encode gzip zstd
    
    # Secure HTTP Headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Proxy to Docker container
    reverse_proxy localhost:3000 {
        health_uri /healthz
        health_interval 10s
    }
}
```

---

## 4. Declarative Service Orchestration with Docker Compose

Rather than executing ad-hoc `docker run` commands, maintain your entire server configuration in a single Git-versioned repository.

```yaml
# docker-compose.yml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - edge-network

  app:
    image: my-registry/web-service:v1.4.2
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgres://app_user:${DB_PASSWORD}@postgres:5432/app_db
      - REDIS_URL=redis://redis:6379
    networks:
      - edge-network
      - internal-network

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=app_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=app_db
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - internal-network

volumes:
  caddy_data:
  caddy_config:
  pg_data:

networks:
  edge-network:
  internal-network:
    internal: true # Cannot access or be accessed from public internet!
```

---

## 5. Automated Encrypted Backups with Restic

A server without verified backups is not production infrastructure; it is an imminent data catastrophe.

We implement **Restic**, an encrypted, deduplicated, snapshot-based backup tool:
1. Takes a consistent database dump (`pg_dump`).
2. Encrypts data client-side using AES-256 before network transmission.
3. Streams snapshots to remote S3-compatible object storage (e.g., Cloudflare R2 or Backblaze B2).

```bash
#!/usr/bin/env bash
# /opt/scripts/backup.sh
set -euo pipefail

# 1. Dump database
docker compose exec -T postgres pg_dump -U app_user app_db | gzip > /tmp/db_dump.sql.gz

# 2. Backup volumes and database dump to remote storage
export RESTIC_REPOSITORY="s3:https://<account_id>.r2.cloudflarestorage.com/server-backups"
export RESTIC_PASSWORD_FILE="/root/.restic_password"

restic backup /tmp/db_dump.sql.gz /var/lib/docker/volumes/

# 3. Prune snapshots older than 30 days
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 1 --prune

# Cleanup
rm -f /tmp/db_dump.sql.gz
```

Schedule this via a cron job at 03:00 UTC daily. Restoring takes a single command: `restic restore latest --target /`.

---

## Summary Takeaways

1. **Separate public traffic from admin traffic**: Open ports 80/443 to the world via Caddy; access SSH and databases exclusively through Tailscale.
2. **Network isolation is free security**: Place internal databases on an `internal: true` Docker network to prevent accidental port exposure.
3. **Automate encrypted offsite backups**: Use Restic with Cloudflare R2 for zero-egress backup storage.

