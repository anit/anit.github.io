---
title: "AWS cost audit in 40 minutes: the $2k leak, and the exact commands to find it"
pubDatetime: 2026-03-24T00:00:00Z
tags: [aws, cost, cli]
description: "Most growing startups overpay AWS by 10-15%. Here's the pattern I see every time, and the CLI commands I run to find it in 40 minutes flat."
---

Three things I find in almost every $10k+/month AWS bill.

## 1. RDS snapshots from six months ago

You ran a migration. You took a snapshot "just in case." Then forgot about it. At $0.10/GB/month, a 500GB snapshot sitting untouched for six months is $300 gone. Multiply by a few devs who all did the same thing.

**Fix:** Automate snapshot retention. 7 days for dev, 30 days for prod. Nothing older survives.

```bash
# Snapshots older than 90 days, sorted by size
aws rds describe-db-snapshots \
  --snapshot-type manual \
  --query 'DBSnapshots[?SnapshotCreateTime<=`2025-12-24`].[DBSnapshotIdentifier,SnapshotCreateTime,AllocatedStorage]' \
  --output table
```

Anything in that list that isn't explicitly retained for compliance is waste. The same pattern applies to raw EC2 snapshots:

```bash
aws ec2 describe-snapshots \
  --owner-ids self \
  --query 'Snapshots[?StartTime<=`2025-12-24`].[SnapshotId,StartTime,VolumeSize]' \
  --output table
```

## 2. Elastic IPs nobody's using

Every time you terminate an instance without releasing its Elastic IP, AWS charges you $3.60/month for the privilege of holding that address. It sounds trivial until you have 40 of them.

**Fix:** A one-minute audit with the CLI finds them all. Then release.

```bash
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' \
  --output table
```

```bash
# For each AllocationId in the output above:
aws ec2 release-address --allocation-id eipalloc-XXXXXXXX
```

While you're in there, check for orphaned EBS volumes too:

```bash
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,CreateTime]' \
  --output table
```

"Available" means unattached. If it's been available for more than a week, it's probably orphaned.

## 3. NAT Gateway data transfer

This is the one that surprises people. Your app in a private subnet talks to S3, CloudWatch, DynamoDB — all through the NAT Gateway. At $0.045/GB, a busy service can rack up hundreds per month in transfer fees alone.

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-03-01 \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"USAGE_TYPE","Values":["NatGateway-Bytes"]}}' \
  --metrics "UnblendedCost"
```

**Fix:** VPC endpoints for S3 and DynamoDB are free. This change takes 10 minutes and often saves $500+/month.

```bash
# Get your VPC and route table IDs first
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[?IsDefault==`false`].VpcId' --output text | head -1)
RT_ID=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[0].RouteTableId' --output text)

# Create S3 endpoint (free)
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --service-name com.amazonaws.ap-south-1.s3 \
  --route-table-ids $RT_ID

# Create DynamoDB endpoint (free)
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --service-name com.amazonaws.ap-south-1.dynamodb \
  --route-table-ids $RT_ID
```

---

No third-party tools, no dashboards — just the AWS CLI and some jq. The full audit takes about 40 minutes on a new account, and I usually find $500–$3k in monthly waste on accounts spending $10k+/month. I also run this for clients as a half-day, fixed-price engagement — if you're spending $10k+/month on AWS and haven't done this recently, it almost always pays for itself.

→ [anitrai011@gmail.com](mailto:anitrai011@gmail.com)
