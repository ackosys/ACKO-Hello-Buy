---
name: bike-planning-logic
description: Plan recommendation logic for bike and scooter insurance users based on make, model, variant, pincode, and other factors. Use when the user mentions bike insurance plans, two-wheeler plan recommendations, scooter insurance, bike pricing logic, or wants to define how bike/scooter insurance plans are recommended to users.
---

# Bike Planning Logic

## Purpose

This document defines all rules and steps involved in guiding a customer through a two-wheeler insurance purchase on ACKO. It covers two distinct customer journeys:

1. **Existing bike owner renewing or switching insurance** — the customer already owns a bike or scooter and is looking to renew their expiring/lapsed policy or switch their insurance to ACKO.
2. **New bike buyer purchasing insurance for the first time** — the customer has just bought or is in the process of buying a brand new two-wheeler and needs to get it insured for the first time.

For each journey, this document captures:
- The input variables to consider when assessing the customer's vehicle and profile
- The plans to recommend and what each plan means
- The add-ons to display and what each add-on means
- The meaning of key clauses and terms such as inspection, IDV, NCB, engine CC tiers, etc.
- The end-to-end flow designed to result in a completed sale

---

## Journey 1 — Existing Bike Owner (Renewal / Switch to ACKO)

> All sections below — Preliminary Checks, Bike/Policy/User Details, Request for Quote, Plan Selection, Add-on Selection, Confirm Details, and Review — apply to this journey unless explicitly noted otherwise.

---

## Preliminary Checks

These checks are performed immediately after the user enters a registration number, before any plan recommendation or pricing logic is triggered.

### 1. Vehicle Already Insured with ACKO — Same User

**Condition:** The registration number is linked to an active ACKO policy that belongs to the currently logged-in user's account.

**Behaviour:**
- Inform the user: _"This two-wheeler is already insured with ACKO."_
- Present two options:
  - **View my running policy** — Navigate the user to their existing policy details.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

### 2. Vehicle Already Insured with ACKO — Different Customer

**Condition:** The registration number is linked to an active ACKO policy that belongs to a **different** user's account.

**Behaviour:**
- Inform the user: _"This two-wheeler is already insured with ACKO. The policy belongs to the account associated with phone number xxxx5511."_
- Present three options:
  - **I am buying this two-wheeler and want to check insurance** — Treat this as a new purchase journey for the user; proceed into the bike insurance flow with this registration number.
  - **Login with the other phone number to manage this policy** — Redirect the user to the login screen pre-filled (or prompted) with the registered phone number.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

### 3. Car Registration Number Entered

**Condition:** The registration number entered belongs to a four-wheeler (car).

**Behaviour:**
- Inform the user: _"The registration number you entered belongs to a car."_
- Present two options:
  - **Continue insuring this car** — Redirect the user to the car insurance purchase journey, passing the registration number along so it does not need to be re-entered.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

### 4. Payment Done — Policy Not Yet Issued

**Condition:** The user has already completed payment for this two-wheeler's insurance but the policy has not been issued yet due to a pending step (e.g., pending inspection, pending KYC).

**Behaviour:**
- Inform the user: _"You have already completed payment for insurance on this two-wheeler. Your policy will be generated once you complete the pending steps."_
- Clearly indicate what the pending step is (e.g., inspection pending, KYC pending).
- Present two options:
  - **Complete the required steps** — Navigate the user to the relevant pending step (inspection flow or KYC flow) to unblock policy issuance.
  - **Edit registration number** — Allow the user to correct and re-enter the registration number.

---

## Bike, Policy and User Details

### Purpose

This section defines how the system collects the data points required to underwrite the user correctly and present the right plans and premiums. The system relies on the **IIB (Insurance Information Bureau)** to auto-fetch details from the registration number before asking the user anything.

---

### Data Fetched from IIB

| Field | Description |
|-------|-------------|
| **Bike Make** | Manufacturer (e.g., Hero, Honda, TVS, Royal Enfield, Bajaj) |
| **Bike Model** | Specific model (e.g., Splendor, Activa, Classic 350) |
| **Policy Expiry Date** | Date the current/previous policy expires |
| **Phone Number** | Registered phone number of the vehicle owner |

