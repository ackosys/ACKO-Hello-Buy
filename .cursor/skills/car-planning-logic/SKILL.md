---
name: car-planning-logic
description: Plan recommendation logic for car insurance users based on make, model, variant, pincode, and other factors. Use when the user mentions car insurance plans, car plan recommendations, motor plan selection, car pricing logic, or wants to define how car insurance plans are recommended to users.
---

# Car Planning Logic

## Purpose

Defines the recommendation engine logic for car insurance plan selection. This skill captures how users are matched to the right car insurance plan based on their vehicle details and location.

## Input Factors

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

## Recommendation Rules

<!-- To be planned — define the logic for how plans are recommended -->

_This section will be built out with specific rules for:_

- Plan type selection (Comprehensive vs Third Party vs Zero Dep)
- Add-on recommendations based on vehicle profile
- Pricing tiers based on IDV and location
- NCB discount application
- Special rules for high-value / luxury vehicles
- EV-specific coverage recommendations

## Plan Types

| Plan | When to recommend |
|------|-------------------|
| Third Party | _TBD_ |
| Comprehensive | _TBD_ |
| Zero Depreciation | _TBD_ |

## Add-on Logic

<!-- Define which add-ons are recommended based on user profile -->

_To be defined._

## Pricing Factors

<!-- How pincode, make/model, and other factors affect pricing -->

_To be defined._

## Edge Cases

<!-- Special handling for specific scenarios -->

_To be defined._
