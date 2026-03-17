'use client';

import { useState, useMemo, useEffect, ReactNode } from 'react';
import DesignSystemNav from '../../components/ds/DesignSystemNav';
import type { SubTabDef } from '../../components/ds/DesignSystemNav';
import PhoneFrame from '../../components/ds/PhoneFrame';
import type { DisplayMode } from '../../components/ds/PhoneFrame';
import { assetPath } from '../../lib/assetPath';
import ChatMessage, { TypingIndicator } from '../../components/ds/ChatMessage';
import type { ChatMessageData } from '../../components/ds/ChatMessage';

import {
  SelectionCards as HealthSelectionCards,
  MultiSelect as HealthMultiSelect,
  NumberInput as HealthNumberInput,
  PincodeInput as HealthPincodeInput,
  PlanSwitcher, UspCards, CalculationTheater,
  HospitalList, Celebration, FrequencySelect,
  ReviewSummary, HealthSummaryCard, ConfirmDetailsWidget,
  DobCollectionWidget, GapResultsWidget,
} from '../../components/ChatWidgets';

import {
  MotorSelectionCards, VehicleRegInput, BrandSelector,
  ModelSelector, VariantSelector, YearSelector,
  NcbSelector, InsurerSelector, NcbReward,
  VehicleDetailsCard, EditableSummary,
  ProgressiveLoader, PlanCalculator, PlanSelector,
  OutOfPocketAddons, ProtectEveryoneAddons,
  MotorTextInput, RejectionScreen, PlanRecommendation,
} from '../../components/motor/MotorWidgets';

import {
  PremiumBreakdown, PaymentGateway, MotorCelebration,
  PolicyTracker, NpsFeedback, AppDownloadCta,
} from '../../components/motor/MotorFinalWidgets';

import { useMotorStore } from '../../lib/motor/store';

import {
  ICON_SECTIONS, FILE_ICON_SECTIONS,
  LOB_CARDS, BRAND_LOGOS_ALL, VEHICLE_IMAGES, CHARACTER_IMAGES,
  ACKO_BRAND_LOGOS, OFFERING_IMAGES, FOOTER_ICONS,
  HOSPITAL_PARTNERS,
} from '../../components/ds/SampleData';

/* ═══════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════ */
interface DSItem {
  id: string;
  name: string;
  source: string;
  displayMode: DisplayMode;
  render: () => ReactNode;
}
interface DSTab { id: string; label: string; items: DSItem[] }
type LobId = 'health' | 'motor' | 'life' | 'global';

const LOBS = [
  { id: 'health' as const, name: 'Health', accent: '#8B5CF6', accentLight: '#C4B5FD' },
  { id: 'motor' as const, name: 'Motor', accent: '#A855F7', accentLight: '#D8B4FE' },
  { id: 'life' as const, name: 'Life', accent: '#10B981', accentLight: '#6EE7B7' },
  { id: 'global' as const, name: 'Global', accent: '#6366F1', accentLight: '#A5B4FC' },
] as const;

const CHAT: Record<string, ChatMessageData[]> = {
  health: [
    { id: 'h1', type: 'bot', content: "Hey there! I'm your ACKO health insurance assistant. Let's find the perfect plan for you.", timestamp: Date.now() },
    { id: 'h2', type: 'user', content: 'I need health insurance for my family of 4.', timestamp: Date.now(), editable: true, stepId: 'h2' },
    { id: 'h3', type: 'system', content: 'Family members selected', timestamp: Date.now() },
    { id: 'h4', type: 'bot', content: 'Great choice! A family plan covers everyone under one policy.', timestamp: Date.now() },
  ],
  motor: [
    { id: 'm1', type: 'bot', content: "Welcome to ACKO Motor Insurance! Let's get your vehicle covered in minutes.", timestamp: Date.now() },
    { id: 'm2', type: 'user', content: 'I want to insure my Hyundai Creta 2023.', timestamp: Date.now(), editable: true, stepId: 'm2' },
    { id: 'm3', type: 'bot', content: 'Excellent! I found your vehicle details. Let me fetch the best plans.', timestamp: Date.now() },
  ],
  life: [
    { id: 'l1', type: 'bot', content: "Hello! I'm here to help you choose the right life insurance plan.", timestamp: Date.now() },
    { id: 'l2', type: 'user', content: 'I want a term plan with 1 crore coverage.', timestamp: Date.now(), editable: true, stepId: 'l2' },
    { id: 'l3', type: 'bot', content: "A ₹1 Cr term plan is a smart choice. Let me calculate the best premium.", timestamp: Date.now() },
  ],
};

