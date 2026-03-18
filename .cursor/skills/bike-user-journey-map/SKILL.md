---
name: bike-user-journey-map
description: Complete user journey flowcharts for bike/scooter insurance purchase on ACKO platform. Covers both existing bike owner renewal/switch and new bike buyer journeys with detailed step-by-step flows, login gates, plan selection, and add-on recommendation. Use when mapping bike insurance user experience, two-wheeler journey flows, or creating bike insurance documentation.
---

# Bike User Journey Map — Two-Wheeler Insurance

Complete end-to-end flowcharts for the ACKO conversational bike insurance buy platform

**Table of Contents**
1. [Master Journey Overview](#s1)
2. [Entry & Vehicle Type Selection](#s2)
3. [Preliminary Checks & Validations](#s3)
4. [Journey 1 — Existing Bike Owner (Renewal/Switch)](#s4)
5. [Journey 2 — New Bike Buyer](#s5)
6. [Data Collection & Verification](#s6)
7. [Login Logic — Skippable & Mandatory Gates](#s7)
8. [Quote & Plan Selection](#s8)
9. [Plan Type Routing (Comprehensive/OD/TP)](#s9)
10. [Add-on Personalisation](#s10)
11. [Confirm Details](#s11)
12. [Review & Payment](#s12)
13. [Post-Purchase & Policy Issuance](#s13)
14. [PWILO — Pick Up Where I Left Off](#s14)
15. [Journey Phase Summary](#s15)
16. [Step Reference Table](#s16)

## 1. Master Journey Overview {#s1}

Highest-level view of the entire bike insurance journey. Both existing owner and new buyer flows converge at plan selection after different data collection phases.

```mermaid
flowchart TB
    START(["🏠 User lands on Homepage"]) --> HOME_ACTION{"User action"}
    HOME_ACTION -->|"Clicks 'Bike Insurance'"| BIKE_PAGE["Bike Insurance Page Loads"]
    HOME_ACTION -->|"PWILO card 'Continue'"| RESUME["Resume from Snapshot"]

    BIKE_PAGE --> INIT{"Initialisation"}
    INIT -->|"Default entry"| REG_CHOICE["Registration choice"]
    INIT -->|"Resume + snapshot"| RESTORE_SNAP["Restore Snapshot State"]

    RESUME --> RESTORE_SNAP
    RESTORE_SNAP --> RESTORED_STEP["Jump to saved step"]

    REG_CHOICE --> FORK{"Has registration or new bike?"}
    FORK -->|"Enter registration number"| JOURNEY_1["🔄 Journey 1: Existing Owner"]
    FORK -->|"New bike purchase"| JOURNEY_2["🆕 Journey 2: New Buyer"]

    JOURNEY_1 --> PRELIM["Preliminary Checks"]
    PRELIM --> DATA_COLLECT["Data Collection & Verification"]
    
    JOURNEY_2 --> NEW_DATA["New Bike Data Collection"]
    
    DATA_COLLECT --> LOGIN_CHECK{"Logged in?"}
    NEW_DATA --> LOGIN_CHECK

    LOGIN_CHECK -->|"Yes"| QUOTE_CALC
    LOGIN_CHECK -->|"No"| OPTIONAL_LOGIN["🔓 Optional Login Gate"]
    OPTIONAL_LOGIN --> QUOTE_CALC

    QUOTE_CALC["📊 Quote Calculation"] --> PLAN_SELECT["📋 Plan Selection"]
    PLAN_SELECT --> ADDONS["🛡️ Add-on Selection"]
    ADDONS --> CONFIRM["✅ Confirm Details"]
    CONFIRM --> LOGIN_MANDATORY{"Logged in?"}
    LOGIN_MANDATORY -->|"Yes"| REVIEW
    LOGIN_MANDATORY -->|"No"| MANDATORY_LOGIN["🔒 Mandatory Login"]
    MANDATORY_LOGIN --> REVIEW
    REVIEW["💰 Premium Review"] --> PAYMENT["💳 Payment"]
    PAYMENT --> POST_PURCHASE["✅ Post-Purchase"]
    POST_PURCHASE --> END(["🎉 Journey Complete"])

    style JOURNEY_1 fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style JOURNEY_2 fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style QUOTE_CALC fill:#2d1b69,stroke:#7c3aed,color:#fff
    style PLAN_SELECT fill:#2d1b69,stroke:#7c3aed,color:#fff
    style PAYMENT fill:#1b4332,stroke:#22c55e,color:#fff
    style END fill:#1b4332,stroke:#22c55e,color:#fff
```

## 2. Entry & Vehicle Type Selection {#s2}

The journey begins when the user selects "Bike Insurance" from the homepage. Users can either enter an existing registration number or indicate they're buying a new bike.

```mermaid
flowchart TB
    HP(["🏠 Homepage"]) --> BIKE_CLICK["User clicks 'Bike Insurance'"]
    BIKE_CLICK --> BIKE_INIT["Bike Page useEffect runs"]
    BIKE_INIT --> RESET["resetJourney — clear all state"]
    RESET --> WELCOME["bike.welcome\n'Looking for bike insurance?'"]

    WELCOME --> CHOICE{"User selects"}
    CHOICE -->|"Enter registration number"| REG_FLOW["→ Journey 1: Existing Owner"]
    CHOICE -->|"New bike purchase"| NEW_FLOW["→ Journey 2: New Buyer"]

    style HP fill:#1b4332,stroke:#22c55e,color:#fff
    style REG_FLOW fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style NEW_FLOW fill:#1e3a5f,stroke:#3b82f6,color:#fff
```

## 3. Preliminary Checks & Validations {#s3}

When a user enters a registration number, these checks are performed before proceeding to data collection.

```mermaid
flowchart TB
    REG_INPUT["registration.enter_number\nWidget: vehicle_reg_input\nValidation: uppercase, no spaces"]
    REG_INPUT --> FETCH["registration.loading\nWidget: progressive_loader\n'Fetching details for KA01AB1234...'"]

    FETCH --> RESULT{"IIB lookup result"}

    RESULT -->|"Success"| PRELIM["Run preliminary checks"]
    RESULT -->|"Failure"| MANUAL["manual_entry.start\n'Let's enter details manually'"]

    PRELIM --> PRELIM_R{"Prelim check result"}

    PRELIM_R -->|"✅ clear"| VERIFY["registration.found\nWidget: vehicle_details_card\nShow auto-fetched fields"]
    PRELIM_R -->|"insured_same_user"| P_SAME["'Already insured with ACKO'\n→ View policy / Edit reg"]
    PRELIM_R -->|"insured_different_user"| P_DIFF["'Policy belongs to xxxx5511'\n→ Buying bike / Login other / Edit reg"]
    PRELIM_R -->|"car_number_entered"| P_CAR["'This is a car registration'\n→ Continue with car / Edit reg"]
    PRELIM_R -->|"payment_pending"| P_PAY["'Payment done, pending steps'\n→ Complete steps / Edit reg"]

    P_SAME -->|"Edit reg"| REG_INPUT
    P_DIFF -->|"Buying bike"| VERIFY
    P_DIFF -->|"Edit reg"| REG_INPUT
    P_CAR -->|"Continue with car"| CAR_REDIRECT["→ Redirect to car journey"]
    P_CAR -->|"Edit reg"| REG_INPUT
    P_PAY -->|"Complete steps"| PENDING_FLOW["→ KYC/Inspection flow"]
    P_PAY -->|"Edit reg"| REG_INPUT

    VERIFY --> CONFIRM{"User confirms?"}
    CONFIRM -->|"✅ Confirm"| DATA_COLLECTION["→ Data Collection"]
    CONFIRM -->|"Edit reg"| REG_INPUT

    MANUAL --> BRAND["manual_entry.select_brand"]
    BRAND --> MODEL["manual_entry.select_model"]
    MODEL --> DATA_COLLECTION

    style VERIFY fill:#1b4332,stroke:#22c55e,color:#fff
    style DATA_COLLECTION fill:#2d1b69,stroke:#7c3aed,color:#fff
```

## 4. Journey 1 — Existing Bike Owner (Renewal/Switch) {#s4}

Handles users who own an existing bike and want to renew their expiring policy or switch to ACKO.

```mermaid
flowchart TB
    START["Data Collection Phase"] --> FETCHED{"IIB data available?"}
    
    FETCHED -->|"Make + Model + Expiry"| ALL_FETCHED["Show verify card with:\n• Make & Model\n• Policy expiry date"]
    FETCHED -->|"Make + Model only"| PARTIAL_1["Show verify card with:\n• Make & Model\nAsk: Policy expiry date"]
    FETCHED -->|"Expiry only"| PARTIAL_2["Show verify card with:\n• Policy expiry date\nAsk: Make & Model"]
    FETCHED -->|"Nothing fetched"| NOTHING["Ask all manually:\n• Make\n• Model\n• Policy expiry date"]

    ALL_FETCHED --> PHONE_CHECK
    PARTIAL_1 --> PHONE_CHECK
    PARTIAL_2 --> PHONE_CHECK
    NOTHING --> PHONE_CHECK

    PHONE_CHECK{"User logged in?"} -->|"No"| ASK_PHONE["Ask: Phone number"]
    PHONE_CHECK -->|"Yes"| QUOTE_REQUEST

    ASK_PHONE --> QUOTE_REQUEST["Request quote from backend"]
    QUOTE_REQUEST --> PLANS{"Plans available?"}
    
    PLANS -->|"❌ No plans"| BLOCKED["blocked_user\n'Unable to offer plans'\nDEAD END"]
    PLANS -->|"✅ Plans available"| PLAN_ROUTING["→ Plan Selection Routing"]

    style BLOCKED fill:#5c1a1a,stroke:#ef4444,color:#fff
    style PLAN_ROUTING fill:#2d1b69,stroke:#7c3aed,color:#fff
```

## 5. Journey 2 — New Bike Buyer {#s5}

Handles users purchasing a brand new bike who need first-time insurance coverage.

```mermaid
flowchart TB
    START["New Bike Journey"] --> WELCOME["new_bike.welcome\n'Exciting! A brand new bike!'"]
    WELCOME --> MAKE["new_bike.select_make\nWidget: brand_selector\n'Which make is your bike?'"]
    MAKE --> MODEL["new_bike.select_model\nWidget: model_selector\n'Which model?'"]
    MODEL --> PHONE_CHECK{"User logged in?"}

    PHONE_CHECK -->|"No"| ASK_PHONE["new_bike.phone_number\nWidget: text_input\n'Your phone number?'"]
    PHONE_CHECK -->|"Yes"| QUOTE_REQUEST

    ASK_PHONE --> QUOTE_REQUEST["Request quote from backend"]
    QUOTE_REQUEST --> PLANS{"Plans available?"}
    
    PLANS -->|"❌ No plans"| BLOCKED["blocked_user\n'Unable to offer plans'\nDEAD END"]
    PLANS -->|"✅ Plans available"| NEW_PLAN_SELECT["→ New Bike Plan Selection"]

    style BLOCKED fill:#5c1a1a,stroke:#ef4444,color:#fff
    style NEW_PLAN_SELECT fill:#2d1b69,stroke:#7c3aed,color:#fff
```

## 6. Data Collection & Verification {#s6}

Detailed view of how the system handles the all-or-nothing framework for auto-fetched vs manually entered data.

```mermaid
flowchart TB
    subgraph IIB_FETCH ["IIB Auto-Fetch Scenarios"]
        T1["Scenario 1: Make+Model+Expiry ✓\nUser logged in ✓"]
        T2["Scenario 2: Make+Model+Expiry ✓\nUser logged out"]
        T3["Scenario 3: Make+Model ✓\nExpiry ❌, User logged in"]
        T4["Scenario 4: Make+Model ✓\nExpiry ❌, User logged out"]
        T5["Scenario 5: Expiry ✓\nMake+Model ❌, User logged in"]
        T6["Scenario 6: Expiry ✓\nMake+Model ❌, User logged out"]
        T7["Scenario 7: All ❌\nUser logged in"]
        T8["Scenario 8: All ❌\nUser logged out"]
    end

    T1 --> V1["Verify: Make·Model·Expiry\nAsk: (nothing)"]
    T2 --> V2["Verify: Make·Model·Expiry\nAsk: Phone"]
    T3 --> V3["Verify: Make·Model\nAsk: Expiry"]
    T4 --> V4["Verify: Make·Model\nAsk: Expiry·Phone"]
    T5 --> V5["Verify: Expiry\nAsk: Make·Model"]
    T6 --> V6["Verify: Expiry\nAsk: Make·Model·Phone"]
    T7 --> V7["Verify: (none)\nAsk: Make·Model·Expiry"]
    T8 --> V8["Verify: (none)\nAsk: Make·Model·Expiry·Phone"]

    V1 --> COMPLETE["All data collected → Quote request"]
    V2 --> COMPLETE
    V3 --> COMPLETE
    V4 --> COMPLETE
    V5 --> COMPLETE
    V6 --> COMPLETE
    V7 --> COMPLETE
    V8 --> COMPLETE

    style COMPLETE fill:#1b4332,stroke:#22c55e,color:#fff
```

## 7. Login Logic — Skippable & Mandatory Gates {#s7}

### Skippable Login Gate

```mermaid
flowchart TB
    TRIGGER["🔓 Skippable Gate triggered\n• During data collection\n• After basic details"]
    TRIGGER --> CHECK{"User logged in?"}
    CHECK -->|"✅ Yes"| AUTO["Gate auto-skipped\nProceed to next step"]
    CHECK -->|"❌ No"| SHOW["Show login_gate_skippable\n'Verify phone for personalised plans'\n'Lets us save your progress'"]
    SHOW --> ACTION{"User action"}
    ACTION -->|"Enter phone + OTP"| LOGIN["✅ Login successful"]
    ACTION -->|"'Skip for now'"| SKIPPED["Login skipped\nContinue without login"]
    LOGIN --> NEXT["Proceed to next step"]
    SKIPPED --> NEXT

    style SHOW fill:#1e3a5f,stroke:#3b82f6,color:#fff
```

### Mandatory Login Gate

```mermaid
flowchart TB
    TRIGGER["🔒 Mandatory Gate triggered\n• Before confirm details\n• Before payment"]
    TRIGGER --> CHECK{"User logged in?"}
    CHECK -->|"✅ Yes"| AUTO["Gate auto-skipped"]
    CHECK -->|"❌ No"| SHOW["Show login_gate_mandatory\n'We need your phone to continue'\nNo skip button"]
    SHOW --> OTP["User enters phone + OTP\n(must complete)"]
    OTP --> DONE["✅ Login successful → proceed"]
    AUTO --> DONE

    style SHOW fill:#5c1a1a,stroke:#ef4444,color:#fff
```

## 8. Quote & Plan Selection {#s8}

After data collection, the system calculates quotes and presents plan options based on bike eligibility.

```mermaid
flowchart TB
    CALC["quote.calculating\nWidget: plan_calculator\n'Fetching personalised quotes...'\nStages: Analysing → IDV → Plans"]
    CALC --> READY["quote.plans_ready\n'Best plans for your bike'"]
    READY --> ELIGIBILITY{"Bike eligibility?"}

    ELIGIBILITY -->|"< 5 years old + active TP"| OD_ELIGIBLE["Plans: Comprehensive + OD\n(TP already covered)"]
    ELIGIBILITY -->|"All other cases"| STANDARD["Plans: Comprehensive + Third Party"]
    ELIGIBILITY -->|"New bike buyer"| NEW_BIKE["Plans: Comprehensive + TP 5-year\n(Fixed structure)"]

    OD_ELIGIBLE --> DISPLAY_PLANS["Display plan cards with:\n• Starting prices\n• Key benefits\n• Recommended tag"]
    STANDARD --> DISPLAY_PLANS
    NEW_BIKE --> DISPLAY_PLANS

    DISPLAY_PLANS --> USER_SELECT{"User selects plan"}

    USER_SELECT -->|"Comprehensive"| COMP_FLOW["→ Comprehensive Flow"]
    USER_SELECT -->|"Own Damage"| OD_FLOW["→ OD Flow"]  
    USER_SELECT -->|"Third Party"| TP_FLOW["→ Third Party Flow"]

    style DISPLAY_PLANS fill:#2d1b69,stroke:#7c3aed,color:#fff
    style COMP_FLOW fill:#1b4332,stroke:#22c55e,color:#fff
    style OD_FLOW fill:#1b4332,stroke:#22c55e,color:#fff
    style TP_FLOW fill:#1b4332,stroke:#22c55e,color:#fff
```

## 9. Plan Type Routing (Comprehensive/OD/TP) {#s9}

Different tenure selection flows based on the selected plan type.

### Journey 1 Plans (Existing Owner)

```mermaid
flowchart TB
    subgraph COMPREHENSIVE ["Comprehensive Plan"]
        COMP_SELECT["User selects Comprehensive"] --> COMP_TENURE["Select tenure:\n1 Year · 2 Years · 3 Years"]
        COMP_TENURE --> COMP_NUDGE["Nudge towards 3 years:\n'Save ₹XXX with 3-year plan'\n'Best value' tag on 3-year"]
        COMP_NUDGE --> COMP_DONE["Comprehensive plan selected"]
    end

    subgraph OD_ONLY ["Own Damage Plan"]  
        OD_SELECT["User selects Own Damage"] --> OD_TENURE["Select tenure:\n1 Year · 2 Years · 3 Years"]
        OD_TENURE --> OD_NUDGE["Nudge towards 3 years:\nShow annual savings"]
        OD_NUDGE --> OD_DONE["OD plan selected"]
    end

    subgraph TP_ONLY ["Third Party Plan"]
        TP_SELECT["User selects Third Party"] --> TP_TENURE["Select tenure:\n1 Year · 2 Years · 3 Years"]
        TP_TENURE --> TP_NUDGE["Nudge towards 3 years:\nShow cost benefits"]
        TP_NUDGE --> TP_DONE["TP plan selected"]
    end

    COMP_DONE --> ADDONS["→ Add-on Selection"]
    OD_DONE --> ADDONS
    TP_DONE --> ADDONS

    style ADDONS fill:#2d1b69,stroke:#7c3aed,color:#fff
```

### Journey 2 Plans (New Bike)

```mermaid
flowchart TB
    NEW_SELECT["New bike plan selection"] --> NEW_PLANS{"Plan choice"}
    
    NEW_PLANS -->|"Third Party 5-Year"| TP5["Fixed: 5-year TP coverage only\nNo tenure selection needed"]
    NEW_PLANS -->|"Comprehensive"| COMP5["Fixed: 5-year TP + 1-year OD\nNo tenure selection needed"]
    
    TP5 --> NEW_ADDONS["→ Add-on Selection\n(+ Return to Invoice)"]
    COMP5 --> NEW_ADDONS

    style NEW_ADDONS fill:#2d1b69,stroke:#7c3aed,color:#fff
```

## 10. Add-on Personalisation {#s10}

Two-wheeler add-ons are grouped into family protection and bike protection categories.

```mermaid
flowchart TB
    INTRO["addons.intro\n'Enhance your coverage with add-ons'"]
    INTRO --> CATEGORIES["Display two categories"]

    CATEGORIES --> FAMILY["Category 1: Add-ons that protect your family\n• Personal Accident Cover\n• Pillion Rider Cover\n• Helmet Protect"]
    
    CATEGORIES --> BIKE["Category 2: Add-ons that protect your bike\n• Engine Protect\n• Consumables Cover\n• Zero Depreciation"]

    FAMILY --> JOURNEY_CHECK{"Journey type?"}
    BIKE --> JOURNEY_CHECK

    JOURNEY_CHECK -->|"Journey 1 (Existing)"| STANDARD_ADDONS["Show standard bike add-ons"]
    JOURNEY_CHECK -->|"Journey 2 (New bike)"| ENHANCED_ADDONS["Show bike add-ons + Return to Invoice"]

    STANDARD_ADDONS --> SELECTION["User selects desired add-ons\nNo recommendations - free choice"]
    ENHANCED_ADDONS --> SELECTION

    SELECTION --> COMPLETE["addons.complete\n'X add-ons selected'\n→ Proceed to confirm details"]

    style COMPLETE fill:#1b4332,stroke:#22c55e,color:#fff
```

### Add-on Catalogue Details

```mermaid
flowchart LR
    subgraph FAMILY_ADDONS ["👨‍👩‍👧‍👦 Family Protection"]
        PA["Personal Accident\n₹15L coverage for owner\nDeath/disability in accident"]
        PR["Pillion Rider\n₹2L coverage for passenger\nDeath/disability in accident"] 
        HP["Helmet Protect\n₹1,000 for helmet damage\nIf bike also damaged"]
    end

    subgraph BIKE_ADDONS ["🏍️ Bike Protection"]
        EP["Engine Protect\nWater/oil damage coverage\nNot in standard policy"]
        CC["Consumables Cover\nNuts/bolts/oils during repair\nTypically excluded"]
        ZD["Zero Depreciation\nFull part cost, no deduction\nMinimizes out-of-pocket"]
    end

    subgraph NEW_BIKE_ONLY ["🆕 New Bike Only"]
        RTI["Return to Invoice\nComplete invoice value\nIf stolen/total loss"]
    end

    FAMILY_ADDONS --> SELECTION["User Selection"]
    BIKE_ADDONS --> SELECTION
    NEW_BIKE_ONLY --> SELECTION
```

## 11. Confirm Details {#s11}

Collection and reconfirmation of key details before proceeding to payment review.

```mermaid
flowchart TB
    START["confirm_details.intro\n'Almost there. A few details to finalize your policy'"]
    
    START --> Q1["Question 1: Policy Expiry Date\n(Journey 1 only)\nPre-fill if available from IIB"]
    
    Q1 --> JOURNEY_CHECK{"Journey type?"}
    START --> JOURNEY_CHECK

    JOURNEY_CHECK -->|"Journey 1 (Existing)"| Q2["Question 2: Previous Policy Type\n'What type of plan did you have previously?'\nOptions: Comprehensive / Third Party"]
    JOURNEY_CHECK -->|"Journey 2 (New bike)"| Q3["Skip policy questions\nGo directly to personal details"]

    Q2 --> Q3["Question 3: Full Name\n'Policyholder name'\nPre-fill from profile if available"]
    
    Q3 --> Q4["Question 4: Email Address\n'Policy documents will be sent here'"]
    
    Q4 --> Q5["Question 5: Pincode\n'For pricing and zone-based underwriting'"]
    
    Q5 --> LOGIN_CHECK{"User logged in?"}
    
    LOGIN_CHECK -->|"No"| Q6["Question 6: Phone Number\n'Policy will be linked to this number'"]
    LOGIN_CHECK -->|"Yes"| COMPLETE
    
    Q6 --> COMPLETE["All details confirmed\n→ Proceed to Review Screen"]

    style COMPLETE fill:#1b4332,stroke:#22c55e,color:#fff
```

## 12. Review & Payment {#s12}

Final review screen where users see complete breakdown before payment.

```mermaid
flowchart TB
    START["review.intro\n'Review your policy before payment'"]
    
    START --> COUPONS{"Eligible coupons?"}
    
    COUPONS -->|"Yes"| SHOW_COUPONS["Display eligible coupons\n• Show as selectable cards\n• Manual coupon code input\n• Only one coupon at a time"]
    COUPONS -->|"No"| SUMMARY
    
    SHOW_COUPONS --> APPLY{"Coupon applied?"}
    APPLY -->|"Yes"| RECALC["Recalculate premium\nShow updated total"]
    APPLY -->|"No"| SUMMARY
    RECALC --> SUMMARY

    SUMMARY --> BIKE_DETAILS["Bike & Personal Details\n• Make, model, registration year\n• Name, email, pincode, phone"]
    
    BIKE_DETAILS --> COVERAGE["Coverage Details\n• Plan type & tenure\n• Selected add-ons\n• IDV value\n• NCB percentage"]
    
    COVERAGE --> PREMIUM["Premium Breakup\n• Base premium\n• Add-on premiums (itemized)\n• NCB discount (if applicable)\n• Coupon discount (if applied)\n• GST\n• Total payable amount"]
    
    PREMIUM --> POLICY_START["Policy Start Date\n'Your policy starts on <date>'\n'Your bike will be covered from this date'"]
    
    POLICY_START --> CTA["💳 Pay Now Button\n→ Payment Gateway"]

    style CTA fill:#1b4332,stroke:#22c55e,color:#fff
```

## 13. Post-Purchase & Policy Issuance {#s13}

After successful payment, guide user through policy issuance and next steps.

```mermaid
flowchart TB
    PAY_SUCCESS["payment.success\nWidget: bike_celebration\n'Congratulations! Bike insured!'\nPolicy number generated"]

    PAY_SUCCESS --> STATUS["post_purchase.status_intro\n'Policy being prepared'"]
    STATUS --> TRACKER["post_purchase.policy_tracker\nWidget: policy_tracker\nShow preparation progress"]

    TRACKER --> KYC_CHECK{"KYC required?"}
    KYC_CHECK -->|"Yes"| KYC["post_purchase.kyc_prompt\n'Complete KYC within 4 days'\nStart now / Later"]
    KYC_CHECK -->|"No"| NPS

    KYC --> NPS["post_purchase.nps\nWidget: nps_feedback\n'How was your experience?'"]

    NPS --> APP["post_purchase.app_download\nWidget: app_download_cta\n'Download ACKO app for claims'"]

    APP --> END_SCR["post_purchase.end\n'You're all set!'"]

    END_SCR --> END_CHOICE{"User action"}
    END_CHOICE -->|"Home"| HP(["🏠 Homepage"])
    END_CHOICE -->|"Insure another bike"| NEW(["🔄 New journey"])

    style PAY_SUCCESS fill:#1b4332,stroke:#22c55e,color:#fff
    style HP fill:#2d1b69,stroke:#7c3aed,color:#fff
    style NEW fill:#2d1b69,stroke:#7c3aed,color:#fff
```

## 14. PWILO — Pick Up Where I Left Off {#s14}

Journey state auto-save and resume functionality for bike insurance purchase.

```mermaid
flowchart TB
    subgraph SAVE ["💾 Auto-Save Points"]
        S1["registration.found"]
        S2["manual_entry.select_brand"]
        S3["new_bike.select_make"]
        S4["confirm_details.intro"]
        S5["quote.calculating"]
        S6["quote.plans_ready"]
        S7["addons.complete"]
        S8["review.intro"]
    end

    subgraph CLEAR ["🗑️ Cleared Points"]
        C1["payment.success → cleared"]
        C2["post_purchase.end → cleared"]
    end

    subgraph RESUME ["🏠 Homepage PWILO"]
        HP["Homepage loads"] --> CHECK{"Bike snapshots exist?"}
        CHECK -->|"Yes"| CARDS["Show PWILO cards\n• Bike make/model\n• Journey type\n• Drop-off text\n• 'Continue' button"]
        CHECK -->|"No"| NONE["No bike PWILO section"]

        CARDS --> CLICK{"User clicks"}
        CLICK -->|"Continue"| URL["/bike?resume=1&journeyId=xxx"]
        CLICK -->|"Start new"| FRESH["/bike"]
    end

    subgraph DROP_OFF ["Drop-off Display Mapping"]
        D1["registration.found\nmanual_entry.select_brand\nnew_bike.select_make"] --> T1["'Let's insure your bike'"]
        D2["confirm_details.intro"] --> T2["'Almost there'"]
        D3["quote.plans_ready"] --> T3["'Quote ready'"]
        D4["addons.complete"] --> T4["'Review and pay'"]
        D5["review.intro"] --> T5["'Complete your purchase'"]
    end
```

## 15. Journey Phase Summary {#s15}

**For stakeholders and non-technical users**

| Phase | Journey 1 (Existing Owner) | Journey 2 (New Buyer) | Key Actions |
|-------|---------------------------|------------------------|-------------|
| **Entry** | Enter registration number | Select "New bike purchase" | Vehicle identification |
| **Validation** | Preliminary checks for existing policies | Skip validation checks | Avoid duplicate coverage |
| **Data Collection** | Auto-fetch + manual questions for missing fields | Manual entry of make/model only | Complete bike profile |
| **Login** | Optional login for personalization | Optional login for personalization | Account linking |
| **Quote Generation** | Request plans based on complete profile | Request new bike plans | Calculate premiums |
| **Plan Selection** | Choose from Comprehensive/OD/TP with tenure | Choose from fixed-tenure options | Coverage decision |
| **Add-ons** | Select from standard bike add-ons | Select from enhanced add-ons + RTI | Extra protection |
| **Confirmation** | Confirm policy + personal details | Confirm personal details only | Final verification |
| **Review** | Complete premium breakdown with NCB | Simplified breakdown for new bike | Payment preparation |
| **Payment** | Complete transaction | Complete transaction | Policy activation |
| **Post-Purchase** | Policy issuance + KYC if needed | Policy issuance + KYC if needed | Service completion |

## 16. Step Reference Table {#s16}

| Module | Step ID | Widget Type | Purpose | Journey |
|--------|---------|-------------|---------|---------|
| **registration** | registration.enter_number | vehicle_reg_input | Enter bike registration | J1 |
| | registration.loading | progressive_loader | Fetch bike details from IIB | J1 |
| | registration.found | vehicle_details_card | Show verify card | J1 |
| **prelim** | prelim.insured_same_user | selection_cards | Already insured (same user) | J1 |
| | prelim.insured_different_user | selection_cards | Already insured (different user) | J1 |
| | prelim.car_number_entered | selection_cards | Car registration entered | J1 |
| | prelim.payment_pending | selection_cards | Payment done, steps pending | J1 |
| **manual_entry** | manual_entry.start | none | IIB fetch failed | J1 |
| | manual_entry.select_brand | brand_selector | Bike make | J1 |
| | manual_entry.select_model | model_selector | Bike model | J1 |
| **new_bike** | new_bike.welcome | none | New bike excitement | J2 |
| | new_bike.select_make | brand_selector | Bike make | J2 |
| | new_bike.select_model | model_selector | Bike model | J2 |
| | new_bike.phone_number | text_input | Mobile number | J2 |
| **quote** | quote.calculating | plan_calculator | Calculate plans | Both |
| | quote.plans_ready | none | Plans found | Both |
| | quote.plan_selection | plan_selector | Plan cards | Both |
| | quote.tenure_selection | tenure_selector | Tenure choice | J1 only |
| **addons** | addons.intro | none | Add-on introduction | Both |
| | addons.family_protection | family_addon_cards | Family add-ons | Both |
| | addons.bike_protection | bike_addon_cards | Bike add-ons | Both |
| | addons.complete | none | Add-on summary | Both |
| **confirm_details** | confirm_details.intro | none | Details confirmation intro | Both |
| | confirm_details.policy_expiry | text_input | Previous policy expiry | J1 only |
| | confirm_details.policy_type | selection_cards | Previous policy type | J1 only |
| | confirm_details.name | text_input | Policyholder name | Both |
| | confirm_details.email | text_input | Email address | Both |
| | confirm_details.pincode | text_input | Pincode | Both |
| | confirm_details.phone | text_input | Phone number | Both |
| **login** | login.optional_gate | login_gate_skippable | Skippable login | Both |
| | login.mandatory_gate | login_gate_mandatory | Mandatory login | Both |
| **review** | review.intro | none | Review introduction | Both |
| | review.coupons | coupon_selector | Available coupons | Both |
| | review.summary | premium_breakdown | Premium breakdown | Both |
| | review.pay_now | payment_gateway | Payment CTA | Both |
| **payment** | payment.process | payment_gateway | Payment processing | Both |
| | payment.success | bike_celebration | Success celebration | Both |
| **post_purchase** | post_purchase.status_intro | none | Policy prep intro | Both |
| | post_purchase.policy_tracker | policy_tracker | Issuance tracker | Both |
| | post_purchase.kyc_prompt | selection_cards | KYC prompt | Both |
| | post_purchase.nps | nps_feedback | Experience rating | Both |
| | post_purchase.app_download | app_download_cta | App download | Both |
| | post_purchase.end | selection_cards | Journey completion | Both |

---

**Legend:**
- **J1**: Journey 1 (Existing bike owner)
- **J2**: Journey 2 (New bike buyer)  
- **Both**: Available in both journeys