---

### All-or-Nothing Framework

- **Bike Make + Model** — All or nothing. Either both are fetched or neither is used. If one is missing, both are discarded and the user is asked to enter both manually.
- **Policy Expiry Date** — Independent. Fetched or not fetched on its own.
- **Phone Number** — Only shown to the user if they are **not logged in**. If the user is already logged in, this field is skipped entirely regardless of whether it was fetched.

---

### UX Approach

1. After the registration number passes preliminary checks, show a **Verify Details card** containing all successfully auto-fetched fields.
2. The user can edit any field in the verify card before confirming.
3. After verification, ask the user to manually input only the fields that could not be auto-fetched.
4. If nothing was fetched, skip the verify card entirely and go straight to questions.

---

### Question Order (when asking manually)

| # | Question / Field |
|---|-----------------|
| 1 | Bike Make |
| 2 | Bike Model |
| 3 | Policy Expiry Date |
| 4 | Phone Number _(only if not logged in)_ |

---

### Data Collection Scenarios

| # | Make + Model Fetched | Policy Expiry Fetched | User Logged In | Verify Card Shows | Questions Asked |
|---|:-:|:-:|:-:|---|---|
| 1 | T | T | T | Make · Model · Policy expiry | — _(none)_ |
| 2 | T | T | F | Make · Model · Policy expiry | Phone number |
| 3 | T | F | T | Make · Model | Policy expiry date |
| 4 | T | F | F | Make · Model | Policy expiry date · Phone number |
| 5 | F | T | T | Policy expiry | Make · Model |
| 6 | F | T | F | Policy expiry | Make · Model · Phone number |
| 7 | F | F | T | _(no verify card)_ | Make · Model · Policy expiry date |
| 8 | F | F | F | _(no verify card)_ | Make · Model · Policy expiry date · Phone number |

---

## Request for Quote and Handling Blocked Users

This section defines how the system requests plans from the backend using the information the user has submitted or verified, and how to handle scenarios where no plans can be offered.

### Steps

**Step 1 — Fetch plans from backend**
- Using all confirmed/verified bike details, policy details, and user details, the system makes a quote request to the backend.
- This is triggered only after all mandatory fields are either fetched and verified or manually entered by the user.

**Step 2 — No plans available (blocked user)**
- If the backend returns no plans for the user (i.e., ACKO is unable to offer any insurance product for this two-wheeler/user combination):
  - Inform the user: _"Unfortunately, we are not able to offer any plans for your two-wheeler at this point."_
  - No further purchase journey steps are shown.
  - _Further handling TBD (e.g., exit options, support contact)._

**Step 3 — Plans available**
- If the backend returns one or more plans, proceed to render the plan selection and recommendation screens.
- All subsequent screens (plan display, add-on selection, pricing, checkout) are only shown if this step succeeds.

---

## Understanding Plan Types and Plans

This section defines the bike insurance plans offered on ACKO — what each plan covers, who it is for, and the tenure options available.

---

### Plan Types

#### 1. Comprehensive

- **Who it is for:** All users seeking complete coverage.
- **What it covers:** Damage to the user's own two-wheeler AND legal liabilities towards third parties in case of an accident.
- **What it does NOT cover:** N/A — this is the broadest standard plan.

---

#### 2. Own Damage (OD)

- **Who it is for:** Users whose two-wheeler is **less than 5 years old** and whose Third Party coverage from a previously purchased policy is still active.
- **What it covers:** Damage to the user's own two-wheeler only.
- **What it does NOT cover:** Legal liabilities towards third parties (already covered by the active TP policy).

---

#### 3. Third Party (TP)

- **Who it is for:** Users seeking the minimum legally required coverage.
- **What it covers:** Legal liabilities of the two-wheeler owner towards third parties (other people, vehicles, or property) in case of an accident.
- **What it does NOT cover:** Any damage to the user's own two-wheeler.
- **Legal requirement:** This is the minimum coverage required by law to ride on Indian roads.

