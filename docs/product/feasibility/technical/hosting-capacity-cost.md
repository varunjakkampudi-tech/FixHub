# Hosting, capacity and cost options

Status: budget assessment CONDITIONAL; measured capacity, production recovery and vendor region NOT ASSESSED. Sources SRC-034/035; estimates in [finance](../finance/build-and-operating-costs.md).

| Deployment option | Benefit | Cost/risk boundary |
|---|---|---|
| Managed API/worker + managed PostgreSQL/PostGIS + private storage | Lower patch/backup burden; separate worker retries | Itemized API/worker/db/storage/egress/log/backups and region/DPA quote needed |
| Single VM + PostgreSQL/worker | Potential lower bill, common tx boundary | Founder patching, monitoring, restore, failover and security workload; no VM quote or operation proof |
| Managed Postgres service plus separate runtime | PublishedUSD25 DB benchmark exists | DB price alone omits API, worker, object backups and operations; supported PostGIS/region verify |
| Multi-service/cluster early | Isolation options | Not justified by measured load; higher cost/ops; not selected |

Traffic estimates are scenario assumptions, not population-derived load. BASE1,200 requests/month ≈40/day says nothing about burst dispatch fanout, realtime sockets, photo egress or retry storms. Size for concurrent commands, eligible merchants per request, peak offers/sec, pool/lock contention, outbox backlog and upload sizes. No latency/SLO/RPO/RTO target approved merely by a price tier.

Capacity plan: measure request and transaction latency percentiles, failover behavior, queue age, connection use, storage/egress, and redacted monitoring cost with bounded tests when authorized. Private upload scans and deletion/hold obligations need operational funding.

Database backups do not imply object restoration or rehearsed recovery. Region/legal log availability, off-device backup and restore evidence must be verified. Never use free-tier limits as production assurance. Quotes and paid provisioning remain human-authorized.
