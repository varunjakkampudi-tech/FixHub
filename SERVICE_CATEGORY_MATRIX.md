# FixHub24 — Service Category & Readiness Matrix (EH-23)

**Project:** FixHub24 (Viswatra)  
**Launch Geography:** Tanuku Municipal Region, Andhra Pradesh  
**Specification:** `FixHub24-Product-Spec-v1.3.md` (Section 2 & EH-23)  
**Audit Commit:** `554fde9`  

---

## 1. Category Readiness Checklist (EH-23 Criteria)

Before any service category is enabled for customer bookings in Tanuku, it must satisfy seven readiness conditions:
1. **Supply Density:** Minimum 3 verified, active merchants with licensed technicians in Tanuku.
2. **Inspection Pricing Baseline:** Approved flat inspection fee disclosed in Price Clarity Card.
3. **Safety & Tool Verification:** Safety equipment compliance (insulated tools, safety goggles, pressure gauges).
4. **Bilingual Terminology:** Service tasks translated accurately into standard Telugu and Tanuku colloquial terms.
5. **Quote Itemization Template:** Standard parts and labor taxonomy configured in merchant quote builder.
6. **Dispute Protocol:** Defined resolution parameters for common customer complaints.
7. **Operational Health:** Emergency support routing active.

---

## 2. Launch Service Categories

### 2.1 Category: Electrician (`electrician`)
- **Status:** **ACTIVE / READY FOR TANUKU LAUNCH**
- **Inspection Fee Baseline:** ₹149 (disclosed upfront; credited towards labor if quote accepted)
- **Common Tasks & Subcategories:**
  - Ceiling fan repair, replacement & rewinding
  - Main switchboard, MCB tripping, fuse box replacement
  - House wiring inspection & short-circuit repair
  - Inverter & domestic battery backup installation
  - Geyser & water heater electrical connection
- **Bilingual Service Nomenclature:**
  - *English:* Electrician Services
  - *Telugu:* ఎలక్ట్రీషియన్ సేవలు (ఫ్యాన్, వైరింగ్, స్విచ్‌బోర్డు రిపేర్లు)
- **Safety Standard:** 1000V VDE insulated tools, voltage tester verification, rubber sole shoes.
- **Tanuku Coverage Zones:** Tanuku-Central, Tanuku-East, Tetali, Sajjapuram, Undrajavaram Road.
- **Readiness Checklist Assessment:** 7/7 criteria satisfied.

---

### 2.2 Category: Plumbing (`plumbing`)
- **Status:** **ACTIVE / READY FOR TANUKU LAUNCH**
- **Inspection Fee Baseline:** ₹149
- **Common Tasks & Subcategories:**
  - Pipe leakage, joint soldering, CPVC/UPVC line replacement
  - Bathroom faucet, shower valve, tap gland repair
  - Overhead water tank cleaning and float ball valve replacement
  - Clogged drain, sink trap, and sewer line clearance
  - Water motor / submersible pump installation
- **Bilingual Service Nomenclature:**
  - *English:* Plumbing Services
  - *Telugu:* ప్లంబింగ్ సేవలు (పైపు లీకేజీ, మోటారు, ట్యాంక్ మరమ్మతులు)
- **Safety Standard:** Pipe wrenches, thread seal tape, pressure relief testing, non-slip footwear.
- **Tanuku Coverage Zones:** Tanuku-Central, Tanuku-West, Sajjapuram, Relangi Road.
- **Readiness Checklist Assessment:** 7/7 criteria satisfied.

---

### 2.3 Category: Air Conditioning (`ac`)
- **Status:** **ACTIVE / READY FOR TANUKU LAUNCH**
- **Inspection Fee Baseline:** ₹249 (higher diagnostic scope)
- **Common Tasks & Subcategories:**
  - Split / Window AC cooling coil inspection & deep foam jet service
  - Refrigerant (gas) pressure testing and leak detection
  - Dual run capacitor and relay replacement
  - Indoor unit PCB circuit repair
  - AC uninstallation, relocation, and wall bracket mounting
- **Bilingual Service Nomenclature:**
  - *English:* AC Service & Repair
  - *Telugu:* ఏసీ సర్వీసింగ్ & రిపేర్లు (కూలింగ్ కాయిల్, గ్యాస్ లీక్)
- **Safety Standard:** Refrigerant manifold gauges, vacuum pump, nitrogen testing cylinder, earthing check.
- **Tanuku Coverage Zones:** Full Tanuku Municipal Limits.
- **Readiness Checklist Assessment:** 7/7 criteria satisfied.

---

### 2.4 Category: Home Appliances (`appliance`)
- **Status:** **ACTIVE / READY FOR TANUKU LAUNCH**
- **Inspection Fee Baseline:** ₹199
- **Common Tasks & Subcategories:**
  - Washing machine drum vibration, drain pump error
  - Refrigerator compressor humming, defrost failure
  - Microwave oven heating magnetron repair
  - RO Water purifier filter cartridge replacement
- **Bilingual Service Nomenclature:**
  - *English:* Appliance Repair
  - *Telugu:* గృహోపకరణాల రిపేర్లు (వాషింగ్ మెషీన్, ఫ్రిజ్, ఆర్వో ప్యూరిఫైయర్)
- **Safety Standard:** ESD wrist straps, multimeter diagnostic probes, safe high-voltage capacitor discharge tools.
- **Tanuku Coverage Zones:** Tanuku-Central, Tanuku-East, Tetali, Peravali Road.
- **Readiness Checklist Assessment:** 7/7 criteria satisfied.

---

## 3. Operations Administration Table

| Category Slug | Display Name (EN) | Display Name (TE) | Base Fee | Status | Active Merchants | Active Techs |
|---|---|---|---|---|---|---|
| `electrician` | Electrician | ఎలక్ట్రీషియన్ | ₹149 | ACTIVE | 4 | 7 |
| `plumbing` | Plumbing | ప్లంబింగ్ | ₹149 | ACTIVE | 3 | 5 |
| `ac` | AC Service | ఏసీ సర్వీసింగ్ | ₹249 | ACTIVE | 3 | 4 |
| `appliance` | Appliance Repair | ఉపకరణాల రిపేర్లు | ₹199 | ACTIVE | 2 | 3 |
