---
title: "AWS cost audit in 40 min: the exact CLI commands"
pubDatetime: 2026-03-24T00:00:00Z
tags: [aws, cost, cli]
persona: sauce
description: "The shell script I use to find waste fast — RDS snapshots, unused EIPs, orphaned volumes."
---

Here's the exact workflow I use. No third-party tools, no dashboards — just the AWS CLI and some jq.

## Find old RDS snapshots

```bash
# Snapshots older than 90 days, sorted by size
aws rds describe-db-snapshots \
  --snapshot-type manual \
  --query 'DBSnapshots[?SnapshotCreateTime<=`2025-12-24`].[DBSnapshotIdentifier,SnapshotCreateTime,AllocatedStorage]' \
  --output table
```

Anything in that list that isn't explicitly retained for compliance is waste.

## Find unattached Elastic IPs

```bash
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' \
  --output table
```

Release them:

```bash
# For each AllocationId in the output above:
aws ec2 release-address --allocation-id eipalloc-XXXXXXXX
```

## Find orphaned EBS volumes

```bash
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,CreateTime]' \
  --output table
```

"Available" means unattached. If it's been available for more than a week, it's probably orphaned.

## Find NAT Gateway data transfer spend

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-03-01 \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"USAGE_TYPE","Values":["NatGateway-Bytes"]}}' \
  --metrics "UnblendedCost"
```

If this is non-trivial, add VPC endpoints for S3 and DynamoDB immediately:

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

## EC2 snapshots older than 90 days

```bash
aws ec2 describe-snapshots \
  --owner-ids self \
  --query 'Snapshots[?StartTime<=`2025-12-24`].[SnapshotId,StartTime,VolumeSize]' \
  --output table
```

---

The full audit takes me about 40 minutes on a new account. I usually find $500–$3k in monthly waste on accounts spending $10k+/month.

See the [CXO version](/posts/aws-cost-audit-cxo) for the business framing.
