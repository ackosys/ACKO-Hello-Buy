---
name: bike-planning-logic
description: Plan recommendation logic for bike and scooter insurance users based on make, model, variant, pincode, and other factors. Use when the user mentions bike insurance plans, two-wheeler plan recommendations, scooter insurance, bike pricing logic, or wants to define how bike/scooter insurance plans are recommended to users.
---

# Bike Planning Logic

## Purpose

Defines the recommendation engine logic for bike and scooter insurance plan selection. This skill captures how users are matched to the right two-wheeler insurance plan based on their vehicle details and location.

## Input Factors

<!-- Define the key inputs that drive plan recommendation -->

- **Make** — Manufacturer (e.g., Hero, Honda, TVS, Royal Enfield, Bajaj)
- **Model** — Specific model (e.g., Splendor, Activa, Jupiter, Classic 350)
- **Variant** — Trim/variant (e.g., Drum, Disc, Alloy)
- **Vehicle type** — Bike vs Scooter vs Moped
- **Year of manufacture** — Registration year
- **Pincode** — User's location / registration zone
- **RTO** — Regional Transport Office code
- **Engine capacity** — CC (affects TP premium structure: ≤75cc, 75–150cc, 150–350cc, >350cc)
- **Fuel type** — Petrol, Electric
- **Previous policy** — Existing coverage details, NCB (No Claim Bonus)
- **Claim history** — Past claims if any

## Recommendation Rules

<!-- To be planned — define the logic for how plans are recommended -->

_This section will be built out with specific rules for:_

- Plan type selection (Comprehensive vs Third Party vs Zero Dep)
- Add-on recommendations based on vehicle profile
- Pricing tiers based on IDV and location
- NCB discount application
- Special rules for premium / high-CC bikes (e.g., Royal Enfield, KTM, Ducati)
- Electric scooter/bike specific coverage recommendations

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

<!-- How pincode, engine CC, make/model, and other factors affect pricing -->

_To be defined._

## Edge Cases

<!-- Special handling for specific scenarios -->

_To be defined._
