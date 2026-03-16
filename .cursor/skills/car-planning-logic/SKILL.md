---
name: car-planning-logic
description: Plan recommendation logic for car insurance users based on make, model, variant, pincode, and other factors. Use when the user mentions car insurance plans, car plan recommendations, motor plan selection, car pricing logic, or wants to define how car insurance plans are recommended to users.
---

# Car Planning Logic

## Purpose

This document defines all rules and steps involved in guiding a customer through a car insurance purchase. It captures:

- The input variables to consider when assessing the customer's vehicle and profile
- The plans to recommend and what each plan means
- The add-ons to display and what each add-on means
- The meaning of key clauses and terms such as inspection, IDV, NCB, etc.
- The end-to-end flow designed to result in a completed sale

## Preliminary Checks

These checks are performed immediately after the user enters a registration number, before any plan recommendation or pricing logic is triggered.

### 1. Vehicle Already Insured with ACKO — Same User

**Condition:** The registration number is linked to an active ACKO policy that belongs to the currently logged-in user's account.

**Behaviour:**
- Inform the user: _"This vehicle is already insured with ACKO."_
- Present two options:
  - **View my running policy** — Navigate the user to their existing policy details.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

### 2. Vehicle Already Insured with ACKO — Different Customer

**Condition:** The registration number is linked to an active ACKO policy that belongs to a **different** user's account.

**Behaviour:**
- Inform the user: _"This vehicle is already insured with ACKO. The policy belongs to the account associated with phone number xxxx5511."_
- Present three options:
  - **I am buying this car and want to check insurance** — Treat this as a new purchase journey for the user; proceed into the car insurance flow with this registration number.
  - **Login with the other phone number to manage this policy** — Redirect the user to the login screen pre-filled (or prompted) with the registered phone number.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

### 3. Two-Wheeler Registration Number Entered

**Condition:** The registration number entered belongs to a two-wheeler (bike, scooter, or moped).

**Behaviour:**
- Inform the user: _"The registration number you entered belongs to a two-wheeler."_
- Present two options:
  - **Continue insuring this two-wheeler** — Redirect the user to the bike insurance purchase journey, passing the registration number along so it does not need to be re-entered.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

### 4. Payment Done — Policy Not Yet Issued

**Condition:** The user has already completed payment for this vehicle's insurance but the policy has not been issued yet due to a pending step (e.g., pending inspection, pending KYC).

**Behaviour:**
- Inform the user: _"You have already completed payment for insurance on this vehicle. Your policy will be generated once you complete the pending steps."_
- Clearly indicate what the pending step is (e.g., inspection pending, KYC pending).
- Present two options:
  - **Complete the required steps** — Navigate the user to the relevant pending step (inspection flow or KYC flow) to unblock policy issuance.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

## Car, Policy and User Details

### Purpose

This section defines how the system collects the data points required to underwrite the user correctly and present the right plans and premiums.

---

### Data Sources — What We Fetch from Third-Party APIs

The system relies on third-party APIs to auto-populate details before asking the user anything.

**Car Details (fetched from API)**
| Field | Description |
|-------|-------------|
| Make | Manufacturer (e.g., Maruti, Hyundai, Tata) |
| Model | Specific model (e.g., Swift, Creta) |
| Variant | Trim level (e.g., LXI, VXI, ZXI+) |
| Registration Year & Month | Month and year of first registration |
| Fuel Type | Petrol / Diesel / CNG / Electric |
| Commercial Use | Whether the vehicle is used for commercial purposes |

**Policy Details (fetched from API)**
| Field | Description |
|-------|-------------|
| Policy Expiry Date | Date the current/previous policy expires |
| Policy Type | Third Party / Comprehensive / Own Damage |
| NCB (No Claim Bonus) | Previous NCB percentage earned by the user |
| Last Year Claim | Whether the user made a claim in the previous policy year |

**User Details (collected from user or session)**
| Field | Source |
|-------|--------|
| Pincode | Always asked — not fetched from API |
| Phone Number | Asked only if user is not logged in |

---

### All-or-Nothing Framework

To preserve the believability of auto-populated data, the following rules apply:

- **Car details** — All or nothing. If any one of the six car fields is missing, all car fields are discarded and the user is asked to enter all car details manually.
- **Policy expiry date + Policy type** — Either both are fetched or neither is used. If one is missing, both are discarded and the user is asked for both.
- **NCB** — Only available if Policy expiry date and Policy type are successfully fetched. If policy details are missing, NCB is also treated as not fetched. If policy details are present but NCB is missing, the user is asked for NCB separately.
- **Last year claim** — Only available if Policy expiry date and Policy type are successfully fetched. If policy details are missing, last year claim is also treated as not fetched. If fetched, it is used silently — the user is never asked to confirm it. If not fetched (but policy details are available), the user is asked: _"Did you make a claim last year?"_

---

### UX Approach

1. After the registration number passes preliminary checks, show a **Verify Details card** containing all successfully auto-fetched fields.
2. The user can edit any field in the verify card before confirming.
3. After verification, ask the user to input only the fields that could not be auto-fetched, in the order defined below.
4. If nothing was auto-fetched, skip the verify card entirely and go straight to questions.

---

### Question Order (when asking manually)

When one or more fields need to be collected manually, they are always presented in this sequence:

| # | Question / Field |
|---|-----------------|
| 1 | Car Make |
| 2 | Car Model |
| 3 | Car Variant |
| 4 | Registration Year and Month |
| 5 | Fuel Type |
| 6 | Do you use this car for commercial purposes? |
| 7 | Policy Type |
| 8 | Policy Expiry Date |
| 9 | Pincode |
| 10 | Phone Number _(only if not logged in)_ |
| 11 | NCB (No Claim Bonus) |
| 12 | Did you make a claim last year? _(only if last year claim not fetched)_ |

---

### Data Collection Scenarios

The table below covers all valid combinations of what the API returns and the user's login status. NCB and Last Claim can only be fetched when Policy Expiry + Type are also fetched — combinations where this dependency is violated are not valid and are excluded.

> **Legend:** T = fetched / True · F = not fetched / False
> Claim fetched (T) = used silently, never shown in verify card or asked