const noop = () => {};
const noopS = (_: string) => {};
const noopA = (_: any) => {};

/* ═══════════════════════════════════════════
   INLINE SVG ICON MAP (for Global > Icons)
   ═══════════════════════════════════════════ */
const IP: Record<string, string> = {
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  child: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  hospital: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
};

/* ═══════════════════════════════════════════
   HEALTH — uses real ChatWidgets components
   ═══════════════════════════════════════════ */
const HEALTH_TABS: DSTab[] = [
  { id: 'widgets', label: 'Widgets', items: [
    { id: 'h-sel-intent', name: 'SelectionCards — Intent', source: 'ChatWidgets → SelectionCards', displayMode: 'sticky',
      render: () => <HealthSelectionCards options={[
        { id: 'exploring', label: 'Just exploring', description: 'Browsing options, no rush', icon: 'search' },
        { id: 'ready_to_buy', label: 'Ready to purchase', description: 'I want to buy today', icon: 'check' },
        { id: 'switch', label: 'Check gaps / switch', description: 'Compare my existing plan', icon: 'switch' },
        { id: 'not_sure', label: 'Not sure what to buy', description: 'Help me decide', icon: 'help' },
      ]} onSelect={noopS} /> },
    { id: 'h-multi-family', name: 'MultiSelect — Who to Cover', source: 'ChatWidgets → MultiSelect', displayMode: 'sticky',
      render: () => <HealthMultiSelect options={[
        { id: 'self', label: 'Myself', icon: 'user' },
        { id: 'spouse', label: 'Spouse', icon: 'heart' },
        { id: 'children', label: 'Children', icon: 'child' },
        { id: 'father', label: 'Father', icon: 'father' },
        { id: 'mother', label: 'Mother', icon: 'mother' },
      ]} onSelect={noop} /> },
    { id: 'h-multi-conditions', name: 'MultiSelect — Health Conditions', source: 'ChatWidgets → MultiSelect', displayMode: 'sticky',
      render: () => <HealthMultiSelect options={[
        { id: 'diabetes', label: 'Diabetes' },
        { id: 'hypertension', label: 'Hypertension / BP' },
        { id: 'thyroid', label: 'Thyroid' },
        { id: 'asthma', label: 'Asthma / respiratory' },
        { id: 'heart', label: 'Heart condition' },
        { id: 'none', label: 'None of these', icon: 'check_circle' },
      ]} onSelect={noop} /> },
    { id: 'h-num-age', name: 'NumberInput — Age', source: 'ChatWidgets → NumberInput', displayMode: 'sticky',
      render: () => <HealthNumberInput placeholder="Enter your age" subText="Age of primary insured" onSubmit={noopS} /> },
    { id: 'h-pincode', name: 'PincodeInput', source: 'ChatWidgets → PincodeInput', displayMode: 'sticky',
      render: () => <HealthPincodeInput placeholder="Enter pincode" onSubmit={noopS} /> },
    { id: 'h-dob', name: 'DOB Collection', source: 'ChatWidgets → DobCollectionWidget', displayMode: 'sticky',
      render: () => <DobCollectionWidget onConfirm={noopS} /> },
    { id: 'h-freq', name: 'FrequencySelect', source: 'ChatWidgets → FrequencySelect', displayMode: 'sticky',
      render: () => <FrequencySelect onSelect={noopS} /> },
  ]},
  { id: 'cards', label: 'Cards', items: [
    { id: 'h-plan-switcher', name: 'PlanSwitcher', source: 'ChatWidgets → PlanSwitcher', displayMode: 'inline',
      render: () => <PlanSwitcher onSelect={noopS} /> },
    { id: 'h-usp', name: 'USP Cards', source: 'ChatWidgets → UspCards', displayMode: 'inline',
      render: () => <UspCards onContinue={noop} /> },
    { id: 'h-gap-results', name: 'Gap Analysis Results', source: 'ChatWidgets → GapResultsWidget', displayMode: 'inline',
      render: () => <GapResultsWidget onContinue={noop} /> },
    { id: 'h-confirm-details', name: 'Confirm Details', source: 'ChatWidgets → ConfirmDetailsWidget', displayMode: 'inline',
      render: () => <ConfirmDetailsWidget onConfirm={noop} /> },
    { id: 'h-hospital-list', name: 'Hospital Network List', source: 'ChatWidgets → HospitalList', displayMode: 'inline',
      render: () => <HospitalList onContinue={noop} /> },
    { id: 'h-review-summary', name: 'Review Summary', source: 'ChatWidgets → ReviewSummary', displayMode: 'inline',
      render: () => <ReviewSummary onConfirm={noop} /> },
    { id: 'h-summary-card', name: 'Health Summary Card', source: 'ChatWidgets → HealthSummaryCard', displayMode: 'inline',
      render: () => <HealthSummaryCard onConfirm={noop} /> },
    { id: 'h-celebration', name: 'Celebration', source: 'ChatWidgets → Celebration', displayMode: 'inline',
      render: () => <Celebration /> },
  ]},
  { id: 'chat', label: 'Chat', items: [
    { id: 'h-chat', name: 'Chat Bubbles', source: 'ds/ChatMessage', displayMode: 'inline',
      render: () => <div className="space-y-1">{CHAT.health.map(m => <ChatMessage key={m.id} message={m} />)}</div> },
    { id: 'h-typing', name: 'Typing Indicator', source: 'ds/ChatMessage', displayMode: 'inline',
      render: () => <TypingIndicator /> },
  ]},
];