---

### Summary Table

| Plan | Covers Own Two-Wheeler | Covers Third Party Liability | Available When |
|------|:-:|:-:|---|
| Comprehensive | Yes | Yes | Always |
| Own Damage (OD) | Yes | No | Two-wheeler < 5 years old with active TP policy |
| Third Party | No | Yes | Always |

---

### Tenure Options

All three plan types are available in the following tenure options:

| Tenure | Description |
|--------|-------------|
| **1 Year** | Policy valid for 1 year from start date |
| **2 Years** | Policy valid for 2 years from start date |
| **3 Years** | Policy valid for 3 years from start date |

---

## Guiding the User Through Plan Selection

---

### Step 1 — Plan Selection

Display all plans available to the user as selectable cards. Each card shows the starting-from price for the shortest available tenure (1 year).

**Plans shown depend on user eligibility:**
- If the two-wheeler is < 5 years old with an active TP policy → show OD and Comprehensive cards (TP already covered).
- In all other cases → show Comprehensive and Third Party cards.

**Plan card content:**

| Element | Details |
|---------|---------|
| Plan name | Comprehensive / Own Damage / Third Party |
| Starting price | Lowest price for 1-year tenure |
| Key benefit points | Brief description of what the plan covers (see plan definitions in previous section) |
| Recommended tag | Applied to the recommended plan (see recommendation logic below) |

**Recommendation logic:**
- Default → always recommend **Comprehensive**.
- Exception → if the user's previous policy was a TP policy → recommend **Third Party**.
- For OD-eligible users (< 5 years, active TP) → always recommend **Comprehensive** over OD for better overall coverage.

---

### Step 2 — Tenure Selection

Once the user selects a plan, ask them to choose their preferred tenure.

**Options shown:** 1 Year · 2 Years · 3 Years

**UX guidance:**
- Display all three tenure options with their respective prices.
- For each tenure, show the **total price** and the **effective annual savings** compared to buying 1-year policies repeatedly.
- Nudge the user towards the longest tenure by highlighting the savings:
  - Example: _"Save ₹XXX by choosing the 3-year plan over buying 1-year plans 3 times."_
- The highest tenure option should be visually prominent — use a **"Best value"** or **"Maximum savings"** tag on the 3-year option.
- The recommended tenure is always **3 years**.

Once the user selects a tenure → proceed to the **Add-on Selection** flow.

---

## Add-on Selection

This section defines the add-ons available for bike insurance, how they are displayed, and the copy on each card.

---

### Add-on Catalogue

#### Category 1 — Add-ons That Protect Your Family

| Add-on | Card Copy |
|--------|-----------|
| **Personal Accident Cover** | Pays up to ₹15 lakh if the bike owner is permanently disabled or dies in an accident. |
| **Pillion Rider Cover** | Pays up to ₹2 lakh if your co-passenger is permanently disabled or dies in an accident. |
| **Helmet Protect** | Get up to ₹1,000 for helmet damage or theft, if your bike is also involved in the same incident. |

#### Category 2 — Add-ons That Protect Your Bike

| Add-on | Card Copy |
|--------|-----------|
| **Engine Protect** | Covers damage to your bike's engine due to water ingression, oil leakage, or hydrostatic lock — damage not covered under a standard policy. |
| **Consumables Cover** | Covers the cost of consumables like nuts, bolts, brake oil, engine oil etc. that get replaced during repairs. |
| **Zero Depreciation** | Pays the full cost of parts replaced during a claim with no depreciation deducted — minimises your out-of-pocket expenses. |

---

### Display Rules

- List all add-ons grouped into two clearly labelled categories: **Add-ons that protect your family** and **Add-ons that protect your bike**.
- Each add-on card shows the add-on name and the copy defined above.
- There are no personalisation questions for bike add-ons — all add-ons are shown to every user.
- There are no Recommended tags — the user freely selects whichever add-ons they want.
- User selects the add-ons they want and proceeds to the **Confirm Details** section.

---

## Confirm Details

This section collects and reconfirms key details before the user proceeds to the review and payment screen. Questions are asked in the order below.

