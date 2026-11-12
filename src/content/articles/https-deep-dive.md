---
title: "HTTPS Deep Dive: TLS 1.3, Public Key Infrastructure, and Modern Web Cryptography"
description: "An in-depth systems exploration of TLS 1.3: 1-RTT cryptographic handshakes, Diffie-Hellman key exchanges, X.509 certificate chains, and mutual TLS (mTLS)."
logo: "shield"
slug: "https-deep-dive"
publishDate: "2026-11-09T08:30:00Z"
updatedDate: "2026-11-09T17:00:00Z"
category: "developer-tools"
author: "marina"
tags: ["Cryptography", "TLS 1.3", "HTTPS", "Cybersecurity", "Networking", "DevOps"]
readingTime: "11 min read"
featured: false
hasAffiliateLinks: true
references:
  - title: "The Transport Layer Security (TLS) Protocol Version 1.3"
    source: "Internet Engineering Task Force (IETF RFC 8446)"
    url: "https://datatracker.ietf.org/doc/html/rfc8446"
  - title: "Certificate Transparency Infrastructure"
    source: "RFC 6962 / Google Security"
  - title: "Bulletproof TLS and PKI (2nd Edition)"
    source: "Ivan Ristić (Feisty Duck)"
---

Every time you type a URL into a browser address bar or invoke an API endpoint via `curl`, an intricate cryptographic dance occurs in under 50 milliseconds. Long before a single byte of HTTP JSON or HTML payload traverses the wire, your computer and a remote edge server negotiate cipher parameters, execute asymmetric mathematical exchanges, verify cryptographic certificate chains against hardware trust stores, and derive ephemeral symmetric encryption keys.

Transport Layer Security (TLS) is the invisible cryptographic bedrock of the internet. Here is an exhaustive, byte-level breakdown of how **TLS 1.3** and modern Public Key Infrastructure (PKI) actually protect web traffic.

---

## 1. The 1-RTT Handshake in TLS 1.3

Under TLS 1.2, establishing a secure connection required **two full round trips (2-RTT)** between client and server before application data could be transmitted. 

**TLS 1.3 (RFC 8446)** overhauled the protocol to enforce **1-RTT (Single Round Trip)** as standard, with optional **0-RTT session resumption**.

```
Client                                                   Server
  |                                                        |
  | -------- ClientHello (Key Share: ECDH Public Key) ---> |
  |          Supported Ciphers, Protocol Version           |
  |                                                        |
  | <------- ServerHello (Key Share: ECDH Public Key) ---- |
  |          Chosen Cipher Suite (e.g. AES_256_GCM)        |
  | <------- {EncryptedExtensions} ----------------------- |
  | <------- {Certificate: Server X.509 Chain} ----------- |
  | <------- {CertificateVerify: Digital Signature} ------ |
  | <------- {Finished} ---------------------------------- |
  |                                                        |
  | ======= Connection Secured (Symmetric AES-GCM) ======= |
  |                                                        |
  | -------- [Application Data: HTTP GET /index.html] ---> |
  | <------- [Application Data: HTTP 200 OK Response] ---- |
```

### Why TLS 1.3 Handshakes are Dramatically Faster

In TLS 1.3, the client doesn't ask the server what key-exchange mechanisms it supports and wait for a reply. Instead, the client **guesses** that the server supports common modern curves (e.g., X25519) and immediately sends its ephemeral Diffie-Hellman public key share directly inside the very first `ClientHello` packet!

By the time the client receives the `ServerHello`, both parties can independently compute the shared secret:

$$K_{\text{shared}} = \text{ECDH}(SK_{\text{client}}, PK_{\text{server}}) = \text{ECDH}(SK_{\text{server}}, PK_{\text{client}})$$

