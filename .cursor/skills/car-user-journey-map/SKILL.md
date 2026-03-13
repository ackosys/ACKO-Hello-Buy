---
name: car-user-journey-map
description: Complete user journey map for the ACKO car insurance flow. Covers renewal and brand new branches, login gates (skippable and mandatory), data collection, preliminary checks, plan selection (all combinations), add-on personalisation, owner details, payment, and post-purchase — all documented as flowcharts.
---

# User Journey Map — Car Insurance

This document maps the **complete end-to-end user journey** for car insurance on the ACKO conversational buy platform. It is the single source of truth for how a user moves through every screen, decision point, validation, and login gate — from the moment they land on the homepage to the post-purchase experience.

---

## Table of Contents

1. [Master Journey Overview](#1-master-journey-overview)
2. [Entry & Vehicle Type Selection](#2-entry--vehicle-type-selection)
3. [Renewal vs Brand New Fork](#3-renewal-vs-brand-new-fork)
4. [Branch A — Renewal (Existing Vehicle)](#4-branch-a--renewal-existing-vehicle)
5. [Branch B — Brand New Vehicle](#5-branch-b--brand-new-vehicle)
6. [Login Logic — Skippable & Mandatory Gates](#6-login-logic--skippable--mandatory-gates)
7. [Quote & Plan Selection](#7-quote--plan-selection)
8. [Plan Combination Routing](#8-plan-combination-routing)
9. [Add-on Personalisation](#9-add-on-personalisation)
10. [Owner Details & Pre-Payment](#10-owner-details--pre-payment)
11. [Payment & Post-Purchase](#11-payment--post-purchase)
12. [PWILO — Pick Up Where I Left Off](#12-pwilo--pick-up-where-i-left-off)
13. [Step Reference Table](#13-step-reference-table)

---

## 1. Master Journey Overview

This is the highest-level view of the entire car insurance journey. Both renewal and brand new flows converge at the quote & plan selection stage.

```mermaid
flowchart TB
    START([User lands on Homepage]) --> HOME_ACTION{User action}
    HOME_ACTION -->|Clicks 'Car Insurance'| MOTOR_PAGE[Motor Page Loads]
    HOME_ACTION -->|PWILO card 'Continue'| RESUME[Resume from Snapshot]

    MOTOR_PAGE --> INIT{Initialisation}
    INIT -->|Default entry| REG_HAS_NUM[registration.has_number]
    INIT -->|Dashboard param| DASHBOARD[Dashboard Welcome]
    INIT -->|Resume param + snapshot| RESTORE_SNAP[Restore Snapshot State]

    RESUME --> RESTORE_SNAP
    RESTORE_SNAP --> RESTORED_STEP[Jump to saved step]

    REG_HAS_NUM --> FORK{Renewal or Brand New?}
    FORK -->|Renew existing car| BRANCH_A[Branch A: Renewal]
    FORK -->|Insure a new car| BRANCH_B[Branch B: Brand New]

    BRANCH_A --> DATA_COLLECT[Data Collection]
    BRANCH_B --> DATA_COLLECT_BN[Brand New Data Collection]

    DATA_COLLECT --> LOGIN_PREQUOTE{Logged in?}
    DATA_COLLECT_BN --> LOGIN_BN{Logged in?}

    LOGIN_PREQUOTE -->|Yes| QUOTE_CALC
    LOGIN_PREQUOTE -->|No| SKIP_LOGIN_PREQUOTE[Skippable Login Gate]
    SKIP_LOGIN_PREQUOTE --> QUOTE_CALC

    LOGIN_BN -->|Yes| QUOTE_CALC
    LOGIN_BN -->|No| MANDATORY_LOGIN_BN[Mandatory Login Before Plans]
    MANDATORY_LOGIN_BN --> QUOTE_CALC

    QUOTE_CALC[Quote Calculation] --> PLAN_SELECT[Plan Selection]
    PLAN_SELECT --> ADDONS[Add-on Personalisation]
    ADDONS --> OWNER_DETAILS[Owner Details]
    OWNER_DETAILS --> LOGIN_MANDATORY{Logged in?}
    LOGIN_MANDATORY -->|Yes| REVIEW[Premium Review]
    LOGIN_MANDATORY -->|No| MANDATORY_LOGIN[Mandatory Login]
    MANDATORY_LOGIN --> REVIEW
    REVIEW --> PAYMENT[Payment]
    PAYMENT --> POST_PURCHASE[Post-Purchase]
    POST_PURCHASE --> END([Journey Complete])
```

---

## 2. Entry & Vehicle Type Selection

The journey begins when the user selects "Car Insurance" from the homepage. The motor page initialises and routes the user to the first conversational step.

```mermaid
flowchart TB
    HP([Homepage]) --> CAR_CLICK[User clicks 'Car Insurance']
    CAR_CLICK --> MOTOR_INIT[Motor Page useEffect runs]

    MOTOR_INIT --> RESET[resetJourney — clear all state]
    RESET --> READ_PARAMS[Read URL params: vehicle, resume, journeyId, screen]

    READ_PARAMS --> SCREEN_CHECK{screen param?}
    SCREEN_CHECK -->|dashboard| SEED_DASHBOARD[Seed demo state + go to db.welcome]
    SCREEN_CHECK -->|resume=1 + snapshot exists| RESTORE[Restore snapshot → jump to saved step]
    SCREEN_CHECK -->|default / none| DEFAULT_ENTRY[Set vehicleType=car]

    DEFAULT_ENTRY --> SET_STEP["Set currentStepId = 'registration.has_number'"]
    SET_STEP --> SHOW_CHAT[Render MotorChatContainer]

    SEED_DASHBOARD --> SHOW_CHAT
    RESTORE --> SHOW_CHAT
```

**Key behaviour:**
- All users bypass `LoginChatFlow` and enter `MotorChatContainer` directly
- Vehicle type defaults to `car` (URL param `vehicle=bike` switches to bike)
- The first visible step is always `registration.has_number`

---

## 3. Renewal vs Brand New Fork

The first user-facing question determines the entire journey branch.

```mermaid
flowchart TB
    REG_HAS_NUM["registration.has_number<br/>Bot: 'Looking for car insurance?'<br/>Widget: selection_cards"]

    REG_HAS_NUM --> USER_CHOICE{User selects}

    USER_CHOICE -->|"Renew / Transfer"| SET_EXISTING["vehicleEntryType = 'existing'"]
    USER_CHOICE -->|"Insure a new car"| SET_BRAND_NEW["vehicleEntryType = 'brand_new'"]

    SET_EXISTING --> ENTER_REG["registration.enter_number<br/>→ Branch A: Renewal"]
    SET_BRAND_NEW --> CONGRATS["manual_entry.congratulations<br/>→ Branch B: Brand New"]
```

**Validation:**
- `vehicleEntryType` is set to `existing` or `brand_new` — this controls routing throughout the rest of the journey

---

## 4. Branch A — Renewal (Existing Vehicle)

This branch handles users who have an existing car and want to renew or transfer their insurance.

```mermaid
flowchart TB
    ENTER_REG["registration.enter_number<br/>Widget: vehicle_reg_input<br/>Validation: uppercase, no spaces"]
    ENTER_REG --> FETCH["vehicle_fetch.loading<br/>Widget: progressive_loader<br/>'Fetching details for KA01AB1234...'"]

    FETCH --> FETCH_RESULT{API fetch result}

    FETCH_RESULT -->|Success| PRELIM["prelim.check<br/>Run preliminary checks"]
    FETCH_RESULT -->|Failure| MANUAL["manual_entry.start<br/>'Couldn't find details, let's enter manually'"]

    PRELIM --> PRELIM_RESULT{Prelim check result}

    PRELIM_RESULT -->|clear| VERIFY_CARD["vehicle_fetch.found<br/>Widget: vehicle_details_card<br/>Show auto-fetched fields"]
    PRELIM_RESULT -->|insured_same_user| P_SAME["prelim.insured_same_user<br/>'Already insured with ACKO'<br/>Options: View policy / Edit reg"]
    PRELIM_RESULT -->|insured_different_user| P_DIFF["prelim.insured_different_user<br/>'Policy belongs to xxxx5511'<br/>Options: Buying car / Login other / Edit reg"]
    PRELIM_RESULT -->|two_wheeler_entered| P_TW["prelim.two_wheeler_entered<br/>'This is a two-wheeler'<br/>Options: Continue TW / Edit reg"]
    PRELIM_RESULT -->|payment_pending_steps| P_PAY["prelim.payment_pending<br/>'Payment done, pending steps'<br/>Options: Complete steps / Edit reg"]

    P_SAME -->|View policy| END_VIEW([View policy])
    P_SAME -->|Edit reg| ENTER_REG
    P_DIFF -->|Buying car| VERIFY_CARD
    P_DIFF -->|Login other| ENTER_REG
    P_DIFF -->|Edit reg| ENTER_REG
    P_TW -->|Continue TW| VERIFY_CARD
    P_TW -->|Edit reg| ENTER_REG
    P_PAY -->|Complete steps| POST_STATUS([Post-purchase status])
    P_PAY -->|Edit reg| ENTER_REG

    VERIFY_CARD --> USER_CONFIRMS{User confirms or edits}
    USER_CONFIRMS -->|Confirm| MISSING_FIELDS["getNextMissingFieldStep()<br/>Dynamic routing based on<br/>what was/wasn't fetched"]
    USER_CONFIRMS -->|Retry / edit reg| ENTER_REG

    MANUAL --> SELECT_BRAND["manual_entry.select_brand"]
    SELECT_BRAND --> SELECT_MODEL["manual_entry.select_model"]
    SELECT_MODEL --> SELECT_FUEL["manual_entry.select_fuel"]
    SELECT_FUEL --> SELECT_VARIANT["manual_entry.select_variant<br/>(cars only)"]
    SELECT_VARIANT --> SELECT_YEAR["manual_entry.select_year"]
    SELECT_YEAR --> MISSING_FIELDS

    MISSING_FIELDS --> DATA_COLLECTION[/"Dynamic Data Collection<br/>(see next diagram)"/]
```

### Dynamic Data Collection (Renewal)

After the verify card, the system asks **only** for fields that were not auto-fetched, in strict order.

```mermaid
flowchart TB
    START_MISSING["getNextMissingFieldStep()"] --> CHECK_CAR{Car details fetched?}

    CHECK_CAR -->|No — any car field missing| ASK_CAR["Ask: Make → Model → Fuel → Variant → Year<br/>(only missing ones, in order)"]
    CHECK_CAR -->|Yes| CHECK_COMMERCIAL{Commercial check done?}

    ASK_CAR --> CHECK_COMMERCIAL

    CHECK_COMMERCIAL -->|No — car only| COMMERCIAL["pre_quote.commercial_check<br/>'Personal or commercial use?'"]
    CHECK_COMMERCIAL -->|Yes or bike| CHECK_POLICY{Policy details fetched?}

    COMMERCIAL -->|Personal| CHECK_POLICY
    COMMERCIAL -->|Commercial| REJECT["pre_quote.commercial_rejection<br/>'Cannot cover commercial vehicles'<br/>Dead end"]

    CHECK_POLICY -->|No| ASK_POLICY_TYPE["pre_quote.policy_type_ask<br/>'What type of policy did you have?'<br/>Comprehensive / Third Party / Not sure"]
    CHECK_POLICY -->|Yes| CHECK_PINCODE

    ASK_POLICY_TYPE --> ASK_POLICY_STATUS["pre_quote.policy_status<br/>'Active, Expired, or Not sure?'"]

    ASK_POLICY_STATUS -->|Active| CLAIM_HISTORY["pre_quote.claim_history<br/>'Any claims this year?'"]
    ASK_POLICY_STATUS -->|Expired / Not sure| EXPIRED_FLOW["Expired flow:<br/>expired_policy_type →<br/>expiry_window →<br/>expired_claim_history →<br/>expired_insurer"]

    CLAIM_HISTORY --> CHECK_NCB{NCB fetched?}
    EXPIRED_FLOW --> CHECK_PINCODE

    CHECK_PINCODE{Pincode collected?} -->|No| ASK_PINCODE["pre_quote.pincode_ask<br/>'Pincode where car is registered?'"]
    CHECK_PINCODE -->|Yes| CHECK_LOGIN

    ASK_PINCODE --> CHECK_LOGIN

    CHECK_LOGIN{User logged in?} -->|No| SKIP_GATE["login.phone_gate_prequote<br/>Widget: login_gate_skippable<br/>'Verify your phone for personalised plans'<br/>Can skip or complete"]
    CHECK_LOGIN -->|Yes| CHECK_NCB

    SKIP_GATE --> CHECK_NCB

    CHECK_NCB -->|No — policy fetched but NCB missing| ASK_NCB["pre_quote.ncb_selection<br/>Widget: ncb_selector<br/>'What is your NCB %?'"]
    CHECK_NCB -->|Yes| CHECK_CLAIM

    ASK_NCB --> NCB_REWARD{NCB increased?}
    NCB_REWARD -->|Yes| SHOW_REWARD["pre_quote.ncb_reward<br/>'Your NCB increased to X%!'"]
    NCB_REWARD -->|No| CHECK_CLAIM
    SHOW_REWARD --> CHECK_CLAIM

    CHECK_CLAIM{Last claim fetched?} -->|No| ASK_CLAIM["pre_quote.last_claim_ask<br/>'Did you claim last year?'"]
    CHECK_CLAIM -->|Yes| CHECK_CNG

    ASK_CLAIM --> CHECK_CNG

    CHECK_CNG{CNG check done?} -->|No — car only| ASK_CNG["pre_quote.cng_check<br/>'External CNG kit fitted?'"]
    CHECK_CNG -->|Yes or bike| SUMMARY

    ASK_CNG --> SUMMARY

    SUMMARY["pre_quote.summary<br/>Widget: editable_summary<br/>'Review your details'"]
    SUMMARY --> VIEW_PRICES["pre_quote.view_prices<br/>'Fetching plans...'"]
    VIEW_PRICES --> LOGIN_CHECK_2{Logged in?}
    LOGIN_CHECK_2 -->|Yes| QUOTE_CALC([→ Quote Calculation])
    LOGIN_CHECK_2 -->|No| MANDATORY_BEFORE_PLANS["login.phone_gate_before_plans<br/>Widget: login_gate_mandatory<br/>MUST complete to see plans"]
    MANDATORY_BEFORE_PLANS --> QUOTE_CALC
```

---

## 5. Branch B — Brand New Vehicle

This branch handles users buying a new car who need insurance before or at delivery.

```mermaid
flowchart TB
    CONGRATS["manual_entry.congratulations<br/>'Exciting! A brand new car!'<br/>'We can save you up to 75%'"]
    CONGRATS --> POPULAR["brand_new.popular_cars<br/>Widget: selection_cards<br/>Show popular cars + 'Other' option"]

    POPULAR --> POP_CHOICE{User selects}
    POP_CHOICE -->|Popular car| SET_MAKE_MODEL["Set make + model from selection"]
    POP_CHOICE -->|'Other'| MANUAL_BRAND["manual_entry.select_brand"]

    MANUAL_BRAND --> MANUAL_MODEL["manual_entry.select_model"]
    MANUAL_MODEL --> FUEL["manual_entry.select_fuel"]
    SET_MAKE_MODEL --> FUEL

    FUEL --> VARIANT["manual_entry.select_variant<br/>(cars only, sets regYear = current year)"]

    VARIANT --> COMMERCIAL_BN{Car only}
    COMMERCIAL_BN --> COMMERCIAL_CHECK["brand_new.commercial_check<br/>'Personal or commercial?'"]
    COMMERCIAL_CHECK -->|Personal| DELIVERY
    COMMERCIAL_CHECK -->|Commercial| REJECT["pre_quote.commercial_rejection<br/>Dead end"]

    DELIVERY["brand_new.delivery_date<br/>'When is delivery?'<br/>Today/Tomorrow / Next week / 2 weeks / Not sure"]
    DELIVERY --> MOBILE["brand_new.mobile_pincode<br/>Widget: text_input (tel)<br/>'Your mobile number?'"]
    MOBILE --> PINCODE_BN["brand_new.pincode<br/>Widget: text_input (tel)<br/>'Your pincode?'"]
    PINCODE_BN --> SUMMARY_BN["brand_new.summary<br/>Widget: editable_summary<br/>'Here are your car details'"]
    SUMMARY_BN --> VIEW_PRICES_BN["brand_new.view_prices<br/>'Fetching plans...'"]
    VIEW_PRICES_BN --> QUOTE_CALC([→ Quote Calculation])
```

**Key differences from renewal:**
- No registration number needed
- Popular car shortcuts speed up entry
- Commercial check is inline (not deferred)
- Mobile and pincode collected before summary
- Delivery window collected (not relevant for renewal)

---

## 6. Login Logic — Skippable & Mandatory Gates

Login gates appear at strategic points in the journey. The skippable gate collects the phone early for a better experience; the mandatory gate ensures login before critical steps.

```mermaid
flowchart TB
    subgraph SKIPPABLE ["Skippable Login Gate"]
        direction TB
        S_TRIGGER["Triggered at:<br/>• login.phone_gate_prequote (during data collection)<br/>• login.phone_gate (after owner name)"]
        S_TRIGGER --> S_CHECK{User logged in?}
        S_CHECK -->|Yes| S_SKIP_AUTO["Gate auto-skipped<br/>Proceed to next step"]
        S_CHECK -->|No| S_SHOW["Show login_gate_skippable widget<br/>'Verify your phone for personalised plans'<br/>'Lets us save your progress'"]
        S_SHOW --> S_ACTION{User action}
        S_ACTION -->|Enter phone + OTP| S_LOGIN["Login successful<br/>Phone verified"]
        S_ACTION -->|'Skip for now'| S_SKIPPED["Login skipped<br/>Continue without login"]
        S_LOGIN --> S_NEXT["Proceed to next step"]
        S_SKIPPED --> S_NEXT
    end

    subgraph MANDATORY ["Mandatory Login Gate"]
        direction TB
        M_TRIGGER["Triggered at:<br/>• login.phone_gate_before_plans (before showing quotes)<br/>• login.phone_gate_mandatory (before payment review)"]
        M_TRIGGER --> M_CHECK{User logged in?}
        M_CHECK -->|Yes| M_SKIP["Gate auto-skipped"]
        M_CHECK -->|No| M_SHOW["Show login_gate_mandatory widget<br/>'We need your phone to continue'<br/>No skip button"]
        M_SHOW --> M_OTP["User enters phone + OTP<br/>(must complete)"]
        M_OTP --> M_DONE["Login successful → proceed"]
        M_SKIP --> M_DONE
    end
```

### Login Gate Placement in the Journey

```mermaid
flowchart LR
    subgraph "Renewal Flow"
        R1[Data Collection] -->|if not logged in| R_SKIP["🔓 Skippable Gate<br/>login.phone_gate_prequote"]
        R_SKIP --> R2[Continue data collection]
        R2 --> R3[Summary → View Prices]
        R3 -->|if not logged in| R_MAND["🔒 Mandatory Gate<br/>login.phone_gate_before_plans"]
        R_MAND --> R4[Quote Calculation]
    end

    subgraph "Brand New Flow"
        B1[Vehicle details + Mobile + Pincode] --> B2[Summary → View Prices]
        B2 --> B3[Quote Calculation]
    end

    subgraph "Post Add-ons (Both Flows)"
        P1[Add-ons Complete] --> P2[Owner Details]
        P2 -->|after owner name, if not logged in| P_SKIP["🔓 Skippable Gate<br/>login.phone_gate"]
        P_SKIP --> P3[Owner Email + other details]
        P3 -->|if not logged in| P_MAND["🔒 Mandatory Gate<br/>login.phone_gate_mandatory"]
        P_MAND --> P4[Premium Review]
    end
```

### OTP Verification Flow

```mermaid
flowchart TB
    GATE["Login Gate Widget"] --> PHONE_INPUT["Phone number input<br/>Validation: 10-digit Indian mobile"]
    PHONE_INPUT --> SEND_OTP["Send OTP to phone"]
    SEND_OTP --> OTP_INPUT["OTP input (4 digits)<br/>Auto-focus, countdown timer"]
    OTP_INPUT --> VERIFY{OTP correct?}
    VERIFY -->|Yes| SUCCESS["✓ Login success<br/>Update userProfileStore<br/>Set isLoggedIn = true"]
    VERIFY -->|No| RETRY["Show error<br/>'Incorrect OTP, try again'<br/>Allow resend"]
    RETRY --> OTP_INPUT
    SUCCESS --> NEXT[Proceed to next step]
```

---

## 7. Quote & Plan Selection

After all data is collected, the system calculates quotes and presents plan options.

```mermaid
flowchart TB
    CALC["quote.calculating<br/>Widget: plan_calculator<br/>'Fetching personalised quotes...'<br/>Stages: Analysing vehicle → Calculating IDV →<br/>Checking NCB → Building plans"]
    CALC --> PLANS_READY["quote.plans_ready<br/>'We found the best plans for your Make Model'"]
    PLANS_READY --> PLAN_SELECT["quote.plan_selection<br/>Widget: plan_selector<br/>Shows plan cards"]

    PLAN_SELECT --> USER_ACTION{User action}

    USER_ACTION -->|Select a plan card| PLAN_CLICK["handlePlanClick()<br/>Routing depends on plan type"]
    USER_ACTION -->|'Help me choose'| HELP_FLOW["Help Me Choose flow<br/>(4 questions → AI recommendation)"]

    PLAN_CLICK --> TYPE_CHECK{Plan type?}

    TYPE_CHECK -->|Comprehensive| COMP_CLICK{"Zero Dep plans available?"}
    COMP_CLICK -->|Yes| ZD_VS_STD["Bottom Sheet: ZD vs Standard<br/>'Do you want Zero Depreciation?'<br/>Compare section with worked example"]
    COMP_CLICK -->|No, multiple comp variants| GARAGE_TIER["Bottom Sheet: Garage Tier<br/>Network Garage vs Standard"]
    COMP_CLICK -->|No, single variant| DIRECT_SELECT["Direct selection → onSelect"]

    ZD_VS_STD --> ZD_CHOICE{User chooses}
    ZD_CHOICE -->|Zero Depreciation| ZD_VARIANT_CHECK{"Multiple ZD variants?"}
    ZD_CHOICE -->|Standard Comprehensive| COMP_VARIANT_CHECK{"Multiple comp variants?"}

    ZD_VARIANT_CHECK -->|Yes| ZD_VARIANT["Bottom Sheet: ZD Variant<br/>Safe Driver vs Standard"]
    ZD_VARIANT_CHECK -->|No| DIRECT_SELECT
    COMP_VARIANT_CHECK -->|Yes| GARAGE_TIER
    COMP_VARIANT_CHECK -->|No| DIRECT_SELECT

    ZD_VARIANT --> DIRECT_SELECT
    GARAGE_TIER --> DIRECT_SELECT

    TYPE_CHECK -->|Third Party| DIRECT_SELECT
    TYPE_CHECK -->|OD / OD ZD| OD_CHECK{"Multiple OD variants?"}
    OD_CHECK -->|Yes| OD_VARIANT["Bottom Sheet: OD Variant<br/>OD ZD variants"]
    OD_CHECK -->|No| DIRECT_SELECT
    OD_VARIANT --> DIRECT_SELECT

    DIRECT_SELECT --> SELECTED["quote.plan_selected<br/>'Good choice. Now let's personalise add-ons.'"]
    SELECTED --> ADDONS([→ Add-on Personalisation])

    HELP_FLOW --> USAGE["help.usage_pattern<br/>'How do you use your car?'<br/>Daily / Weekend / Commercial"]
    USAGE --> AGE_Q["help.vehicle_age<br/>'How old is your car?'<br/>New / 1-3 / 3-5 / 5+"]
    AGE_Q --> BUDGET["help.budget_priority<br/>'What matters most?'<br/>Max coverage / Balanced / Affordable"]
    BUDGET --> REPAIR["help.repair_preference<br/>'What matters for repairs?'<br/>Full parts / Any garage / Low premium"]
    REPAIR --> REC["help.recommendation<br/>Widget: plan_recommendation<br/>'Based on your answers: [Plan Type]'"]
    REC --> REC_ACTION{User action}
    REC_ACTION -->|Accept recommendation| SELECTED
    REC_ACTION -->|'View all plans'| PLAN_SELECT
```

---

## 8. Plan Combination Routing

The system determines which plan combination to serve based on vehicle age and policy status.

```mermaid
flowchart TB
    DET["determinePlanCombination()"] --> TP_ACTIVE{"Active TP policy<br/>+ car age 1–3 years?"}

    TP_ACTIVE -->|Yes| OD_COMBOS["OD Combinations<br/>(User only needs OD renewal)"]
    TP_ACTIVE -->|No| FULL_COMBOS["Full Combinations"]

    OD_COMBOS --> OD_AGE{Vehicle age?}
    OD_AGE -->|≤ 1 year| OD3["OD-3: OD + OD ZD Safe + OD ZD Standard"]
    OD_AGE -->|≤ 2 years| OD2["OD-2: OD + OD ZD Safe"]
    OD_AGE -->|≤ 3 years| OD1["OD-1: OD only"]

    FULL_COMBOS --> FULL_AGE{Vehicle age?}
    FULL_AGE -->|≤ 1 year| F["F: TP + Comp Std + Comp Network +<br/>ZD Safe + ZD Standard"]
    FULL_AGE -->|≤ 3 years| E["E: TP + Comp Std + Comp Network +<br/>ZD Safe"]
    FULL_AGE -->|≤ 5 years| D["D: TP + Comp Std + Comp Network"]
    FULL_AGE -->|> 5 years| C["C: TP + Comp Std"]
```

### Plan Cards Displayed

```mermaid
flowchart TB
    subgraph "What the user sees on the plan selector screen"
        CARD_COMP["📋 Comprehensive Card<br/>TAG: 'Recommended'<br/>Starting from ₹X,XXX/yr<br/>✓ Covers theft, fire, accidents<br/>✓ Covers damage to others<br/>✓ Cashless repairs<br/>✓ Real-time updates<br/>✓ Free pickup & drop<br/>Subtitle: 'Includes Zero Depreciation option'<br/>(if ZD plans available)<br/>Button: 'Explore plan'"]

        CARD_TP["📋 Third Party Card<br/>TAG: 'Minimum cover required by law' (amber)<br/>Starting from ₹X,XXX/yr<br/>✓ Covers damage to others<br/>✗ Does not cover your own car<br/>✗ No cashless repair benefit<br/>Button: 'Explore plan'"]

        CARD_OD["📋 OD Card (when active TP exists)<br/>TAG: 'For cars with active TP' (amber)<br/>Starting from ₹X,XXX/yr<br/>Button: 'Explore plan'"]
    end
```

### Bottom Sheet Flows After Plan Card Click

```mermaid
flowchart TB
    subgraph "Comprehensive → Bottom Sheet Flow"
        C_CLICK["User clicks 'Explore plan'<br/>on Comprehensive card"]
        C_CLICK --> C_ZD_CHECK{"ZD plans available?<br/>(Combinations E or F)"}

        C_ZD_CHECK -->|Yes| BS_ZD_VS_STD["Bottom Sheet 1: ZD vs Standard<br/>'Do you want Zero Depreciation cover?'<br/>┌──────────────────────────┐<br/>│ Zero Depreciation (Rec.) │<br/>│ Starting from ₹X,XXX/yr  │<br/>│ ✓ Full cost of parts     │<br/>│ ✓ Zero out-of-pocket     │<br/>├──────────────────────────┤<br/>│ Standard Comprehensive   │<br/>│ Starting from ₹X,XXX/yr  │<br/>│ ✓ Parts after depreciation│<br/>│ ℹ 20-30% out-of-pocket   │<br/>├──────────────────────────┤<br/>│ Compare: Bumper ₹15,000  │<br/>│ ZD: You pay ₹0           │<br/>│ Std: You pay ₹3-4.5K     │<br/>└──────────────────────────┘"]

        BS_ZD_VS_STD -->|Zero Dep| ZD_VARIANT_CHECK2{"Multiple ZD variants?<br/>(Combination F)"}
        BS_ZD_VS_STD -->|Standard| COMP_VARIANT_CHECK2{"Multiple comp variants?<br/>(Combinations D, E, F)"}

        ZD_VARIANT_CHECK2 -->|Yes| BS_ZD_VAR["Bottom Sheet 2: ZD Variant<br/>┌───────────────────────────────┐<br/>│ TAG: Recommended · Best value │<br/>│ ZD · Safe Driver              │<br/>│ ₹X,XXX/yr                    │<br/>│ ✓ Built for responsible owners│<br/>│ ✓ Lower premium               │<br/>│ ⚡ Claim: ₹5,000 deductible  │<br/>├───────────────────────────────┤<br/>│ ZD · Standard                 │<br/>│ ₹X,XXX/yr (higher)           │<br/>│ ✓ No deductions of any kind   │<br/>│ (or GREYED if unavailable)    │<br/>└───────────────────────────────┘"]
        ZD_VARIANT_CHECK2 -->|No (only Safe Driver)| SELECT_DONE

        COMP_VARIANT_CHECK2 -->|Yes| BS_GARAGE["Bottom Sheet 2: Garage Tier<br/>┌───────────────────────────────┐<br/>│ TAG: Recommended · Managed    │<br/>│ Comp · Network Garage         │<br/>│ ₹X,XXX/yr                    │<br/>│ ✓ All Comp benefits + lower   │<br/>│ ✓ Fully managed claims        │<br/>│ ⚡ ₹5K deductible outside net │<br/>│ [See garages near you →]      │<br/>├───────────────────────────────┤<br/>│ Comp · Standard               │<br/>│ ₹X,XXX/yr (higher)           │<br/>│ ✓ Any GST garage, no limits   │<br/>│ (or GREYED if unavailable)    │<br/>└───────────────────────────────┘"]
        COMP_VARIANT_CHECK2 -->|No| SELECT_DONE

        C_ZD_CHECK -->|No, multiple comp variants| BS_GARAGE
        C_ZD_CHECK -->|No, single comp variant| SELECT_DONE

        BS_ZD_VAR --> SELECT_DONE
        BS_GARAGE --> SELECT_DONE

        SELECT_DONE["Plan selected → Proceed to add-ons"]
    end
```

---

## 9. Add-on Personalisation

After plan selection, personalisation questions determine which add-ons are recommended.

```mermaid
flowchart TB
    START_ADDONS["addons.paid_driver_question<br/>'Do you have a paid/hired driver?'<br/>Yes / No"]
    START_ADDONS --> ACCESSORIES["addons.accessories_question<br/>'Any electrical/non-electrical accessories<br/>fitted after purchase?'<br/>Yes / No"]

    ACCESSORIES --> PLAN_CHECK{Selected plan type?}
    PLAN_CHECK -->|Third Party| PROTECT["addons.protect_everyone<br/>(No OD add-ons for TP)"]
    PLAN_CHECK -->|Any OD-based plan| OOP["addons.out_of_pocket<br/>Widget: out_of_pocket_addons<br/>'Add-ons that cover your car'"]

    OOP --> PROTECT["addons.protect_everyone<br/>Widget: protect_everyone_addons<br/>'Add-ons that cover your family'"]

    PROTECT --> COMPLETE["addons.complete<br/>'X add-ons selected.<br/>Let's build your final premium.'"]

    COMPLETE --> OWNER([→ Owner Details])
```

### Add-on Recommendation Logic

```mermaid
flowchart TB
    subgraph "Recommendation Engine"
        AGE_CHECK{Vehicle age?}
        AGE_CHECK -->|< 8 years| BASE_YOUNG["Base: Engine Protect + Extra Car +<br/>Personal Accident + Passenger Protect"]
        AGE_CHECK -->|≥ 8 years| BASE_OLD["Base: Extra Car +<br/>Personal Accident + Passenger Protect"]

        BASE_YOUNG --> LAYER
        BASE_OLD --> LAYER

        LAYER["Additional rules layered on top:"]
        LAYER --> L1{"Age ≤ 3?"}
        L1 -->|Yes| ADD_RTI["+ Return to Invoice"]
        L1 -->|No| L2

        ADD_RTI --> L2{"NCB > 0?"}
        L2 -->|Yes| ADD_NCB["+ NCB Protection"]
        L2 -->|No| L3

        ADD_NCB --> L3{"Has paid driver?"}
        L3 -->|Yes| ADD_DRIVER["+ Paid Driver Cover"]
        L3 -->|No| L4

        ADD_DRIVER --> L4{"Has aftermarket accessories?"}
        L4 -->|Yes| ADD_ACC["+ Electrical + Non-Electrical<br/>Accessory Cover"]
        L4 -->|No| DONE_REC["Final recommended set"]
        ADD_ACC --> DONE_REC
    end
```

### Add-on Display Rules

```mermaid
flowchart TB
    subgraph "Category 1: Cover Your Car (out_of_pocket)"
        A1["Engine Protect<br/>Shown: always<br/>Rec: if age < 8"]
        A2["Return to Invoice<br/>Shown: always<br/>Rec: if age ≤ 3"]
        A3["Extra Car Protect<br/>Shown: always<br/>Rec: always<br/>Variants: LITE / PLUS"]
        A4["Consumables Cover<br/>Shown: always<br/>Rec: never"]
        A5["NCB Protection<br/>Shown: only if NCB > 0<br/>Rec: if NCB > 0"]
        A6["Electrical Accessory<br/>Shown: only if user has accessories<br/>Rec: if user has accessories"]
        A7["Non-Electrical Accessory<br/>Shown: only if user has accessories<br/>Rec: if user has accessories"]
    end

    subgraph "Category 2: Cover Your Family (protect_everyone)"
        B1["Personal Accident Cover<br/>Shown: always (mandatory)<br/>Variants: ₹15L / ₹50L"]
        B2["Passenger Protect Cover<br/>Shown: always<br/>Rec: always"]
        B3["Paid Driver Cover<br/>Shown: only if has paid driver<br/>Rec: if has paid driver"]
    end
```

---

## 10. Owner Details & Pre-Payment

After add-ons, the system collects owner information needed for the policy.

```mermaid
flowchart TB
    INTRO["owner_details.intro<br/>'Almost there. A few details about<br/>the vehicle owner to issue the policy.'"]
    INTRO --> NAME["owner_details.name<br/>Widget: text_input<br/>'Vehicle owner's full name?'<br/>Pre-fills from earlier name or profile<br/>Must match RC"]

    NAME --> LOGIN_CHECK{Logged in?}
    LOGIN_CHECK -->|No| SKIP_GATE["login.phone_gate<br/>Widget: login_gate_skippable<br/>'Verify your phone number'"]
    LOGIN_CHECK -->|Yes| EMAIL

    SKIP_GATE --> EMAIL["owner_details.email<br/>'Your email address?'<br/>Pre-fills if available"]

    EMAIL --> BN_CHECK{Brand new vehicle?}
    BN_CHECK -->|Yes| ENGINE["owner_details.engine_number<br/>'Engine number?'<br/>(from dealer invoice)"]
    BN_CHECK -->|No| LOAN_CHECK

    ENGINE --> CHASSIS["owner_details.chassis_number<br/>'Chassis number?'"]
    CHASSIS --> GST["owner_details.gst<br/>'Do you have a GST number?'<br/>Skip / Enter"]
    GST -->|Enter| GST_INPUT["owner_details.gst_input<br/>'Enter your GST number'"]
    GST -->|Skip| LOAN_CHECK
    GST_INPUT --> LOAN_CHECK

    LOAN_CHECK["owner_details.loan_check<br/>'Have you taken a car loan?'<br/>I own it outright / It's financed"]
    LOAN_CHECK -->|Financed| LOAN_PROVIDER["owner_details.loan_provider<br/>'Who is the lender?'"]
    LOAN_CHECK -->|Own outright| MANDATORY_GATE

    LOAN_PROVIDER --> MANDATORY_GATE

    MANDATORY_GATE{Logged in?}
    MANDATORY_GATE -->|Yes| REVIEW
    MANDATORY_GATE -->|No| MANDATORY["login.phone_gate_mandatory<br/>Widget: login_gate_mandatory<br/>MUST login to proceed"]
    MANDATORY --> REVIEW

    REVIEW["review.premium_breakdown<br/>Widget: premium_breakdown<br/>'Complete breakdown of your plan'"]
    REVIEW --> PAYMENT([→ Payment])
```

---

## 11. Payment & Post-Purchase

```mermaid
flowchart TB
    PAYMENT["payment.process<br/>Widget: payment_gateway<br/>'Complete your payment securely'"]
    PAYMENT --> SUCCESS["payment.success<br/>Widget: motor_celebration<br/>'Congratulations! Your car is insured!'<br/>Policy number generated"]

    SUCCESS --> STATUS["post_purchase.status_intro<br/>'Your policy is being prepared'"]
    STATUS --> TRACKER["post_purchase.policy_tracker<br/>Widget: policy_tracker<br/>Shows policy preparation stages"]

    TRACKER --> KYC["post_purchase.kyc_prompt<br/>'Complete KYC within 4 days'<br/>Start now / Do it later"]

    KYC --> NPS["post_purchase.nps<br/>Widget: nps_feedback<br/>'How was your experience?'<br/>Score + optional feedback"]

    NPS --> APP["post_purchase.app_download<br/>Widget: app_download_cta<br/>'Download ACKO app to manage policy'"]

    APP --> END_SCREEN["post_purchase.end<br/>'You're all set!'<br/>Go to Home / Insure another car"]

    END_SCREEN --> END_CHOICE{User action}
    END_CHOICE -->|Home| HOMEPAGE([Homepage])
    END_CHOICE -->|Insure another| NEW_JOURNEY([New journey starts])
```

---

## 12. PWILO — Pick Up Where I Left Off

The journey state is automatically saved at key milestones. If the user leaves and returns, they can resume.

```mermaid
flowchart TB
    subgraph "Save Points (auto-saved at these steps)"
        S1["vehicle_fetch.found"]
        S2["manual_entry.select_brand"]
        S3["brand_new.popular_cars"]
        S4["owner_details.name"]
        S5["pre_quote.summary"]
        S6["pre_quote.view_prices"]
        S7["quote.plans_ready"]
        S8["quote.plan_selection"]
        S9["quote.plan_selected"]
        S10["addons.out_of_pocket"]
        S11["addons.protect_everyone"]
        S12["addons.complete"]
        S13["review.premium_breakdown"]
    end

    subgraph "Cleared (no PWILO card)"
        C1["payment.success → snapshot cleared"]
        C2["completion.dashboard → snapshot cleared"]
    end

    subgraph "Homepage PWILO Cards"
        direction TB
        HP["Homepage loads"] --> CHECK_SNAP{"Saved snapshots exist?"}
        CHECK_SNAP -->|Yes| SHOW_CARDS["Show PWILO cards in carousel"]
        CHECK_SNAP -->|No| NO_CARDS["No PWILO section"]

        SHOW_CARDS --> CARD_CONTENT["Card shows:<br/>• Vehicle make/model<br/>• Drop-off display text<br/>• 'Continue' button<br/>• 'Start new' option"]

        CARD_CONTENT --> CLICK{User clicks}
        CLICK -->|Continue| RESUME_URL["Navigate to:<br/>/motor?vehicle=car&resume=1&journeyId=xxx"]
        CLICK -->|Start new| FRESH["Navigate to:<br/>/motor?vehicle=car"]
    end
```

### Drop-off Display Mapping

```mermaid
flowchart LR
    subgraph "Step → Card Display"
        D1["vehicle_fetch.found<br/>manual_entry.select_brand<br/>brand_new.popular_cars"] --> T1["'Let's insure your car'"]
        D2["owner_details.name<br/>pre_quote.summary<br/>pre_quote.view_prices"] --> T2["'Almost there'"]
        D3["quote.plans_ready<br/>quote.plan_selection"] --> T3["'Quote ready'"]
        D4["quote.plan_selected"] --> T4["'Plan selected,<br/>customize add-ons'"]
        D5["addons.out_of_pocket<br/>addons.protect_everyone"] --> T5["'Finish selecting add-ons'"]
        D6["addons.complete<br/>review.premium_breakdown"] --> T6["'Complete your purchase'"]
    end
```

---

## 13. Step Reference Table

Complete list of all step IDs in the car journey, grouped by module.

| Module | Step ID | Widget Type | Purpose |
|--------|---------|-------------|---------|
| **registration** | `registration.has_number` | `selection_cards` | Renewal vs Brand New fork |
| | `registration.enter_number` | `vehicle_reg_input` | Enter registration number |
| **vehicle_fetch** | `vehicle_fetch.loading` | `progressive_loader` | Fetch vehicle details from API |
| | `prelim.check` | `none` | Run preliminary checks |
| | `prelim.insured_same_user` | `selection_cards` | Vehicle already insured (same user) |
| | `prelim.insured_different_user` | `selection_cards` | Vehicle already insured (different user) |
| | `prelim.two_wheeler_entered` | `selection_cards` | Two-wheeler registration entered |
| | `prelim.payment_pending` | `selection_cards` | Payment done, pending steps |
| | `vehicle_fetch.found` | `vehicle_details_card` | Show verify card with fetched data |
| **manual_entry** | `manual_entry.congratulations` | `none` | Brand new car excitement message |
| | `manual_entry.start` | `none` | Fetch failed, start manual entry |
| | `manual_entry.select_brand` | `brand_selector` | Select car make |
| | `manual_entry.select_model` | `model_selector` | Select car model |
| | `manual_entry.select_fuel` | `selection_cards` | Select fuel type |
| | `manual_entry.select_variant` | `variant_selector` | Select car variant |
| | `manual_entry.select_year` | `year_selector` | Select registration year |
| | `brand_new.popular_cars` | `selection_cards` | Popular car suggestions |
| | `brand_new.commercial_check` | `selection_cards` | Personal vs commercial use |
| | `brand_new.delivery_date` | `selection_cards` | Expected delivery window |
| | `brand_new.mobile_pincode` | `text_input` | Mobile number |
| | `brand_new.pincode` | `text_input` | Pincode |
| | `brand_new.summary` | `editable_summary` | Review brand new car details |
| | `brand_new.view_prices` | `none` | Transition to quote calculation |
| **pre_quote** | `pre_quote.pincode_ask` | `text_input` | Pincode (when not collected) |
| | `pre_quote.policy_type_ask` | `selection_cards` | Previous policy type |
| | `pre_quote.policy_status` | `selection_cards` | Active / Expired / Not sure |
| | `pre_quote.claim_history` | `selection_cards` | Claims in current policy |
| | `pre_quote.ncb_selection` | `ncb_selector` | NCB percentage |
| | `pre_quote.ncb_reward` | `ncb_reward` | NCB increase celebration |
| | `pre_quote.last_claim_ask` | `selection_cards` | Last year claim (when not fetched) |
| | `pre_quote.cng_check` | `selection_cards` | External CNG kit check |
| | `pre_quote.commercial_check` | `selection_cards` | Commercial use check |
| | `pre_quote.commercial_rejection` | `rejection_screen` | Commercial vehicle dead end |
| | `pre_quote.expired_policy_type` | `selection_cards` | Previous policy type (expired path) |
| | `pre_quote.expiry_window` | `selection_cards` | When did policy expire |
| | `pre_quote.expired_claim_history` | `selection_cards` | Claims during previous policy |
| | `pre_quote.expired_insurer` | `insurer_selector` | Previous insurer |
| | `pre_quote.summary` | `editable_summary` | Review all details before quote |
| | `pre_quote.view_prices` | `none` | Transition to quote calculation |
| **login** | `login.phone_gate_prequote` | `login_gate_skippable` | Skippable login during data collection |
| | `login.phone_gate` | `login_gate_skippable` | Skippable login after owner name |
| | `login.phone_gate_before_plans` | `login_gate_mandatory` | Mandatory login before showing plans |
| | `login.phone_gate_mandatory` | `login_gate_mandatory` | Mandatory login before premium review |
| **quote** | `quote.calculating` | `plan_calculator` | Calculate plans (progressive stages) |
| | `quote.plans_ready` | `none` | Plans found message |
| | `quote.plan_selection` | `plan_selector` | Plan cards + bottom sheets |
| | `quote.plan_selected` | `none` | Plan confirmed message |
| **help** | `help.usage_pattern` | `selection_cards` | How do you use your car? |
| | `help.vehicle_age` | `selection_cards` | How old is your car? |
| | `help.budget_priority` | `selection_cards` | What matters most? |
| | `help.repair_preference` | `selection_cards` | Repair priority? |
| | `help.recommendation` | `plan_recommendation` | AI plan recommendation |
| **addons** | `addons.paid_driver_question` | `selection_cards` | Has paid driver? |
| | `addons.accessories_question` | `selection_cards` | Has aftermarket accessories? |
| | `addons.out_of_pocket` | `out_of_pocket_addons` | Car protection add-ons |
| | `addons.protect_everyone` | `protect_everyone_addons` | Family protection add-ons |
| | `addons.complete` | `none` | Add-on summary message |
| **owner_details** | `owner_details.intro` | `none` | Owner details intro |
| | `owner_details.name` | `text_input` | Owner full name |
| | `owner_details.email` | `text_input` | Owner email |
| | `owner_details.engine_number` | `text_input` | Engine number (brand new only) |
| | `owner_details.chassis_number` | `text_input` | Chassis number (brand new only) |
| | `owner_details.gst` | `selection_cards` | GST number (optional) |
| | `owner_details.gst_input` | `text_input` | Enter GST number |
| | `owner_details.loan_check` | `selection_cards` | Car loan check |
| | `owner_details.loan_provider` | `text_input` | Loan provider name |
| **review** | `review.premium_breakdown` | `premium_breakdown` | Full premium breakdown |
| **payment** | `payment.process` | `payment_gateway` | Payment processing |
| | `payment.success` | `motor_celebration` | Payment success celebration |
| **post_purchase** | `post_purchase.status_intro` | `none` | Policy preparation intro |
| | `post_purchase.policy_tracker` | `policy_tracker` | Policy tracker widget |
| | `post_purchase.kyc_prompt` | `selection_cards` | KYC prompt |
| | `post_purchase.nps` | `nps_feedback` | NPS feedback |
| | `post_purchase.app_download` | `app_download_cta` | App download CTA |
| | `post_purchase.end` | `selection_cards` | Journey complete |
