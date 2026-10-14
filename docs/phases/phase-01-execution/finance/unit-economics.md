# Unit economics and reproducible calculation

Status: class5 offline model, not demand evidence, agreed fees or financial clearance. Run from repository root: `node scripts/phase-01-model.mjs`. Inputs: [editable JSON](model-assumptions.json); outputs/formulas are exercised by `node scripts/test-phase-01-model.mjs`.

Accepted=N×acceptance. Completed=accepted×completion-given-acceptance. Unaccepted=N−accepted; accepted-not-completed=accepted−completed. The model labels this latter aggregate cancellation/noncompletion, not a separately measured cancellation rate. No-shows are a sensitivity, not double-counted as another independent baseline loss.

GTV=completed×average-job-value. Platform revenue=completed×effective-fee. This assumes collectible fees: actual billing/bad-debt/collection-channel feasibility is unverified; adjust effective fee downward for leakage.

Variable cost=customer acquisition + merchant acquisition + verification + support labour + WhatsApp + SMS + expected dispute reserve. Customer acquisition=N×new-customer-share×CAC; new merchants=N×new-merchants-per-request. Support=N×case-share×minutes/60×hourly-cost. Dispute reserve is economic exposure, not an approved refund guarantee. Fixed cost=hosting/database + storage + monitoring + BSP allowance + operations + maintenance.

Contribution=platform revenue−variable cost; per-request and per-completed-job divide by their own denominators. Operating result=contribution−fixed cost. Burn=max(0,−result); runway=assumed operating cash/burn. A null runway means no modeled burn, NOT infinite cash or proved sustainability. Build/legal spending, GST liability, payment processing and full founder salary are excluded until scoped; therefore surplus is not net profit.

WhatsApp assumes4 utility+1 authentication+6 service messages per request, all categories at₹0.145, with1,000 service messages free per month. The numeric rate is an UNVERIFIED provider-reported stress proxy, not an effective Meta India rate. The service allowance/October charging rule is confirmed by official FAQ SRC-040, while detailed rates/tax/utility billing still need verification. SMS0.5/request×₹0.25 is an assumed fallback cost, no provider selected. Taxes/BSP terms unknown. [Conflict and account gate](../integrations/whatsapp-feasibility.md).

Break-even is smallest integer request volume with nonnegative operating result, including allowance boundary, under unchanged scenario coefficients and fixed-cost tier; null means no crossing below10 million. Never extrapolate the tier to a million real jobs without scaling costs. Modelled cash₹300,000 and FX₹85/USD are editable assumptions, not available owner funds/current spot rate.