| # | All Car Details Fetched | Policy Expiry + Type Fetched | NCB Fetched | Last Claim Fetched | User Logged In | Verify Card Shows | Questions Asked (in order) |
|---|:-:|:-:|:-:|:-:|:-:|---|---|
| 1 | T | T | T | T | T | Car details · Policy expiry · Policy type · NCB | Pincode |
| 2 | T | T | T | T | F | Car details · Policy expiry · Policy type · NCB | Pincode · Phone number |
| 3 | T | T | T | F | T | Car details · Policy expiry · Policy type · NCB | Pincode · Last year claim? |
| 4 | T | T | T | F | F | Car details · Policy expiry · Policy type · NCB | Pincode · Phone number · Last year claim? |
| 5 | T | T | F | T | T | Car details · Policy expiry · Policy type | Pincode · NCB |
| 6 | T | T | F | T | F | Car details · Policy expiry · Policy type | Pincode · Phone number · NCB |
| 7 | T | T | F | F | T | Car details · Policy expiry · Policy type | Pincode · NCB · Last year claim? |
| 8 | T | T | F | F | F | Car details · Policy expiry · Policy type | Pincode · Phone number · NCB · Last year claim? |
| 9 | T | F | — | — | T | Car details | Policy type · Policy expiry date · Pincode · NCB · Last year claim? |
| 10 | T | F | — | — | F | Car details | Policy type · Policy expiry date · Pincode · Phone number · NCB · Last year claim? |
| 11 | F | T | T | T | T | Policy expiry · Policy type · NCB | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode |
| 12 | F | T | T | T | F | Policy expiry · Policy type · NCB | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · Phone number |
| 13 | F | T | T | F | T | Policy expiry · Policy type · NCB | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · Last year claim? |
| 14 | F | T | T | F | F | Policy expiry · Policy type · NCB | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · Phone number · Last year claim? |
| 15 | F | T | F | T | T | Policy expiry · Policy type | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · NCB |
| 16 | F | T | F | T | F | Policy expiry · Policy type | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · Phone number · NCB |
| 17 | F | T | F | F | T | Policy expiry · Policy type | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · NCB · Last year claim? |
| 18 | F | T | F | F | F | Policy expiry · Policy type | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode · Phone number · NCB · Last year claim? |
| 19 | F | F | — | — | T | _(no verify card)_ | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Policy type · Policy expiry date · Pincode · NCB · Last year claim? |
| 20 | F | F | — | — | F | _(no verify card)_ | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Policy type · Policy expiry date · Pincode · Phone number · NCB · Last year claim? |

> Rows 9, 10, 19, 20: NCB and Last Claim are marked — (not applicable) because Policy Expiry + Type were not fetched. Both fields are always asked manually in these scenarios.

---



<!-- Define the key inputs that drive plan recommendation -->

- **Make** — Car manufacturer (e.g., Maruti, Hyundai, Tata, BMW)
- **Model** — Specific model (e.g., Swift, Creta, Harrier)
- **Variant** — Trim/variant (e.g., LXI, VXI, ZXI+)
- **Year of manufacture** — Registration year
- **Pincode** — User's location / registration zone
- **RTO** — Regional Transport Office code
- **Fuel type** — Petrol, Diesel, CNG, Electric
- **Previous policy** — Existing coverage details, NCB (No Claim Bonus)
- **Claim history** — Past claims if any

## Request for Quote and Handling Blocked Users

This section defines how the system requests plans from the backend using the information the user has submitted or verified, and how to handle scenarios where no plans can be offered.

### Steps

**Step 1 — Fetch plans from backend**
- Using all confirmed/verified car details, policy details, and user details, the system makes a quote request to the backend.
- This is triggered only after all mandatory fields are either fetched and verified or manually entered by the user.

**Step 2 — No plans available (blocked user)**
- If the backend returns no plans for the user (i.e., ACKO is unable to offer any insurance product for this vehicle/user combination):
  - Inform the user: _"Unfortunately, we are not able to offer any plans for your vehicle at this point."_
  - No further purchase journey steps are shown.
  - _Further handling TBD (e.g., exit options, support contact)._

**Step 3 — Plans available**
- If the backend returns one or more plans, proceed to render the plan selection and recommendation screens.
- All subsequent screens (plan display, add-on selection, pricing, checkout) are only shown if this step succeeds.

---

---

## Understanding Plan Types and Plans

This section defines the full hierarchy of car insurance plans served to fresh car insurance users on ACKO — what each plan means, who it is for, and the variants within each plan type.

---

### Plan Type Hierarchy Overview

```
Car Insurance Plans
├── Own Damage (OD)
│   └── Standard OD
├── Own Damage Zero Depreciation (OD ZD)
│   ├── OD ZD — Safe Driver
│   └── OD ZD — Standard
├── Comprehensive
│   ├── Comprehensive — Network Garage
│   └── Comprehensive — Standard
├── Zero Depreciation Comprehensive (ZD Comprehensive)
│   ├── ZD Comprehensive — Safe Driver
│   └── ZD Comprehensive — Standard
└── Third Party (TP)
    └── (no variants)
```

---

### Plan Types — Definitions

#### 1. Own Damage (OD)

- **Who it is for:** Users whose car is 1–3 years old and whose Third Party coverage from a previously purchased policy is still active.
- **What it covers:** Damage to the user's own car and assets only.
- **What it does NOT cover:** Legal liabilities towards third parties.
- **Depreciation:** User pays depreciation on parts replaced during claims (zero depreciation is not included).
- **Variants:** None (standard only).

---

#### 2. Own Damage Zero Depreciation (OD ZD)

- **Who it is for:** Users whose car is 1–3 years old and whose Third Party coverage from a previously purchased policy is still active.
- **What it covers:** Damage to the user's own car and assets only.
- **What it does NOT cover:** Legal liabilities towards third parties.
- **Depreciation:** Zero Depreciation (bumper-to-bumper) cover is pre-included. User does not pay any depreciation or out-of-pocket expenses even if part replacement is required during a claim.
- **Key delta vs standard OD:** Zero depreciation cover included by default.

| Variant | Premium | Deductible on Claim | Best For |
|---------|---------|---------------------|----------|
| **Safe Driver** | Lower | ₹5,000 payable during claim | Safe drivers who rarely claim |
| **Standard** | Higher | No deductible | Users who want full protection with no out-of-pocket cost at claim time |

