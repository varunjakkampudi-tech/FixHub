# Mobile approach decision matrix

Status: CONDITIONAL analytical comparison, no final stack/package approval. See [Android](android-feasibility.md), [iOS](ios-feasibility.md), [architecture](../technical/architecture-feasibility.md). Framework sources SRC-032/033 support capability, not FixHub performance.

| Approach | UX/native features | Performance / skill fit | Reuse / maintenance | Time to test / approval / scale |
|---|---|---|---|---|
| Responsive web/PWA | Quick access; OS/channel limitations need testing | Browser/device/network dependent; existing team skills unverified | Highest web reuse; still browser QA | Lowest initial artifact count; does not itself fulfill required store apps; large-device testing remains |
| Capacitor | Web UX plus native plugins for camera/location/push | Plugin/lifecycle quality and team skills untested | Shares web code, native projects maintained | Must test iOS usefulness, permissions, offline/reconnect; approval not guaranteed |
| React Native | More native UI/lifecycle possibilities | Actual skill/performance unknown | Shared mobile code, web/backend contracts separate | Larger learning/QA burden; platform-specific code and stores remain |
| Separate native | Highest direct OS control | Specialist staffing needed | Lowest UI reuse; largest maintenance footprint | Highest device/release overhead; still no approval guarantee |

Provisional research recommendation: compare Capacitor and React Native through EX-P01-05 only when bounded non-production prototype work is separately authorized. PWA is a comparison/control, not a silent removal of Android/iOS. No paid accounts or code authorized now.

## Account and release readiness

Account type/legal identity, D-U-N-S/website, fees, real Android tester continuity where applicable, iOS signing/TestFlight, support contact, privacy/deletion, UGC safety, current SDK deadline, permission denial, device tests and human review are PENDING operational evidence. Published prerequisites can be assessed without claiming an enrolled account.

Assess separate customer/merchant binaries versus unified role client using real workflow complexity, store policies and total cost. Never let packaging change tenant/security boundaries. Final approval belongs Phase03/08; one complete coordinated public release in19 remains mandatory.