/* ═══════════════════════════════════════════
   MOTOR — uses real MotorWidgets components
   ═══════════════════════════════════════════ */
const MOTOR_TABS: DSTab[] = [
  { id: 'widgets', label: 'Widgets', items: [
    { id: 'm-sel-type', name: 'SelectionCards — Car / Bike', source: 'MotorWidgets → MotorSelectionCards', displayMode: 'sticky',
      render: () => <MotorSelectionCards options={[
        { id: 'car', label: 'Car', description: 'Hatchback, Sedan, SUV', icon: 'car' },
        { id: 'bike', label: 'Bike', description: 'Scooter, Motorcycle', icon: 'scooter' },
      ]} onSelect={noopS} /> },
    { id: 'm-sel-renew', name: 'SelectionCards — Renew / New', source: 'MotorWidgets → MotorSelectionCards', displayMode: 'sticky',
      render: () => <MotorSelectionCards options={[
        { id: 'yes', label: 'Renew my policy', description: 'I have a registration number', icon: 'renew' },
        { id: 'no', label: 'Insure a new car', description: 'Just bought or buying soon', icon: 'new_car' },
      ]} onSelect={noopS} /> },
    { id: 'm-sel-commercial', name: 'SelectionCards — Personal / Commercial', source: 'MotorWidgets → MotorSelectionCards', displayMode: 'sticky',
      render: () => <MotorSelectionCards options={[
        { id: 'no', label: 'Personal use', icon: 'user' },
        { id: 'yes', label: 'Commercial / taxi', icon: 'commercial_car' },
      ]} onSelect={noopS} /> },
    { id: 'm-reg', name: 'VehicleRegInput', source: 'MotorWidgets → VehicleRegInput', displayMode: 'sticky',
      render: () => <VehicleRegInput placeholder="Enter vehicle registration (MH 04 EQ 4392)" onSubmit={noopS} /> },
    { id: 'm-text', name: 'MotorTextInput', source: 'MotorWidgets → MotorTextInput', displayMode: 'sticky',
      render: () => <MotorTextInput placeholder="Enter your full name" onSubmit={noopS} /> },
    { id: 'm-brand', name: 'BrandSelector', source: 'MotorWidgets → BrandSelector', displayMode: 'sticky',
      render: () => <BrandSelector onSelect={noopS} /> },
    { id: 'm-model', name: 'ModelSelector', source: 'MotorWidgets → ModelSelector', displayMode: 'sticky',
      render: () => <ModelSelector onSelect={noopS} /> },
    { id: 'm-variant', name: 'VariantSelector', source: 'MotorWidgets → VariantSelector', displayMode: 'sticky',
      render: () => <VariantSelector onSelect={noopS} /> },
    { id: 'm-year', name: 'YearSelector', source: 'MotorWidgets → YearSelector', displayMode: 'sticky',
      render: () => <YearSelector onSelect={noopS} /> },
    { id: 'm-ncb', name: 'NcbSelector', source: 'MotorWidgets → NcbSelector', displayMode: 'sticky',
      render: () => <NcbSelector onSelect={noopS} /> },
    { id: 'm-insurer', name: 'InsurerSelector', source: 'MotorWidgets → InsurerSelector', displayMode: 'sticky',
      render: () => <InsurerSelector onSelect={noopS} /> },
  ]},
  { id: 'cards', label: 'Cards', items: [
    { id: 'm-vehicle-details', name: 'VehicleDetailsCard', source: 'MotorWidgets → VehicleDetailsCard', displayMode: 'inline',
      render: () => <VehicleDetailsCard onConfirm={noop} onRetry={noop} /> },
    { id: 'm-summary', name: 'EditableSummary', source: 'MotorWidgets → EditableSummary', displayMode: 'inline',
      render: () => <EditableSummary onConfirm={noop} onEditField={noopS} isBrandNew={false} /> },
    { id: 'm-ncb-reward', name: 'NcbReward', source: 'MotorWidgets → NcbReward', displayMode: 'inline',
      render: () => <NcbReward onContinue={noop} /> },
    { id: 'm-loader', name: 'ProgressiveLoader', source: 'MotorWidgets → ProgressiveLoader', displayMode: 'inline',
      render: () => <ProgressiveLoader onComplete={noop} /> },
    { id: 'm-plan-calc', name: 'PlanCalculator', source: 'MotorWidgets → PlanCalculator', displayMode: 'inline',
      render: () => <PlanCalculator onComplete={noop} /> },
    { id: 'm-plan-selector', name: 'PlanSelector', source: 'MotorWidgets → PlanSelector', displayMode: 'inline',
      render: () => <PlanSelector onSelect={noopA} /> },
    { id: 'm-plan-reco', name: 'PlanRecommendation', source: 'MotorWidgets → PlanRecommendation', displayMode: 'inline',
      render: () => <PlanRecommendation onSelect={noopA} /> },
    { id: 'm-oop-addons', name: 'OutOfPocketAddons', source: 'MotorWidgets → OutOfPocketAddons', displayMode: 'inline',
      render: () => <OutOfPocketAddons onContinue={noopA} /> },
    { id: 'm-protect-addons', name: 'ProtectEveryoneAddons', source: 'MotorWidgets → ProtectEveryoneAddons', displayMode: 'inline',
      render: () => <ProtectEveryoneAddons onContinue={noopA} /> },
    { id: 'm-premium', name: 'PremiumBreakdown', source: 'MotorFinalWidgets → PremiumBreakdown', displayMode: 'inline',
      render: () => <PremiumBreakdown onContinue={noop} /> },
    { id: 'm-rejection', name: 'RejectionScreen', source: 'MotorWidgets → RejectionScreen', displayMode: 'inline',
      render: () => <RejectionScreen /> },
  ]},
  { id: 'payment', label: 'Payment', items: [
    { id: 'm-payment', name: 'PaymentGateway', source: 'MotorFinalWidgets → PaymentGateway', displayMode: 'sheet',
      render: () => <PaymentGateway onComplete={noop} /> },
    { id: 'm-celebration', name: 'MotorCelebration', source: 'MotorFinalWidgets → MotorCelebration', displayMode: 'inline',
      render: () => <MotorCelebration onContinue={noop} /> },
    { id: 'm-policy-tracker', name: 'PolicyTracker', source: 'MotorFinalWidgets → PolicyTracker', displayMode: 'inline',
      render: () => <PolicyTracker onContinue={noop} /> },
    { id: 'm-nps', name: 'NPS Feedback', source: 'MotorFinalWidgets → NpsFeedback', displayMode: 'sticky',
      render: () => <NpsFeedback onSubmit={noopA} /> },
    { id: 'm-app-cta', name: 'App Download CTA', source: 'MotorFinalWidgets → AppDownloadCta', displayMode: 'inline',
      render: () => <AppDownloadCta onComplete={noop} /> },
  ]},
  { id: 'chat', label: 'Chat', items: [
    { id: 'm-chat', name: 'Chat Bubbles', source: 'ds/ChatMessage', displayMode: 'inline',
      render: () => <div className="space-y-1">{CHAT.motor.map(m => <ChatMessage key={m.id} message={m} />)}</div> },
    { id: 'm-typing', name: 'Typing Indicator', source: 'ds/ChatMessage', displayMode: 'inline',
      render: () => <TypingIndicator /> },
  ]},
];