All subsequent handshake messages (including the server's certificate itself!) are fully encrypted.

---

## 2. Perfect Forward Secrecy (PFS)

In older SSL/TLS deployments, servers frequently used static RSA key exchanges: the client encrypted a pre-master secret using the server's static RSA public key found on its certificate.

> **The Severe Vulnerability of Static RSA**: If an adversary tapped fiber cables and recorded encrypted traffic for ten years, and subsequently compromised the server's private key via a physical breach or subpoena, they could retroactively decrypt every historical petabyte of recorded communication.

**TLS 1.3 completely banned static RSA key exchanges.** It mandates **Ephemeral Diffie-Hellman (ECDHE)**:
1. Every new connection generates a temporary, single-use key pair in memory.
2. Once the session terminates, the ephemeral private keys are erased from RAM.
3. Even if the server's root private key is compromised in the future, past encrypted sessions remain mathematically impossible to decrypt.

---

## 3. Public Key Infrastructure (PKI) & X.509 Chains

How does a client verify that the public key it received genuinely belongs to `example.com` and not an ISP interceptor or malicious rogue proxy?

The answer is the **Hierarchical Trust Chain**:

```
[Root Certificate Authority (CA)] (e.g. Let's Encrypt ISRG Root X1)
  - Hardcoded directly in Operating System / Browser Hardware Trust Stores
  - Signs Intermediate CAs
        |
        v
[Intermediate Certificate Authority] (e.g. Let's Encrypt R3)
  - Kept in secure hardware security modules (HSMs)
  - Signs Leaf / End-Entity Certificates
        |
        v
[Leaf Server Certificate] (e.g. Signal Insight.internal)
  - Contains Subject Alternative Names (SAN)
  - Contains Server Public Key
  - Valid for 90 days
```

When a browser connects, it parses the server's X.509 certificate and verifies that every cryptographic signature recursively chains back to an authoritative root certificate installed in its local operating system trust store.

---

## 4. Certificate Transparency (CT): Catching Rogue CAs

In 2011, a Dutch Certificate Authority (DigiNotar) was compromised by state-sponsored actors, who generated fraudulent certificates for `*.google.com` to spy on hundreds of thousands of users.

To prevent silent CA compromises, Google pioneered **Certificate Transparency (RFC 6962)**:
- Every public CA must submit newly issued certificates to public, append-only, tamper-proof **Merkle Tree cryptographic logs**.
- Browsers (including Chrome and Safari) reject any TLS certificate that does not contain cryptographic proof (**Signed Certificate Timestamps, or SCTs**) confirming it was logged publicly.
- Domain owners monitor these public transparency logs in real-time, detecting unauthorized rogue certificates within minutes of issuance.

---

## 5. Mutual TLS (mTLS) for Zero-Trust Microservices

In standard public web browsing, only the server proves its identity (One-Way TLS).

In modern distributed microservice architectures, services cannot trust internal networks. We implement **Mutual TLS (mTLS)**:
- The server presents its certificate to the client.
- The client presents an identity certificate signed by an internal private CA (e.g., HashiCorp Vault, Smallstep, or SPIFFE/SPIRE).
- Both parties mutually authenticate each other before any RPC payload is transmitted.

```caddyfile
# Enabling strict mTLS in Caddy for internal microservice RPC
api-internal.local {
    tls {
        client_auth {
            mode require_and_verify
            trusted_ca_cert_file /etc/ssl/internal_ca.crt
        }
    }
    reverse_proxy localhost:8080
}
```

For teams looking to deploy secure reverse proxies, configure modern TLS parameters, and automate certificate renewals with zero downtime, open-source solutions like Caddy paired with developer tools from [1Password](https://1password.com/?aff=signalinsight_https-deep-dive) ★ provide robust secrets and key infrastructure management.

---

## Summary Takeaways

1. **TLS 1.3 is 1-RTT by default**: Ephemeral key shares are packaged inside the initial ClientHello to halve connection latency.
2. **Forward secrecy is mandatory**: Ephemeral Diffie-Hellman ensures that past communications can never be retroactively decrypted.
3. **Certificate Transparency keeps the web honest**: Public Merkle tree logs make stealth certificate forgery mathematically detectable.

