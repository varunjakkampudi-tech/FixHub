# LOW / BASE / HIGH scenarios

Status: uncalibrated assumptions; NOT forecasts. [Inputs](model-assumptions.json), [formulas](unit-economics.md). Results recalculated locally2026-10-16 after public Meta India list-rate retrieval; INR rounded to2 decimals for ratios. Expected job counts can be fractional, not invented actual jobs.

| Monthly measure | LOW | BASE | HIGH |
|---|---:|---:|---:|
| Requests |400|1,200|3,000|
| Acceptance |40%|65%|80%|
| Completion of accepted |70%|85%|90%|
| Completed jobs |112|663|2,160|
| Accepted noncompletion |48|117|240|
| Average job value |800|1,200|1,500|
| Effective fee/completion |60|120|150|
| GTV |89,600|795,600|3,240,000|
| Platform revenue |6,720|79,560|324,000|
| WhatsApp variable bill (Meta + assumed Twilio fee) |2,376|7,128|17,820|
| SMS |50|150|375|
| Acquisition customer/merchant |21,600 /1,400|28,800 /1,500|45,000 /1,800|
| Verification |600|900|900|
| Support hours / cost |25 /4,500|36 /6,480|50 /9,000|
| Dispute reserve |2,800|9,945|21,600|
| Total variable |33,326|54,903|96,495|
| Fixed |21,000|21,000|35,500|
| Contribution/request |−66.52|20.55|75.84|
| Contribution/completed job |−237.55|37.19|105.33|
| Operating result |−47,606|3,657|192,005|
| Monthly burn |47,606|0|0|
| Runway on assumed₹300,000 operating cash |6.30 months|No modeled burn|No modeled burn|
| Break-even requests in unchanged cost tier |None within bound|1,023|469|

HIGH break-even at469 is mathematical under HIGH's stronger fee/conversion/coefficient assumptions, not evidence that a small market becomes HIGH. Monthly jobs do not establish merchant capacity.

## Sensitivity: monthly operating result

| Change (one at a time) | LOW | BASE | HIGH |
|---|---:|---:|---:|
| Acceptance20% lower relative |−48,390|−10,266|131,525|
| Completion10% lower relative/no-shows |−47,998|−3,304.50|161,765|
| Meta and Twilio message fees plus support unit costs doubled |−54,482|−9,951|165,185|
| No free service-message allowance (same as conservative baseline) |−47,606|3,657|192,005|

The “no free allowance” row equals the conservative model baseline because it applies zero Meta service allowance; it is not an independent stress. Twilio fee is a dated public list input, not a Fix Hub quote; assumed USD/INR and 11 messages/request are not verified. Acquisition/collection and support dominate these inputs; WhatsApp account eligibility, classifications, tax/BSP terms and the service-pricing source conflict remain mandatory dependencies. Fees, mix, tax and wage/safety costs may overturn BASE. Require observed demand, supply, collection and conservative all-in cost before any capital commitment.