/* ═══════════════════════════════════════════
   LIFE — uses real components where available
   ═══════════════════════════════════════════ */
const LIFE_TABS: DSTab[] = [
  { id: 'widgets', label: 'Widgets', items: [
    { id: 'l-sel-plan', name: 'SelectionCards — Plan Types', source: 'ChatWidgets → SelectionCards', displayMode: 'sticky',
      render: () => <HealthSelectionCards options={[
        { id: 'term', label: 'Term Plan', description: 'Pure protection at low cost', icon: 'shield' },
        { id: 'savings', label: 'Savings Plan', description: 'Protection + guaranteed returns', icon: 'star' },
        { id: 'ulip', label: 'ULIP', description: 'Market-linked returns', icon: 'forward' },
        { id: 'retirement', label: 'Retirement', description: 'Pension & annuity plans', icon: 'sunrise' },
      ]} onSelect={noopS} /> },
    { id: 'l-multi-riders', name: 'MultiSelect — Riders', source: 'ChatWidgets → MultiSelect', displayMode: 'sticky',
      render: () => <HealthMultiSelect options={[
        { id: 'accidental', label: 'Accidental Death', icon: 'shield' },
        { id: 'critical', label: 'Critical Illness', icon: 'heart' },
        { id: 'disability', label: 'Disability Waiver', icon: 'user' },
        { id: 'terminal', label: 'Terminal Illness', icon: 'hospital' },
      ]} onSelect={noop} /> },
    { id: 'l-num-income', name: 'NumberInput — Income', source: 'ChatWidgets → NumberInput', displayMode: 'sticky',
      render: () => <HealthNumberInput placeholder="Enter annual income" subText="Helps us recommend the right coverage" onSubmit={noopS} /> },
    { id: 'l-text-name', name: 'NumberInput — Name', source: 'ChatWidgets → NumberInput', displayMode: 'sticky',
      render: () => <HealthNumberInput placeholder="Enter your full name" inputType="text" onSubmit={noopS} /> },
  ]},
  { id: 'chat', label: 'Chat', items: [
    { id: 'l-chat', name: 'Chat Bubbles', source: 'ds/ChatMessage', displayMode: 'inline',
      render: () => <div className="space-y-1">{CHAT.life.map(m => <ChatMessage key={m.id} message={m} />)}</div> },
    { id: 'l-typing', name: 'Typing Indicator', source: 'ds/ChatMessage', displayMode: 'inline',
      render: () => <TypingIndicator /> },
  ]},
];