---

### Questions Asked (in order)

| # | Question / Field | Condition | Notes |
|---|-----------------|-----------|-------|
| 1 | **Policy Expiry Date** | Always | Pre-fill if fetched from IIB or entered during pre-quote. If unknown, ask the user to enter it. Explain: _"We need your previous policy's expiry date to start your new policy on time and ensure your two-wheeler has continued coverage without any gap."_ |
| 2 | **Previous Policy Type** | Only if user has selected OD or Comprehensive plan | Ask the user: _"What type of plan did you have previously?"_ — options: Comprehensive / Third Party. This helps determine coverage continuity. |
| 3 | **Full Name** | Always | Name of the policyholder. Pre-fill if available. |
| 4 | **Email Address** | Always | Policy documents and claim updates will be sent here. |
| 5 | **Pincode** | Always | Used for pricing and zone-based underwriting. |
| 6 | **Phone Number** | Only if user is not logged in | Policy mapped to the ACKO account linked to this number. |

---

### Inspection Logic

Bike insurance does not involve a vehicle inspection step. Once all details above are confirmed → proceed directly to the **Review Screen**.

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

**Bike & Personal Details**
- Bike make, model, registration year
- Policyholder name, email, pincode, phone number

**Coverage Details**

| Detail | Value |
|--------|-------|
| Plan | Selected plan name (e.g., Comprehensive / OD / Third Party) |
| Tenure | Selected tenure (1 Year / 2 Years / 3 Years) |
| Add-ons | List of all selected add-ons |
| IDV | Insured Declared Value of the two-wheeler |
| NCB | No Claim Bonus percentage applied |

**Premium Breakup**
- Base premium
- Add-on premiums (itemised per add-on)
- NCB discount applied (shown as a deduction)
- Coupon discount applied (shown as a deduction, if applicable)
- GST
- **Total payable amount** — prominently displayed

**Policy Start Date**
- Display the policy start date with a brief note: _"Your policy starts on `<date>`. Your two-wheeler will be covered from this date."_

---

### CTA

- **"Pay Now"** — primary action button, always visible at the bottom of the screen.
- Tapping Pay Now takes the user to the payment gateway.

---

## Test Cases — Dummy Registration Numbers

_To be defined — dummy registration numbers covering key test scenarios across API fetch combinations, plan combinations, and inspection requirements._

---

## Journey 2 — New Bike Buyer (First-Time Insurance Purchase)

### Purpose

This journey covers a customer who has just purchased or is in the process of purchasing a brand new two-wheeler and needs to insure it for the first time. The flow is identical to Journey 1 with the following exceptions:

1. **No previous policy details collected** — policy expiry date and previous policy type are not asked at any stage (pre-quote or confirm details).
2. **Return to Invoice add-on is available** — an additional add-on not offered in Journey 1.
3. **Different plan structure** — only two plans are offered, both with bundled multi-year TP coverage.

---

### Bike and User Details — New Bike Journey

Since the customer does not have a registration number yet, all details are collected manually in a one-question-at-a-time flow.

**Questions asked (in order):**

| # | Question / Field | Condition |
|---|-----------------|-----------|
| 1 | Bike Make | Always |
| 2 | Bike Model | Always |
| 3 | Phone Number | Only if user is not logged in |

No policy details (expiry date, policy type) are asked — this is a brand new bike with no prior insurance history.

---

### Request for Quote and Handling Blocked Users

Same as Journey 1:
- Quote request sent to backend after all mandatory fields are filled.
- If no plans returned → inform the user ACKO cannot offer plans at this time.
- If plans returned → proceed to plan selection.

---

### Plan Selection — New Bike Journey

New bike buyers are offered **two plans only**, both structured with bundled multi-year Third Party coverage as mandated for new two-wheelers.

---

#### Step 1 — Plan Selection

| Plan | What it covers | Structure |
|------|---------------|-----------|
| **Third Party (5 Year)** | Legal liabilities towards third parties only. Does not cover damage to the user's own bike. | 5-year TP coverage |
| **Comprehensive** | Damage to the user's own bike + legal liabilities towards third parties. | 5-year TP coverage + 1-year Own Damage coverage |