---

#### 3. Comprehensive

- **Who it is for:** All users seeking complete coverage.
- **What it covers:** User's own car damage AND legal liabilities towards third parties in case of an accident.
- **What it does NOT cover:** N/A — this is the broadest standard plan.
- **Depreciation:** User pays depreciation on parts replaced during claims (zero depreciation not included).

| Variant | Premium | Repair Restriction | Deductible on Claim | Best For |
|---------|---------|-------------------|---------------------|----------|
| **Network Garage** | Lower | Repairs must be done at ACKO Network garages (top dealerships and multi-brand garages). Repairs outside the network attract a ₹5,000 deductible. | ₹5,000 if repaired outside network | Cost-conscious users comfortable using network garages |
| **Standard** | Higher | User can repair at any garage of their choice | No deductible | Users who want maximum flexibility in choosing their repair garage |

---

#### 4. Zero Depreciation Comprehensive (ZD Comprehensive)

- **Who it is for:** All users seeking complete coverage with no depreciation charges.
- **What it covers:** User's own car damage AND legal liabilities towards third parties in case of an accident.
- **Depreciation:** Zero Depreciation cover included. User does not pay depreciation charges during claims.
- **Key delta vs standard Comprehensive:** Zero depreciation cover included by default.

| Variant | Premium | Deductible on Claim | Best For |
|---------|---------|---------------------|----------|
| **Safe Driver** | Lower | ₹5,000 payable during claim | Safe drivers who rarely claim but want zero dep protection |
| **Standard** | Higher | No deductible | Users who want full protection — zero dep and no out-of-pocket cost at claim time |

---

#### 5. Third Party (TP)

- **Who it is for:** Users seeking the minimum legally required coverage.
- **What it covers:** Legal liabilities of the car owner towards third parties (other people, vehicles, or property) in case of an accident.
- **What it does NOT cover:** Any damage to the user's own car.
- **Legal requirement:** This is the minimum coverage required by law to drive on Indian roads.
- **Variants:** None.

---

### Summary Table

| Plan Type | Covers Own Car | Covers Third Party Liability | Zero Dep Included | Variants |
|-----------|:-:|:-:|:-:|---|
| Own Damage (OD) | Yes | No | No | Standard only |
| OD Zero Depreciation | Yes | No | Yes | Safe Driver · Standard |
| Comprehensive | Yes | Yes | No | Network Garage · Standard |
| ZD Comprehensive | Yes | Yes | Yes | Safe Driver · Standard |
| Third Party | No | Yes | N/A | None |

---

## Guiding the User Through Plan Selection

This section defines the step-by-step logic for helping users make an informed plan choice. The flow adapts based on which plan combinations are available for the user.

---

### Plan Combinations Served

ACKO offers the following plan combinations depending on the user's vehicle age, profile, and eligibility.

**Vehicles with active TP policy (car aged 1–3 years) — OD combinations:**

| Combination | Plans Offered |
|-------------|--------------|
| OD-1 | OD only |
| OD-2 | OD + OD ZD (Safe Driver) |
| OD-3 | OD + OD ZD (Safe Driver) + OD ZD (Standard) |

**All other vehicles — Full plan combinations:**

| Combination | Plans Offered |
|-------------|--------------|
| A | TP only |
| B | Comprehensive (Standard) only |
| C | TP + Comprehensive (Standard) |
| D | TP + Comprehensive (Standard) + Comprehensive (Network Garage) |
| E | TP + Comprehensive (Standard) + Comprehensive (Network Garage) + ZD (Safe Driver) |
| F | TP + Comprehensive (Standard) + Comprehensive (Network Garage) + ZD (Safe Driver) + ZD (Standard) |

---

### Universal Plan Benefits

All ACKO car insurance plans (except Third Party) come with three benefits that should be surfaced consistently across all plan cards and selection screens:

| Benefit | Display copy |
|---------|-------------|
| Free pickup & drop | "Free pickup & drop of your car during a claim" |
| Real-time updates | "Real-time repair updates on the ACKO app" |
| Cashless repairs | "Cashless repairs at any GST registered garage" |

---

### UX Guidance — Step 1: Third Party vs Comprehensive Card UI

**Screen intent:** Help the user understand the fundamental difference between TP and Comprehensive before they choose.

**Layout:** Two vertically stacked or side-by-side selectable cards. Show starting-from price on each card. Highlight the recommended card with a **"Recommended"** tag.

---

**Third Party Card**

```
┌─────────────────────────────────────────┐
│  TAG: "Minimum cover required by law"   │  ← amber/neutral tag
│                                         │
│  Third Party                            │  ← plan name
│  Starting from ₹X,XXX/yr               │  ← price
│                                         │
│  ✓ Covers damage you cause to others    │
│    and their property                   │
│  ✗ Does not cover damage to your        │
│    own car                              │
│  ✗ No cashless repair benefit           │
└─────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"Covers damage caused by your car to others and their property"_
- Point 2: _"Does not cover any damage caused to your own car"_ — display with a ✗ or muted style to signal the gap
- Tag: **"Minimum cover required by law"** — amber pill tag at the top of the card

---

**Comprehensive Card**

```
┌─────────────────────────────────────────┐
│  TAG: "Recommended" (green)             │  ← shown when recommended
│                                         │
│  Comprehensive                          │  ← plan name
│  Starting from ₹X,XXX/yr               │  ← price
│                                         │
│  ✓ Covers theft, fire, accidents &      │
│    natural disasters                    │
│  ✓ Covers damage caused to others       │
│  ✓ Cashless repairs at any GST garage   │
│  ✓ Real-time repair updates on app      │
│  ✓ Free pickup & drop during claims     │
└─────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"Covers theft, damage from fire, accidents, and natural disasters"_
- Point 2: _"Covers damage caused by your car to others and their property"_
- Point 3: _"Cashless repairs at any GST registered garage"_
- Point 4: _"Real-time repair updates on the ACKO app"_
- Point 5: _"Free pickup and drop of your car during a claim"_
- Tag: **"Recommended"** — green pill tag when recommendation logic selects Comprehensive

---

### UX Guidance — Step 2: Zero Depreciation vs Standard Card UI

**Screen intent:** Help the user understand the depreciation delta and what it means for their out-of-pocket cost at claim time.

