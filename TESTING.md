# Prototype Testing Guide

This document describes how to test all mock user scenarios in the ACKO prototype.

---

## How to Open the Prototype

**Local development:**
```
cd ACKO-Hello-Buy
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**GitHub Pages (deployed):**
[https://ackosys.github.io/acko-buy-journey/newhomepage/](https://ackosys.github.io/acko-buy-journey/newhomepage/)

---

## General Notes

| Item | Value |
|---|---|
| OTP | `0000` (same for all numbers) |
| Name | Any name works |
| Logout | Redirects to pre-login home page with a full reload |
| Theme toggle | Available via the `≡` menu in the header |
| Reset to FTU | Available via the `≡` menu — clears Pwilo cookie and session |

---

## What is Pwilo?

**Pwilo = Previously Where I Left Off.**

It is stored as a **browser session cookie**, not tied to an account. This means:

- A **new user** can have a Pwilo state if they started filling out a quote (e.g. entered a reg number, reached the quote screen) and then closed the tab before completing purchase — and the cookie is still active.
- An **existing customer** can also have Pwilo if they started a new quote alongside their existing policies.
- Use **"Reset to FTU"** from the `≡` menu to simulate a completely fresh session (clears Pwilo).

---

## Test Scenarios

### 1. New User — No prior session

**Phone:** `9876543210`

**What you see after login:**
- Welcome message: "Welcome to ACKO, [Name]! Great to have you here."
- Context: "What are you looking to insure today?"
- Two LOB chips: "I have an existing car" and "Brand new car"

**What to test:**
- Fresh onboarding flow for a first-time user
- Selecting a vehicle type navigates into the motor journey

---

### 2. New User — Pwilo on a Car Quote

**Phone:** `9876543211`

**What you see after login:**
- Welcome message: "Welcome to ACKO, [Name]! Great to have you here."
- Context: "I found an insurance quote you started earlier."
- Pwilo card: "Continue insuring your Tata Harrier · KA01 AB 1234"
- LOB chips below (user can also start fresh)
- "Insure another car" CTA

**What to test:**
- User dropped off mid-car-quote; can resume via the Pwilo card
- Can also choose a different path via the LOB chips

---

### 3. Customer — 1 Car Policy

**Phone:** `9876543212`

**What you see after login:**
- Welcome message: "Welcome back, [Name]!"
- Context: "I found a policy linked to your account. What would you like to do?"
- 1 policy card: Tata Harrier · Zero depreciation plan
- "Insure another car" CTA

**What to test:**
- Existing customer with a single active car policy
- File a claim / Download policy actions on the card
- Insure another car flow

---

### 4. Customer — 2 Policies (Health + Car)

**Phone:** `9876543213`

**What you see after login:**
- Welcome message: "Welcome back, [Name]!"
- Context: "I found 2 policies linked to your account. What would you like to do?"
- 2 policy cards: Health (Family Floater · ₹5L cover) + Car (Tata Harrier)
- "Insure another car" CTA

**What to test:**
- Cross-LOB customer with both health and motor policies
- Policy card display for health vs. car layout differences

---

### 5. Customer — 2 Vehicle Policies (Car + Bike)

**Phone:** `9876543214`

**What you see after login:**
- Welcome message: "Welcome back, [Name]!"
- Context: "I found 2 policies linked to your account. What would you like to do?"
- 2 policy cards: Tata Harrier (car) + Royal Enfield Classic 350 (bike)
- "Insure another car" CTA

**What to test:**
- Multi-vehicle customer
- Both car and bike policy cards displayed

---

### 6. Customer — 1 Car Policy + Pwilo on a Car Quote

**Phone:** `9876543215`

**What you see after login:**
- Welcome message: "Welcome back, [Name]!"
- Context: "I found a policy linked to your account, and a quote you started earlier."
- 1 policy card: Tata Harrier
- Pwilo card: "Continue insuring your Tata Harrier · KA01 AB 1234"
- "Insure another car" CTA

**What to test:**
- Existing customer who started a new car quote before completing it
- Both policy and in-progress quote shown together

---

### 7. New User — Pwilo on a Health Quote

**Phone:** `9876543216`

**What you see after login:**
- Welcome message: "Welcome to ACKO, [Name]! Great to have you here."
- Context: "I found an insurance quote you started earlier."
- Pwilo card: "Continue your health plan · Family floater · ₹5L cover"
- LOB chips below (can also start fresh)
- "Insure another car" CTA

**What to test:**
- New user who started a health insurance quote and dropped off
- Health-specific Pwilo card layout and imagery

---

### 8. New User — Pwilo on a Life Quote

**Phone:** `9876543217`

**What you see after login:**
- Welcome message: "Welcome to ACKO, [Name]! Great to have you here."
- Context: "I found an insurance quote you started earlier."
- Pwilo card: "Continue your life cover · Term plan · ₹1Cr cover"
- LOB chips below (can also start fresh)
- "Insure another car" CTA

**What to test:**
- New user who started a life insurance quote and dropped off
- Life-specific Pwilo card layout and imagery

---

### 9. Customer — 1 Car Policy + Pwilo on a Health Quote

**Phone:** `9876543218`

**What you see after login:**
- Welcome message: "Welcome back, [Name]!"
- Context: "I found a policy linked to your account, and a quote you started earlier."
- 1 policy card: Tata Harrier (car)
- Pwilo card: "Continue your health plan · Family floater · ₹5L cover"
- "Insure another car" CTA

**What to test:**
- Cross-LOB scenario: existing motor customer who also started a health quote
- Both car policy card and health Pwilo card shown together

---

### 10. Customer — 1 Car Policy + Pwilo on a Life Quote

**Phone:** `9876543219`

**What you see after login:**
- Welcome message: "Welcome back, [Name]!"
- Context: "I found a policy linked to your account, and a quote you started earlier."
- 1 policy card: Tata Harrier (car)
- Pwilo card: "Continue your life cover · Term plan · ₹1Cr cover"
- "Insure another car" CTA

**What to test:**
- Cross-LOB scenario: existing motor customer who also started a life quote
- Both car policy card and life Pwilo card shown together

---

## Quick Reference

| Phone | Scenario | User Type | Pwilo |
|---|---|---|---|
| `9876543210` | New user | New | — |
| `9876543211` | New user + car Pwilo | New | Car |
| `9876543212` | 1 car policy | Existing | — |
| `9876543213` | Health + car policies | Existing | — |
| `9876543214` | Car + bike policies | Existing | — |
| `9876543215` | 1 car policy + car Pwilo | Existing | Car |
| `9876543216` | New user + health Pwilo | New | Health |
| `9876543217` | New user + life Pwilo | New | Life |
| `9876543218` | 1 car policy + health Pwilo | Existing | Health |
| `9876543219` | 1 car policy + life Pwilo | Existing | Life |