**Recommendation logic:** Always recommend **Comprehensive** for new bike buyers — it provides complete protection including own damage for the first year.

**Plan card display:**
- Show both plans as selectable cards with prices.
- Comprehensive card gets the **"Recommended"** tag.
- Clearly explain the bundled structure on each card (e.g., _"Includes 5-year Third Party cover + 1-year Own Damage cover"_).

#### Step 2 — Tenure Selection

Not applicable for new bike plans — the tenure is fixed by the plan structure (5-year TP, 1-year OD for Comprehensive; 5-year TP for Third Party only). No tenure selection step is shown.

---

### Add-on Selection — New Bike Journey

Identical to Journey 1 with one addition: **Return to Invoice** is available as an extra add-on.

**Add-ons that protect your family:**

| Add-on | Card Copy |
|--------|-----------|
| **Personal Accident Cover** | Pays up to ₹15 lakh if the bike owner is permanently disabled or dies in an accident. |
| **Pillion Rider Cover** | Pays up to ₹2 lakh if your co-passenger is permanently disabled or dies in an accident. |
| **Helmet Protect** | Get up to ₹1,000 for helmet damage or theft, if your bike is also involved in the same incident. |

**Add-ons that protect your bike:**

| Add-on | Card Copy |
|--------|-----------|
| **Engine Protect** | Covers damage to your bike's engine due to water ingression, oil leakage, or hydrostatic lock — damage not covered under a standard policy. |
| **Consumables Cover** | Covers the cost of consumables like nuts, bolts, brake oil, engine oil etc. that get replaced during repairs. |
| **Zero Depreciation** | Pays the full cost of parts replaced during a claim with no depreciation deducted — minimises your out-of-pocket expenses. |
| **Return to Invoice** | Receive the complete invoice value (including registration charges and road tax) or the current on-road price, whichever is lower, if your bike is stolen or damaged beyond repair. |

**Display rules:** Same as Journey 1 — two categories, no Recommended tags, user freely selects and proceeds.

---

### Confirm Details — New Bike Journey

Same as Journey 1 with policy-related questions removed.

**Questions asked (in order):**

| # | Question / Field | Condition |
|---|-----------------|-----------|
| 1 | Full Name | Always |
| 2 | Email Address | Always |
| 3 | Pincode | Always |
| 4 | Phone Number | Only if user is not logged in |

No policy expiry date or previous policy type questions — not applicable for a new bike.

Once confirmed → proceed to the **Review Screen**.

---

### Review Section — New Bike Journey

Identical to Journey 1 with the following simplifications:
- No NCB deduction in the premium breakup (NCB = 0 for new bikes).
- No previous policy type in coverage details.
- Policy start date shown cleanly with no inspection or expiry-based complications.

**Coverage details table:**

| Detail | Value |
|--------|-------|
| Plan | Selected plan (e.g., Comprehensive / Third Party 5-Year) |
| Add-ons | List of all selected add-ons |
| IDV | Insured Declared Value of the two-wheeler |

**Premium breakup:**
- Base premium
- Add-on premiums (itemised)
- Coupon discount (if applied)
- GST
- **Total payable amount**

**CTA: "Pay Now"** — leads to payment gateway.

---

### Key Differences vs Journey 1

| Step | Journey 1 (Existing owner) | Journey 2 (New bike buyer) |
|------|---------------------------|--------------------------|
| Pre-quote data collection | Make, Model, Policy expiry, Phone | Make, Model, Phone — no policy details |
| Plans offered | Comprehensive, OD (if < 5 yrs active TP), Third Party | Comprehensive (5yr TP + 1yr OD) · Third Party (5yr TP) |
| Tenure selection | 1 / 2 / 3 years | Fixed by plan — no tenure selection |
| Return to Invoice add-on | Not available | Available |
| NCB | May be > 0 | Always 0% |
| Confirm details | Policy expiry + policy type + personal details | Personal details only |
| Inspection | Not applicable for bikes | Not applicable |

---