**Layout:** Two selectable cards with a **Compare** toggle or expandable section below that illustrates the difference with a worked example. Highlight the recommended card.

---

**Zero Depreciation Card**

```
┌─────────────────────────────────────────┐
│  TAG: "Recommended" (green)             │
│                                         │
│  Zero Depreciation                      │
│  Starting from ₹X,XXX/yr               │
│                                         │
│  ✓ We pay the full cost of any part     │
│    replaced during a claim              │
│  ✓ Zero out-of-pocket expenses on       │
│    part replacements                    │
└─────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"Pays the full cost of parts replaced during a claim — no depreciation deducted"_
- Point 2: _"Minimises your out-of-pocket expenses during claims"_

---

**Standard Comprehensive Card**

```
┌─────────────────────────────────────────┐
│  Standard                               │
│  Starting from ₹X,XXX/yr               │
│                                         │
│  ✓ Pays cost of replaced parts after    │
│    deducting depreciation               │
│  ℹ Depreciation is based on the age of  │
│    your car and the type of part        │
│  ℹ Out-of-pocket expenses typically     │
│    amount to 20–30% of claim value      │
└─────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"Pays the cost of replaced parts after deducting depreciation"_
- Point 2: _"Depreciation is calculated based on your car's age and the type of part replaced"_
- Point 3: _"Your out-of-pocket expenses typically amount to 20–30% of the total claim value"_ — display with an ℹ info style, not a ✗, to avoid alarming the user unnecessarily

---

**Compare Section (expandable / toggle below the two cards)**

Label: **"See the difference with an example →"**

Show a worked example based on the user's actual car age where possible, or use a generic scenario:

```
Example: A bumper gets damaged in an accident.
Repair cost: ₹15,000

                    Zero Dep        Standard
─────────────────────────────────────────────
Part cost           ₹15,000         ₹15,000
Depreciation        ₹0              ₹3,000–4,500
                                    (20–30%)
─────────────────────────────────────────────
You pay             ₹0              ₹3,000–4,500
ACKO pays           ₹15,000         ₹10,500–12,000
```

Copy below table: _"With Zero Depreciation, ACKO pays the full repair bill. With a Standard plan, you pay the depreciated portion out of pocket."_

---

### UX Guidance — Step 4: Variant Selection Card UI

**Screen intent:** Help the user understand that the Smart/preferred variants (Safe Driver, Network Garage) offer better value than their standard counterparts, while being transparent about the conditions attached. The standard variants are shown even when unavailable, with a clear unavailability message.

**Layout:** Two selectable cards per plan type — preferred variant first, standard variant second. Recommended tag on the preferred variant. If a variant is unavailable, show it greyed out with an explicit unavailability label.

---

#### ZD Safe Driver Card _(preferred ZD variant)_

```
┌─────────────────────────────────────────────┐
│  TAG: "Recommended · Best value" (green)    │
│                                             │
│  Zero Dep · Safe Driver                     │
│  ₹X,XXX/yr                                  │
│                                             │
│  ✓ Built for responsible car owners who     │
│    rarely need to claim                     │
│  ✓ All Zero Depreciation benefits at a      │
│    significantly lower premium              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ⚡ Claim condition                  │    │  ← highlighted clause block
│  │ You pay ₹5,000 when you make a      │    │
│  │ claim. We cover everything else.    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Copy guidance:**
- Headline framing: _"For responsible car owners like you who don't usually claim"_ — makes the user feel seen and smart for choosing this
- Point 1: _"All the benefits of Zero Depreciation at a much lower premium"_
- Point 2: _"You only pay ₹5,000 when you make a claim — we cover everything else"_
- Claim condition clause: surface in a visually distinct block (e.g., a highlighted callout card inside the plan card) — not buried in fine print
- Tone: position this as the **smart, confident** choice

---

#### ZD Standard Card _(standard ZD variant)_

```
┌─────────────────────────────────────────────┐
│  Zero Dep · Standard                        │
│  ₹X,XXX/yr                                  │  ← higher price
│                                             │
│  ✓ All Zero Depreciation benefits           │
│  ✓ No deductions of any kind during claims  │
│  ✓ Higher premium, zero conditions          │
└─────────────────────────────────────────────┘
```

**If ZD Standard is not available:**
```
┌─────────────────────────────────────────────┐
│  Zero Dep · Standard                        │
│  [GREYED OUT]                               │
│                                             │
│  ℹ We're unable to offer this plan for      │
│    your vehicle at this time.               │
└─────────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"Same Zero Depreciation benefits as the Safe Driver plan"_
- Point 2: _"Higher premium, but no deductions of any kind during claims"_
- Unavailability copy: _"We're unable to offer this plan for your vehicle at this time"_ — shown greyed out, non-interactive, never hidden

---

#### Comprehensive Network Garage Card _(preferred Comprehensive variant)_