/* ═══════════════════════════════════════════
   GLOBAL — shared primitives & assets
   ═══════════════════════════════════════════ */
const GLOBAL_TABS: DSTab[] = [
  { id: 'buttons', label: 'Buttons', items: [
    { id: 'g-btn-primary', name: 'Primary CTA', source: 'ChatWidgets, MotorWidgets', displayMode: 'inline', render: () => <div className="space-y-3"><button className="w-full py-3.5 rounded-xl text-[14px] font-semibold active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>Continue</button><button className="w-full py-3 rounded-xl text-[14px] font-semibold active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}>Submit</button></div> },
    { id: 'g-btn-secondary', name: 'Secondary / Outline', source: 'ChatContainer', displayMode: 'inline', render: () => <div className="space-y-3"><button className="w-full py-3 rounded-xl text-[14px] font-semibold" style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)' }}>Secondary Button</button></div> },
    { id: 'g-btn-ghost', name: 'Ghost / Link', source: 'ChatWidgets', displayMode: 'inline', render: () => <div className="space-y-3"><button className="w-full py-2 text-[14px] font-medium" style={{ color: 'var(--btn-ghost-text)' }}>Ghost Button</button><button className="w-full py-2 text-[14px] font-medium" style={{ color: 'var(--btn-link-text)' }}>Link Button</button></div> },
    { id: 'g-btn-danger', name: 'Danger', source: 'PostPaymentJourney', displayMode: 'inline', render: () => <button className="w-full py-3 rounded-xl text-[14px] font-semibold" style={{ background: 'var(--btn-danger-bg)', color: 'var(--btn-danger-text)', boxShadow: 'var(--btn-danger-shadow)' }}>Cancel Policy</button> },
    { id: 'g-btn-disabled', name: 'Disabled', source: 'ChatWidgets', displayMode: 'inline', render: () => <button className="w-full py-3 rounded-xl text-[14px] font-semibold cursor-not-allowed" style={{ background: 'var(--btn-disabled-bg)', color: 'var(--btn-disabled-text)' }}>Disabled Button</button> },
    { id: 'g-btn-icon', name: 'Icon Buttons', source: 'Header, ThemeToggle', displayMode: 'inline', render: () => <div className="flex items-center gap-3">{['M6 18L18 6M6 6l12 12', 'M15.75 19.5L8.25 12l7.5-7.5', 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'].map((d, i) => <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-text-muted)' }}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg></button>)}</div> },
  ]},
  { id: 'tags', label: 'Tags & Badges', items: [
    { id: 'g-tag-status', name: 'Status Tags', source: 'PostPaymentJourney', displayMode: 'inline', render: () => <div className="flex flex-wrap gap-2">{[{ l: 'Active', c: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }, { l: 'Pending', c: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }, { l: 'Expired', c: 'bg-red-500/20 text-red-300 border-red-500/30' }, { l: 'Processing', c: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }].map(t => <span key={t.l} className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${t.c}`}>{t.l}</span>)}</div> },
    { id: 'g-tag-plan', name: 'Plan Badges', source: 'ChatWidgets', displayMode: 'inline', render: () => <div className="flex flex-wrap gap-2">{[{ l: 'Platinum', badge: 'purple' }, { l: 'Gold', badge: 'orange' }, { l: 'Silver', badge: 'gray' }, { l: 'Recommended', badge: 'green' }].map(t => <span key={t.l} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `linear-gradient(0deg, var(--color-badge-${t.badge}-gradient-from), var(--color-badge-${t.badge}-gradient-to))`, border: `1px solid var(--color-badge-${t.badge}-border)`, color: `var(--color-badge-${t.badge}-text)` }}>{t.l}</span>)}</div> },
    { id: 'g-tag-feature', name: 'Feature Pills', source: 'ChatWidgets', displayMode: 'inline', render: () => <div className="flex flex-wrap gap-1.5">{['Cashless', 'No Room Rent', 'Day-1 Cover', 'Pre-existing', 'Maternity', 'OPD'].map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--app-surface)', color: 'var(--app-text-muted)' }}>{f}</span>)}</div> },
  ]},
  { id: 'progress', label: 'Progress', items: [
    { id: 'g-prog-bar', name: 'Progress Bar', source: 'MotorWidgets', displayMode: 'inline', render: () => <div className="space-y-4">{[30, 60, 100].map(p => <div key={p}><div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--app-text-muted)' }}><span>Step {p / 30}</span><span>{p}%</span></div><div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--app-surface)' }}><div className="h-full rounded-full" style={{ width: `${p}%`, background: 'var(--app-accent, #7C3AED)' }} /></div></div>)}</div> },
    { id: 'g-prog-steps', name: 'Step Indicator', source: 'MotorWidgets', displayMode: 'inline', render: () => <div className="flex items-center gap-2">{[1, 2, 3, 4].map(s => <div key={s} className="flex items-center gap-2">{<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s <= 2 ? 'bg-purple-500 text-white' : ''}`} style={s > 2 ? { background: 'var(--app-surface)', color: 'var(--app-text-muted)' } : {}}>{s <= 2 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : s}</div>}{s < 4 && <div className={`w-8 h-0.5 ${s < 2 ? 'bg-purple-500' : ''}`} style={s >= 2 ? { background: 'var(--app-surface)' } : {}} />}</div>)}</div> },
  ]},
  { id: 'icons', label: 'Icons', items: [
    ...Object.entries(ICON_SECTIONS).map(([section, icons]) => ({
      id: `g-icon-${section}`, name: `Icons — ${section}`, source: 'inline SVG', displayMode: 'inline' as DisplayMode,
      render: () => <div className="grid grid-cols-4 gap-3">{(icons as string[]).filter(n => IP[n]).map(name => <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><svg width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--app-text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" d={IP[name]} /></svg><span className="text-[9px] truncate w-full text-center" style={{ color: 'var(--app-text-subtle)' }}>{name}</span></div>)}</div>,
    })),
    ...Object.entries(FILE_ICON_SECTIONS).map(([section, icons]) => ({
      id: `g-ficon-${section}`, name: `File Icons — ${section}`, source: '/icons/', displayMode: 'inline' as DisplayMode,
      render: () => <div className="grid grid-cols-4 gap-3">{icons.slice(0, 12).map(name => <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(`/icons/${encodeURIComponent(name)}`)} alt={name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(0.7)' }} /><span className="text-[9px] truncate w-full text-center" style={{ color: 'var(--app-text-subtle)' }}>{name.replace('.svg', '')}</span></div>)}</div>,
    })),
  ]},
  { id: 'assets', label: 'Assets', items: [
    { id: 'g-brand-logos', name: 'Vehicle Brand Logos', source: '/logos/', displayMode: 'inline', render: () => <div className="grid grid-cols-4 gap-3">{BRAND_LOGOS_ALL.slice(0, 16).map(b => <div key={b} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(`/logos/${b}.svg`)} alt={b} className="w-8 h-8 object-contain" /><span className="text-[9px] truncate" style={{ color: 'var(--app-text-subtle)' }}>{b}</span></div>)}</div> },
    { id: 'g-vehicle-imgs', name: 'Vehicle Images', source: '/car-images/', displayMode: 'inline', render: () => <div className="grid grid-cols-3 gap-3">{VEHICLE_IMAGES.slice(0, 9).map(v => <div key={v.name} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(`/car-images/${v.file}`)} alt={v.name} className="w-16 h-12 object-contain" /><span className="text-[9px] truncate" style={{ color: 'var(--app-text-subtle)' }}>{v.name}</span></div>)}</div> },
    { id: 'g-hospital-logos', name: 'Hospital Partner Logos', source: '/hospitals/', displayMode: 'inline', render: () => <div className="grid grid-cols-4 gap-3">{HOSPITAL_PARTNERS.map(h => <div key={h.id} className="flex flex-col items-center gap-1 p-3 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(h.logo)} alt={h.name} className="w-10 h-10 object-contain" /><span className="text-[9px]" style={{ color: 'var(--app-text-subtle)' }}>{h.name}</span></div>)}</div> },
    { id: 'g-acko-brand', name: 'ACKO Brand Assets', source: '/brand-logo/', displayMode: 'inline', render: () => <div className="grid grid-cols-2 gap-3">{ACKO_BRAND_LOGOS.map(a => <div key={a.name} className="p-4 rounded-lg flex flex-col items-center gap-2" style={{ background: 'var(--app-surface)' }}><img src={assetPath(a.file)} alt={a.name} className="h-8 object-contain" /><span className="text-[9px]" style={{ color: 'var(--app-text-subtle)' }}>{a.name}</span></div>)}</div> },
    { id: 'g-offering-imgs', name: 'Product Images', source: '/offerings/', displayMode: 'inline', render: () => <div className="grid grid-cols-3 gap-3">{OFFERING_IMAGES.slice(0, 9).map(o => <div key={o.name} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(o.file)} alt={o.name} className="w-16 h-12 object-contain" /><span className="text-[9px] truncate" style={{ color: 'var(--app-text-subtle)' }}>{o.name}</span></div>)}</div> },
    { id: 'g-characters', name: 'Character Images', source: 'public/', displayMode: 'inline', render: () => <div className="grid grid-cols-3 gap-3">{CHARACTER_IMAGES.slice(0, 6).map(c => <div key={c.name} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(c.file)} alt={c.name} className="w-14 h-14 object-contain" /><span className="text-[9px] truncate" style={{ color: 'var(--app-text-subtle)' }}>{c.name}</span></div>)}</div> },
    { id: 'g-footer-icons', name: 'Footer & Social Icons', source: '/footer/', displayMode: 'inline', render: () => <div className="grid grid-cols-4 gap-3">{FOOTER_ICONS.slice(0, 12).map(f => <div key={f.name} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'var(--app-surface)' }}><img src={assetPath(f.file)} alt={f.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(0.7)' }} /><span className="text-[9px] truncate" style={{ color: 'var(--app-text-subtle)' }}>{f.name}</span></div>)}</div> },
    { id: 'g-lob-cards', name: 'LOB Product Cards', source: 'app/page', displayMode: 'inline', render: () => <div className="grid grid-cols-2 gap-3">{LOB_CARDS.map(c => <div key={c.id} className="rounded-2xl overflow-hidden p-3" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}><img src={assetPath(c.image)} alt={c.label} className="w-full h-20 object-contain mb-2" /><h4 className="text-[13px] font-semibold text-center" style={{ color: 'var(--app-text)' }}>{c.label}</h4></div>)}</div> },
  ]},
];

/* ═══════════════════════════════════════════
   TAB MAP
   ═══════════════════════════════════════════ */
const TABS_MAP: Record<LobId, DSTab[]> = {
  health: HEALTH_TABS,
  motor: MOTOR_TABS,
  life: LIFE_TABS,
  global: GLOBAL_TABS,
};

/* ═══════════════════════════════════════════
   MOCK MOTOR STATE — for store-dependent widgets
   ═══════════════════════════════════════════ */
function useMotorMockState(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;
    useMotorStore.setState({
      vehicleType: 'car',
      vehicleEntryType: 'existing',
      registrationNumber: 'KA02NE9827',
      vehicleDataSource: 'auto_fetched',
      autoFetchSuccess: true,
      vehicleData: {
        make: 'Maruti',
        model: 'Swift Dzire',
        variant: 'LXI',
        fuelType: 'petrol',
        registrationYear: 2020,
        registrationMonth: 'June',
        hasCngKit: false,
        isCommercialVehicle: false,
      },
      policyStatus: 'expired',
      previousPolicy: {
        insurer: 'TATA AIG',
        expiryDate: '28/06/2024',
        policyType: 'comprehensive',
        ncbPercentage: 35,
        hadClaims: false,
      },
      newNcbPercentage: 45,
      ncbIncreased: true,
      idv: 400000,
      idvMin: 360000,
      idvMax: 420000,
      selectedPlanType: 'comprehensive',
      selectedGarageTier: 'network',
      calculatingPlans: false,
      availablePlans: [
        { id: 'comp-network', type: 'comprehensive', garageTier: 'network', name: 'Comprehensive', premium: 11885, originalPremium: 12885, features: ['Accidents', 'Fire, theft and calamities', 'Rat-bite protection'], badge: 'Recommended', odPremium: 8534, tpPremium: 2048, ncbDiscount: 1000, gst: 2139 },
        { id: 'zd-network', type: 'zero_dep', garageTier: 'network', name: 'Zero Depreciation', premium: 15801, originalPremium: 15801, features: ['Zero depreciation', 'Accidents', 'Fire, theft and calamities'], badge: 'Best value', odPremium: 12400, tpPremium: 2048, ncbDiscount: 0, gst: 2844 },
      ],
      selectedPlan: { id: 'comp-network', type: 'comprehensive', garageTier: 'network', name: 'Comprehensive', premium: 11885, originalPremium: 12885, features: ['Accidents', 'Fire, theft and calamities', 'Rat-bite protection'], badge: 'Recommended', odPremium: 8534, tpPremium: 2048, ncbDiscount: 1000, gst: 2139 },
      selectedAddOns: ['zero_dep'],
      policyNumber: 'ACKO-MTR-2024-001234',
    } as any);
  }, [isActive]);
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function DesignSystemPage() {
  const [activeLob, setActiveLob] = useState<LobId>('health');
  const [activeSubTab, setActiveSubTab] = useState('widgets');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useMotorMockState(activeLob === 'motor');

  const tabs = TABS_MAP[activeLob];
  const currentTab = tabs.find(t => t.id === activeSubTab) || tabs[0];

  const subTabDefs: SubTabDef[] = useMemo(
    () => tabs.map(t => ({ id: t.id, label: t.label, count: t.items.length })),
    [tabs],
  );

  const handleLobChange = (id: string) => {
    setActiveLob(id as LobId);
    const newTabs = TABS_MAP[id as LobId];
    setActiveSubTab(newTabs[0].id);
    setSelectedId(null);
  };

  const handleSubTabChange = (id: string) => {
    setActiveSubTab(id);
    setSelectedId(null);
  };

  const selectedItem = currentTab.items.find(i => i.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
      <DesignSystemNav
        activeLob={activeLob}
        onLobChange={handleLobChange}
        lobs={LOBS}
        subTabs={subTabDefs}
        activeSubTab={activeSubTab}
        onSubTabChange={handleSubTabChange}
      />

      <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* LEFT — Component List */}
        <div className="flex-1 min-w-0 border-r overflow-y-auto" style={{ borderColor: 'var(--app-border)', maxHeight: 'calc(100vh - 88px)' }}>
          <div className="p-4 space-y-2">
            {currentTab.items.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="w-full text-left p-4 rounded-xl border transition-all group"
                style={selectedId === item.id
                  ? { background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.4)' }
                  : { background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate" style={{ color: selectedId === item.id ? '#C4B5FD' : 'var(--app-text)' }}>{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] truncate" style={{ color: 'var(--app-text-muted)' }}>{item.source}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{
                        background: item.displayMode === 'sticky' ? 'rgba(59,130,246,0.15)' : item.displayMode === 'sheet' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: item.displayMode === 'sticky' ? '#60A5FA' : item.displayMode === 'sheet' ? '#FBBF24' : '#34D399',
                      }}>{item.displayMode}</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: selectedId === item.id ? '#A78BFA' : 'var(--app-text-muted)', opacity: selectedId === item.id ? 1 : 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — Phone Preview */}
        <div className="w-[430px] flex-shrink-0 flex items-start justify-center py-6 sticky top-[88px]" style={{ height: 'calc(100vh - 88px)' }}>
          <PhoneFrame displayMode={selectedItem?.displayMode || 'inline'}>
            {selectedItem ? selectedItem.render() : undefined}
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
