# Merchant density and capacity model

Status: explicit class5 offline assumption; no verified supply. Owner: operations/research lead. Inputs must be replaced by [merchant observations](merchant-results.md).

For each category-zone-time bucket: bookable weekly technician hours = technicians × available hours × availability factor. Capacity = floor(bookable hours / (job + travel + inspection + buffer hours)). Cap utilization at assumed60% for burst/rework headroom; capacity after largest provider unavailable must still meet the target bucket. Shared staff cannot be counted in two buckets simultaneously.

Illustration only:3 independent businesses ×1 technician ×24 h/week ×0.7 availability ×0.6 utilization /2.5 h per job =12 whole jobs/week. Losing one leaves8. At expected10 jobs/week this fails resilience; adding providers, narrowing hours or revising demand is necessary. These numbers are not Tanuku measurements or a promise of a ten-job market.

Economic scenarios' completed jobs per month require aggregate capacity and category/zone allocation; division by4.33 weeks is a planning convention. Pooling all categories would conceal electrician shortage, so do not use the total as proof of sufficiency.

## Validation needs

Measure skills/task exclusions, real hours, simultaneous assignments, travel medians/tails, parts availability, repeat-work rate and seasonal outage. Track count of independent businesses separately from technicians. Free registration does not remove onboarding/support cost or guarantee acceptance.

No automatic guaranteed arrival, fixed SLA, expanded zones or24/7 coverage. Reject category launch if losing a provider causes a staffing cliff or safe scope cannot be served. [Staffing](../operations/capacity-and-staffing.md).