```
┌─────────────────────────────────────────────┐
│  TAG: "Recommended · Fully managed"(green)  │
│                                             │
│  Comprehensive · Network Garage             │
│  ₹X,XXX/yr                                  │
│                                             │
│  ✓ All Comprehensive plan benefits at a     │
│    lower premium                            │
│  ✓ Fully managed claims at ACKO Trusted     │
│    Garages — India's best dealerships and   │
│    multi-brand garages                      │
│  ✓ Free pickup & drop, real-time updates,   │
│    and a 1-year warranty on all repairs     │
│  ✓ Just hand over the keys — we take        │
│    care of everything                       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ⚡ Claim condition                  │    │  ← highlighted clause block
│  │ Repairs outside ACKO Trusted        │    │
│  │ Garages attract a ₹5,000 deductible │    │
│  │ Not applicable if no trusted garage │    │
│  │ is available near you.              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [See ACKO Trusted Garages near you →]      │  ← tappable link
└─────────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"All Comprehensive plan benefits at a lower premium"_
- Point 2: _"A fully managed claims experience at ACKO Trusted Garages — India's best dealerships and multi-brand garages, tested for quality and speed"_
- Point 3: _"Includes free pickup & drop, regular claim updates, and a 1-year warranty on repairs"_
- Point 4: _"Just hand over the keys and carry on — we take care of everything"_ — this is the key emotional hook, position prominently
- Claim condition clause: _"If you repair outside the ACKO Trusted Network, a ₹5,000 deductible applies. This deductible is waived if there are no trusted garages near you."_ — surface in a highlighted callout block, not fine print
- CTA link: _"See ACKO Trusted Garages near you →"_
- Tone: position as the **VIP, peace-of-mind** option — the user just hands over their keys and we manage everything

---

#### Comprehensive Standard Card _(standard Comprehensive variant)_

```
┌─────────────────────────────────────────────┐
│  Comprehensive · Standard                   │
│  ₹X,XXX/yr                                  │  ← higher price
│                                             │
│  ✓ Cashless repairs at any GST registered   │
│    garage of your choice                    │
└─────────────────────────────────────────────┘
```

**If Comprehensive Standard is not available:**
```
┌─────────────────────────────────────────────┐
│  Comprehensive · Standard                   │
│  [GREYED OUT]                               │
│                                             │
│  ℹ We're unable to offer this plan for      │
│    your vehicle at this time.               │
└─────────────────────────────────────────────┘
```

**Copy guidance:**
- Point 1: _"Cashless repairs at any GST registered garage — repair wherever you want, no conditions"_
- Unavailability copy: _"We're unable to offer this plan for your vehicle at this time"_ — greyed out, non-interactive, never hidden

---

#### General Variant Selection Rules

- The preferred variant (Safe Driver / Network Garage) is always shown first.
- The standard variant is always shown second — even when unavailable.
- Never hide an unavailable variant — show it greyed out with the unavailability message so the user understands their options and the decision feels transparent.
- Claim conditions (₹5,000 deductibles, network restrictions) are always surfaced in a visually distinct callout block inside the card — never in small print.
- The recommended tag on Safe Driver and Network Garage should reinforce that these are the smarter choices vs their standard counterparts, not just a default.

---

### Case 0 — When TP plan is active and we only need OD renewal (Combinations OD1, OD2 and OD3)
Used when the user's car is 1–3 years old and their Third Party policy is still active. The user only needs to renew their Own Damage (OD) component.

**Step 1 — Inform the user about their active TP policy**
- Do not ask the user to choose between TP and Comprehensive — they already have active TP coverage.
- Inform the user: _"Your Third Party policy is already active till `<dd-mm-yyyy>`. You only need to renew your Own Damage (OD) policy right now."_
- User acknowledges with **Okay** to proceed.

**Step 2 — ZD vs Standard OD** _(only if ZD option is available, i.e. Combinations OD-2 or OD-3)_
- Ask the user: _"Do you want Zero Depreciation cover or a Standard OD plan?"_
- Show a brief description of each:
  - **OD Zero Depreciation** — No depreciation charges on part replacements during claims. Full claim payout with no out-of-pocket cost.
  - **Standard OD** — Depreciation is applied on parts replaced during claims. You pay the depreciation amount out of pocket.
- Display starting-from prices for both.
- **Recommendation logic:** Always recommend **OD ZD**.

**Step 3 — OD only (Combination OD-1)**
- If only OD is available (no ZD option) → skip Step 2, inform the user that only the standard OD plan is available, and proceed directly to the Add-on Selection flow.

**Step 4 — Variant Selection** _(only if user selects ZD in Step 2 and Combination OD-3 is available)_
- Display the available OD ZD variants (Safe Driver and/or Standard).
- If only Safe Driver is available (Combination OD-2) → make it explicitly clear that OD ZD Standard is not available to this user.
- Surface the Safe Driver clause clearly: ₹5,000 deductible payable during any claim.
- **Recommendation logic:** Always recommend **OD ZD Safe Driver** over OD ZD Standard.

**Step 5 — Proceed to Add-ons**
- Once the user selects a plan/variant and confirms → proceed to the Add-on Selection flow.

---

### Case 1 — TP, Comprehensive, and ZD All Available (Combinations E or F)

This is the full plan selection flow used when the user is eligible for at least one variant each of TP, Comprehensive, and ZD Comprehensive.

**Step 1 — Comprehensive vs Third Party**
- Ask the user: _"Do you want a Comprehensive plan or a Third Party plan?"_
- Show a brief description of each:
  - **Comprehensive** — Covers your own car damage plus your legal liabilities towards others.
  - **Third Party** — Covers only your legal liabilities towards others. Does not cover your own car. Minimum coverage required by law.
- Display starting-from prices for both — always the lowest available price within each plan kind.
- **Recommendation logic:**
  - Default → always recommend **Comprehensive**.
  - Exception → if the user's previous policy was a TP policy → recommend **TP**.

**Step 2 — ZD Comprehensive vs Standard Comprehensive** _(only reached if user selects Comprehensive in Step 1)_
- Ask the user: _"Do you want Zero Depreciation cover or a Standard Comprehensive plan?"_
- Show a brief description of each:
  - **Zero Depreciation (ZD)** — No depreciation charges on part replacements during claims. Full claim payout.
  - **Standard Comprehensive** — Depreciation is applied on parts replaced during claims. You pay the depreciation amount out of pocket.
- Display starting-from prices for both — always the lowest available price within each plan kind.
- **Recommendation logic:**
  - If the vehicle is **1–3 years old** → always recommend **ZD**, regardless of previous policy type.
  - If the vehicle is **more than 3 years old**:
    - Previous policy had ZD → recommend **ZD**.
    - Previous policy did not have ZD → recommend **Standard Comprehensive**.
    - Previous policy ZD status unknown → recommend **Standard Comprehensive**.

**Step 3 — TP selected in Step 1**
- If the user chose Third Party in Step 1 → skip Steps 2 and 4, proceed directly to the Add-on Selection flow.

**Step 4 — Variant Selection** _(reached after Step 2, or directly if only one plan type is available)_
- Display the specific plan variants available to the user under the chosen plan type (e.g., Safe Driver vs Standard for ZD; Network Garage vs Standard for Comprehensive).
- If only one variant is available (e.g., ZD Safe Driver is offered but ZD Standard is not):
  - Make it explicitly clear that the other variant is not available to this user. Do not hide or silently omit it — state it plainly.
- For variants that carry conditional deductibles or usage clauses (Safe Driver, Network Garage), surface these prominently:
  - **Safe Driver deductible:** ₹5,000 payable by the user during any claim.
  - **Network Garage clause:** Repairs must be done at an ACKO Network garage. ₹5,000 deductible applies if the user repairs outside the network.
- **Recommendation logic:**
  - Always recommend **Safe Driver** over ZD Standard.
  - Always recommend **Network Garage** over Comprehensive Standard.
  - Rationale: these variants offer a lower premium with a conditional deductible that only applies if the user makes a claim — a good deal for most users.

**Step 5 — Proceed to Add-ons**
- Once the user selects a variant and confirms → proceed to the Add-on Selection flow.

---

### Case 2 — TP and Comprehensive Available, ZD Not Available (Combinations C or D)

The flow is identical to Case 1 with one exception: **Step 2 (ZD vs Standard selection) is skipped entirely.**

- Step 1: Ask Comprehensive vs TP (same logic and recommendation rules as Case 1).
- If user selects Comprehensive → go directly to **Step 4** (variant selection among available Comprehensive variants).
- If user selects TP → go directly to the Add-on Selection flow.

---

### Case 3 — Only One Plan Type Available (Combinations A or B)

- Inform the user clearly: _"We are only able to offer you one plan at this time."_
- Show the available plan (TP only or Comprehensive Standard only) with its description and price.
- If the user is willing to proceed → go directly to the Add-on Selection flow.
- No plan type choice is presented — there is nothing to choose between.

---

## Add-on Selection

This section defines the add-ons available, the questions asked to personalise recommendations, the recommendation logic, and how add-ons are displayed to the user.

---

### Add-on Catalogue

#### Category 1 — Add-ons That Cover Your Family

| Add-on | What it covers |
|--------|---------------|
| **Personal Accident Cover** | Covers the policyholder against accidental death or permanent disability arising from a car accident. |
| **Passenger Protect Cover** | Extends accident cover to passengers travelling in the car at the time of an accident. |
| **Paid Driver Cover** | Covers a paid/hired driver against accidental death or disability while driving the insured vehicle. |

#### Category 2 — Add-ons That Cover Your Car

| Add-on | What it covers |
|--------|---------------|
| **Engine Protect** | Covers damage to the car's engine and its parts due to water ingression, oil leakage, or hydrostatic lock — damage typically not covered under a standard policy. |
| **Return to Invoice (RTI)** | In the event of total loss or theft, the insurer pays the original invoice value of the car rather than the depreciated IDV. Bridges the gap between IDV and purchase price. |
| **Extra Car Protect** | A bundled add-on combining three covers: (1) Roadside Assistance — on-the-spot help for breakdowns, tyre changes, fuel delivery etc.; (2) Key Loss Cover — covers cost of replacement keys and locks; (3) Out-of-Station Accommodation Cover — covers hotel/accommodation costs if the car breaks down or meets an accident far from home. |
| **Electrical Accessory Cover** | Covers electrical accessories fitted to the car after sale (e.g., upgraded audio system, rear camera) that are not part of the manufacturer's standard specification. |
| **Non-Electrical Accessory Cover** | Covers non-electrical accessories fitted to the car after sale (e.g., seat covers, alloy wheels, roof rails) not part of the manufacturer's standard specification. |
| **NCB Protection** | Protects the user's accumulated No Claim Bonus percentage even if they make one claim during the policy year. Only applicable when the user's NCB is greater than 0. |

---

### Questions Asked to Personalise Recommendations

Before displaying add-ons, the system asks the user the following:

1. **Do you have a paid/hired driver for this car?** _(Yes / No)_
2. **Do you have any electrical or non-electrical accessories fitted to your car after purchase?** _(e.g., new AC unit, bass boosters, alloy wheels, seat covers)_ _(Yes / No)_

---

### Recommendation Logic

The recommended add-on pack is assembled as follows, applied in sequence:

**Base recommendation by vehicle age:**

| Vehicle Age | Recommended Add-ons |
|-------------|---------------------|
| Age < 8 years | Engine Protect · Extra Car Protect · Personal Accident Cover · Passenger Protect Cover |
| Age ≥ 8 years | Extra Car Protect · Personal Accident Cover · Passenger Protect Cover |

**Additional rules layered on top of the base:**

| Condition | Add to recommended pack |
|-----------|------------------------|
| Age ≤ 3 years | Add **Return to Invoice (RTI)** |
| User's NCB > 0 | Add **NCB Protection** |
| User has a paid driver | Add **Paid Driver Cover** |
| User has accessories fitted after sale | Add **Electrical Accessory Cover** and **Non-Electrical Accessory Cover** |

---

### Display Rules

- List all add-ons grouped into two clearly labelled categories: **Add-ons that cover your family** and **Add-ons that cover your car**.
- Each add-on shows its name and a short description of what it covers.
- Add-ons that qualify under the recommendation logic are tagged with a **Recommended** label.
- Add-ons that do not qualify are still shown — the user can select them freely — but carry no recommended tag.
- **NCB Protection** is only shown if the user's NCB > 0. It is hidden entirely if NCB = 0.
- **Paid Driver Cover** is only shown if the user confirmed they have a paid driver.

---

---

## Confirm Details Section

This section follows the add-on selection screen. Its purpose is to reconfirm key details before the user proceeds to the review and payment screen. It covers three things in sequence: policy expiry date, inspection requirement, and personal details.

---

### Step 1 — Policy Expiry Date

**Pre-filled cases:**
- If the policy expiry date was auto-fetched during the pre-quote stage, or the user manually entered it during pre-quote — display it pre-filled and allow the user to edit if needed.

**Unknown / not available:**
- If the user selected _"I don't know"_ during pre-quote AND the date could not be auto-fetched — ask the user to enter the policy expiry date before proceeding.
- Explain why it is needed: _"We need your previous policy's expiry date to start your new policy on time and ensure your vehicle has continued coverage without any gap."_
- This is a mandatory field — the user cannot proceed without entering it.

---

### Step 2 — Inspection Requirement

Once the expiry date is confirmed or entered, apply the following logic:

**Case A — Policy not yet expired OR expired ≤ 10 days ago:**
- No vehicle inspection required.
- Fetch the new policy start date via API and display it to the user.
- Explain the start date clearly: _"Your new policy will start on `<date>`. This ensures there is no break in your coverage."_

**Case B — Policy expired between 10 and 90 days ago AND plan is Comprehensive / ZD / OD:**
- Vehicle inspection is required before the policy can be issued.
- Inform the user in a reassuring, low-friction way:
  - _"Since your previous policy expired a while ago, we need to do a quick vehicle inspection before issuing your policy."_
  - _"It's a super easy process — just pick a date and time slot, and our crew member will come to your location. The whole inspection takes less than 10 minutes."_
- Present a date and time slot selector for the user to schedule the inspection.
- Tone: position inspection as a simple, convenient step — not a blocker.

---

### Step 3 — Personal Details

Ask the user to confirm the following:

**Name**
- Pre-fill with the name auto-fetched during the pre-quote stage.
- Inform the user: _"If you're buying this policy for someone else or need to change the name, you'll have the option to do so after purchase. At this stage, we need the name of the person making the payment so we can process the KYC."_
- User can edit the name if needed.

**Email address**
- Required field — always ask if not already available.
- Explain why: _"We'll send your policy documents and claim updates to this email address."_

**Phone number**
- Required only if the user is not logged in.
- Explain why: _"Your policy will be mapped to the ACKO account linked to this phone number. You'll also receive claim and policy updates here."_

Once the user confirms all three fields → proceed to the **Review Screen**.

---

## Review Section

This section follows the Confirm Details section. The user reviews everything before paying. The primary CTA on this screen is **"Pay Now"**.

---

### Step 1 — Coupon Application

- If the user is eligible for one or more coupons, display them here before the premium summary.
- Show each eligible coupon as a selectable card/chip with the discount value and any applicable condition.
- Also provide a text input field so the user can manually type in a coupon code.
- Only one coupon can be applied at a time.
- Once a coupon is applied, recalculate and display the updated premium immediately.
- If a typed code is invalid, show an inline error: _"This coupon code is invalid or has expired."_

---

### Step 2 — Review Details

Display a summary of everything the user has selected, grouped into the following sections:

**Car & Personal Details**
- Car make, model, variant, registration year, fuel type
- Policyholder name, email, phone number

**Coverage Details**
| Detail | Value |
|--------|-------|
| Plan | Selected plan name and variant (e.g., ZD Comprehensive · Safe Driver) |
| Add-ons | List of all selected add-ons |
| IDV | Insured Declared Value of the vehicle |
| NCB | No Claim Bonus percentage applied |

**Premium Breakup**
- Base premium
- Add-on premiums (itemised per add-on)
- NCB discount applied (shown as a deduction)
- Coupon discount applied (shown as a deduction, if applicable)
- GST
- **Total payable amount** — prominently displayed

**Policy Start Date / Inspection Note**
- If no inspection is required: display the policy start date with a brief note — _"Your policy starts on `<date>`. Your vehicle will be covered from this date."_
- If inspection is required: display a note — _"Your policy will be issued after your vehicle inspection on `<scheduled date and time>`. We'll send you a reminder before the slot."_

---

### CTA

- **"Pay Now"** — primary action button, always visible at the bottom of the screen.
- Tapping Pay Now takes the user to the payment gateway.

---

## Test Cases — Dummy Registration Numbers

Each test case below maps to a dummy registration number. Together they cover the key axes of variation: what the API fetches vs what is manually asked, which plan combination is offered, and whether inspection is required. Use these to validate the full purchase journey end-to-end.

---

### TC-01 · MH01AB1001 — Happy Path (Everything fetched, full plans, no inspection)

**Scenario:** Best-case flow. All API data available, user is logged in, full plan combination offered, policy not yet expired.

| Dimension | Value |
|-----------|-------|
| Vehicle | 2023 Maruti Swift VXI · Petrol |
| Car details fetched | All ✓ |
| Policy expiry + type | Fetched ✓ (Comprehensive, expires in 15 days) |
| NCB | Fetched ✓ (20%) |
| Last year claim | Fetched ✓ (No claim) |
| User logged in | Yes |
| Plan combination | F — TP + Comp Std + Comp Network + ZD Safe Driver + ZD Std |
| Inspection required | No (policy not yet expired) |
| Questions asked | Pincode only |
| Verify card shows | Car details · Policy expiry · Policy type · NCB |

**What to test:** Verify card display → Pincode input → Full plan selection flow (Steps 1–4) → Add-on recommendations (age < 3 yrs: Engine Protect + RTI + Extra Car Protect + PA + Passenger Protect) → Confirm details with pre-filled name/email → Review screen with Pay Now.

---

### TC-02 · MH02CD2002 — OD Renewal (Active TP, car 1–3 years old)

**Scenario:** Car is 2 years old with an active TP policy. User only needs to renew OD. ZD variants available.

| Dimension | Value |
|-----------|-------|
| Vehicle | 2022 Hyundai Creta SX · Diesel |
| Car details fetched | All ✓ |
| Policy expiry + type | Fetched ✓ (TP, active till 6 months from now) |
| NCB | Fetched ✓ (0% — first policy year) |
| Last year claim | Fetched ✓ (No claim) |
| User logged in | Yes |
| Plan combination | OD-3 — OD + OD ZD Safe Driver + OD ZD Std |
| Inspection required | No |
| Questions asked | Pincode only |

**What to test:** Active TP banner informing user their TP is active till `<date>` → ZD vs Standard OD choice (recommend ZD) → Variant selection (Safe Driver recommended) → Add-ons (RTI recommended for age ≤ 3).

---

### TC-03 · KA03EF3003 — Inspection Required (Policy expired 30 days ago)

**Scenario:** Policy expired 30 days ago. Comprehensive plan available. Inspection is mandatory before issuance.

| Dimension | Value |
|-----------|-------|
| Vehicle | 2019 Tata Nexon XZ+ · Petrol |
| Car details fetched | All ✓ |
| Policy expiry + type | Fetched ✓ (Comprehensive, expired 30 days ago) |
| NCB | Fetched ✓ (25%) |
| Last year claim | Not fetched (ask user) |
| User logged in | Yes |
| Plan combination | E — TP + Comp Std + Comp Network + ZD Safe Driver |
| Inspection required | Yes (expired 10–90 days, Comp/ZD plan) |
| Questions asked | Pincode · Last year claim? |

**What to test:** Full plan flow → Confirm details → Inspection slot picker shown → Review screen shows inspection note instead of policy start date.

---

### TC-04 · DL04GH4004 — Nothing Fetched, Not Logged In (Maximum manual entry)

**Scenario:** API returns nothing. User is not logged in. All 12 questions are asked in sequence.

| Dimension | Value |
|-----------|-------|
| Vehicle | Unknown until user inputs |
| Car details fetched | None ✗ |
| Policy expiry + type | Not fetched ✗ |
| NCB | Not fetched ✗ |
| Last year claim | Not fetched ✗ |
| User logged in | No |
| Plan combination | F (served after user inputs all details) |
| Inspection required | Depends on date user enters |
| Questions asked | All 12: Make → Model → Variant → Reg year/month → Fuel type → Commercial? → Policy type → Policy expiry → Pincode → Phone number → NCB → Last year claim? |

**What to test:** Full 12-question manual input flow → No verify card shown → Full plan selection after quote fetch → Phone number collected in confirm details.

---

### TC-05 · TN05IJ5005 — Car Details Only, No Policy Details

**Scenario:** Car details auto-fetched but policy details unavailable. User must enter policy information manually.

| Dimension | Value |
|-----------|-------|
| Vehicle | 2018 Honda City V · Petrol |
| Car details fetched | All ✓ |
| Policy expiry + type | Not fetched ✗ |
| NCB | Not fetched ✗ (policy not fetched) |
| Last year claim | Not fetched ✗ |
| User logged in | Yes |
| Plan combination | E |
| Inspection required | Depends on date user enters |
| Questions asked | Policy type · Policy expiry date · Pincode · NCB · Last year claim? |
| Verify card shows | Car details only |

**What to test:** Verify card with car details only → Manual policy detail questions → Quote fetch with mixed data → Plan selection flow.

---

### TC-06 · GJ06KL6006 — Policy Details Only, No Car Details

**Scenario:** Policy details auto-fetched but car details unavailable. User must enter car details manually.

| Dimension | Value |
|-----------|-------|
| Vehicle | Unknown make/model (user inputs) |
| Car details fetched | None ✗ |
| Policy expiry + type | Fetched ✓ (Comprehensive, expires in 45 days) |
| NCB | Fetched ✓ (35%) |
| Last year claim | Fetched ✓ (No claim) |
| User logged in | Yes |
| Plan combination | C — TP + Comp Std |
| Inspection required | No |
| Questions asked | Make · Model · Variant · Reg year/month · Fuel type · Commercial? · Pincode |
| Verify card shows | Policy expiry · Policy type · NCB |

**What to test:** Verify card with policy details only → Manual car detail questions → Limited plan combination (C) — ZD vs Standard step skipped, goes directly to variant selection.

---

### TC-07 · UP07MN7007 — TP Only Plan (Older vehicle)

**Scenario:** Car is 12 years old. Only Third Party plan is available (Combination A). No plan choice presented.

| Dimension | Value |
|-----------|-------|
| Vehicle | 2012 Maruti Alto LXI · Petrol |
| Car details fetched | All ✓ |
| Policy expiry + type | Fetched ✓ (TP, expired 5 days ago) |
| NCB | Fetched ✓ (50%) |
| Last year claim | Fetched ✓ (No claim) |
| User logged in | Yes |
| Plan combination | A — TP only |
| Inspection required | No (expired ≤ 10 days) |
| Questions asked | Pincode |

**What to test:** Single plan available message → Direct to add-on selection → NCB Protection shown (NCB = 50%) → Review screen.

---

### TC-08 · MH08OP8008 — Preliminary Check: Two-Wheeler Registration

**Scenario:** Registration number belongs to a bike. Preliminary check triggers the two-wheeler redirect flow.

| Dimension | Value |
|-----------|-------|
| Vehicle type | Two-wheeler |
| Plan combination | N/A — redirected before quote |
| Trigger | Preliminary check #3 |

**What to test:** Two-wheeler detection message → "Continue insuring this two-wheeler" redirects to bike journey with reg pre-filled → "Edit registration number" re-enables the input field.

---

### TC-09 · MH09QR9009 — Preliminary Check: Already Insured (Same User)

**Scenario:** Vehicle is already insured with ACKO under the same logged-in user's account.

| Dimension | Value |
|-----------|-------|
| Trigger | Preliminary check #1 |
| Active policy | Belongs to current user |

**What to test:** "Already insured with ACKO" message → "View my running policy" navigates to policy details → "Edit registration number" re-enables input.

---

### TC-10 · MH10ST1010 — Preliminary Check: Already Insured (Different User)

**Scenario:** Vehicle is insured with ACKO but under a different user's account.

| Dimension | Value |
|-----------|-------|
| Trigger | Preliminary check #2 |
| Active policy | Belongs to account with phone xxxx5511 |

**What to test:** Message with masked phone number → "I'm buying this car" proceeds to purchase journey → "Login with other number" redirects to login → "Edit registration number" re-enables input.

---

### TC-11 · MH11UV1011 — Preliminary Check: Payment Done, Policy Not Issued

**Scenario:** User has already paid for this vehicle's insurance but the policy is pending due to incomplete KYC.

| Dimension | Value |
|-----------|-------|
| Trigger | Preliminary check #4 |
| Pending step | KYC incomplete |

**What to test:** Payment done + pending KYC message → "Complete KYC" navigates to KYC flow → "Edit registration number" re-enables input.

---

### TC-12 · MH12WX1212 — Maximum Add-on Recommendations

**Scenario:** All add-on recommendation conditions are true simultaneously. Validates the full recommended pack is correctly assembled.

| Dimension | Value |
|-----------|-------|
| Vehicle | 2024 Toyota Innova Crysta GX · Diesel · 2 years old |
| NCB | 20% (> 0) |
| Last year claim | No |
| Paid driver | Yes |
| Accessories fitted | Yes (upgraded audio system + alloy wheels) |
| Plan combination | F |
| Inspection required | No |

**Expected recommended add-ons:** Engine Protect · RTI · Extra Car Protect · Personal Accident Cover · Passenger Protect Cover · NCB Protection · Paid Driver Cover · Electrical Accessory Cover · Non-Electrical Accessory Cover

**What to test:** All 9 add-ons tagged Recommended → Paid Driver and NCB Protection visible → Verify both accessory add-ons appear.

---


