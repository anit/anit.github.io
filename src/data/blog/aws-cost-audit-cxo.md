---
title: "Your AWS bill has a $2k leak. Here's what it looks like."
pubDatetime: 2026-03-24T00:00:00Z
tags: [aws, cost]
persona: cxo
description: "Most growing startups overpay AWS by 10-15%. Here's the pattern I see every time."
---

Three things I find in almost every $10k+/month AWS bill.

## 1. RDS snapshots from six months ago

You ran a migration. You took a snapshot "just in case." Then forgot about it. At $0.10/GB/month, a 500GB snapshot sitting untouched for six months is $300 gone. Multiply by a few devs who all did the same thing.

**Fix:** Automate snapshot retention. 7 days for dev, 30 days for prod. Nothing older survives.

## 2. Elastic IPs nobody's using

Every time you terminate an instance without releasing its Elastic IP, AWS charges you $3.60/month for the privilege of holding that address. It sounds trivial until you have 40 of them.

**Fix:** A one-minute audit with the CLI finds them all. Then release.

## 3. NAT Gateway data transfer

This is the one that surprises people. Your app in a private subnet talks to S3, CloudWatch, DynamoDB — all through the NAT Gateway. At $0.045/GB, a busy service can rack up hundreds per month in transfer fees alone.

**Fix:** VPC endpoints for S3 and DynamoDB are free. This change takes 10 minutes and often saves $500+/month.

---

I run this audit for clients in a half-day engagement, fixed price. If you're spending $10k+/month on AWS and haven't done this recently, the audit almost always pays for itself.

→ [anitrai011@gmail.com](mailto:anitrai011@gmail.com)
