'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DesignSystemNav from '../../components/ds/DesignSystemNav';
import { Showcase, Section, SizeRow } from '../../components/ds/ComponentShowcase';
import { assetPath } from '../../lib/assetPath';
import {
  GRID_OPTIONS, LIST_OPTIONS, MULTI_SELECT_OPTIONS, DISEASE_OPTIONS, YES_NO_OPTIONS,
  PLAN_TIERS, USP_OPTIONS, VEHICLE_BRANDS, VEHICLE_DETAILS, MOTOR_ADDON_LIST,
  HOSPITAL_PARTNERS, CHAT_MESSAGES, ICON_SECTIONS, FILE_ICON_SECTIONS,
  LOB_CARDS, BRAND_LOGOS_ALL, VEHICLE_IMAGES, CHARACTER_IMAGES,
  ACKO_BRAND_LOGOS, OFFERING_IMAGES, FOOTER_ICONS,
} from '../../components/ds/SampleData';

/* ══════════════════════════════════════════════════
   Inline SVG Icon Paths (from ChatWidgets.tsx)
   ══════════════════════════════════════════════════ */

const ICON_PATHS: Record<string, string> = {
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  compare: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check_circle: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  child: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  father: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  mother: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  plus: 'M12 4.5v15m7.5-7.5h-15',
  forward: 'M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  sunrise: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  sun: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  sunset: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  shield_search: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  switch: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  chat_bubble: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  help: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.75m0-3.75h.008v.008H12v-.008z',
  pill: 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m4.5 7.795L12 12m0 0L7.5 4.205',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.66v4.993',
  hospital: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
  upload: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
};

function SvgIcon({ d, size = 24 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════ */

export default function DesignSystemPage() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [tabActive, setTabActive] = useState('platinum');
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [iconSize, setIconSize] = useState(24);

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <DesignSystemNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-16">

        {/* ═══════════════ 1. BUTTONS ═══════════════ */}
        <Section id="buttons" title="Buttons" count={12}>
          <Showcase name="Primary CTA" source="ChatWidgets.tsx, MotorWidgets.tsx" variant="full-width">
            <div className="space-y-3">
              <button className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-[0.97]" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', boxShadow: 'var(--btn-primary-shadow)' }}>
                Continue
              </button>
              <button className="w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97]">
                Submit
              </button>
            </div>
          </Showcase>

          <Showcase name="Secondary / Outline" source="ChatContainer.tsx, MotorWidgets.tsx" variant="outline">
            <div className="space-y-3">
              <button className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors" style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--btn-secondary-text)', boxShadow: 'var(--btn-secondary-shadow)' }}>
                Secondary Button
              </button>
              <button className="w-full py-3 border border-white/20 text-white/70 rounded-xl text-label-md font-medium hover:bg-white/10 transition-colors">
                Cancel
              </button>
            </div>
          </Showcase>

          <Showcase name="Ghost / Link" source="ChatWidgets.tsx, ChatContainer.tsx" variant="text-only">
            <div className="space-y-3">
              <button className="w-full py-2 text-label-md font-medium transition-colors" style={{ color: 'var(--btn-ghost-text)' }}>Ghost Button</button>
              <button className="w-full py-2 text-label-md font-medium transition-colors" style={{ color: 'var(--btn-link-text)' }}>Link Button</button>
              <button className="w-full py-2 text-white/40 hover:text-white/60 text-caption font-medium transition-colors">Skip for now</button>
            </div>
          </Showcase>

          <Showcase name="Danger" source="PostPaymentJourney.tsx" variant="destructive">
            <button className="w-full py-3 rounded-xl text-[14px] font-semibold transition-colors" style={{ background: 'var(--btn-danger-bg)', color: 'var(--btn-danger-text)', boxShadow: 'var(--btn-danger-shadow)' }}>
              Cancel Policy
            </button>
          </Showcase>

          <Showcase name="Disabled" source="ChatWidgets.tsx" variant="inactive">
            <button className="w-full py-3 rounded-xl text-[14px] font-semibold cursor-not-allowed" style={{ background: 'var(--btn-disabled-bg)', color: 'var(--btn-disabled-text)' }}>
              Disabled Button
            </button>
          </Showcase>

          <Showcase name="Icon Buttons" source="Header.tsx, ThemeToggle.tsx" variant="circle">
            <div className="flex items-center gap-3">
              {/* Close */}
              <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-text-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              {/* Back */}
              <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-text-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              {/* Menu */}
              <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-text-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              {/* Small 8x8 */}
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </Showcase>

          <Showcase name="Pill Buttons" source="PostPaymentJourney.tsx" variant="rounded-full">
            <div className="flex flex-wrap gap-2">
              <button className="px-5 py-2.5 border border-white/20 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all">Action Pill</button>
              <button className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-full text-xs font-medium hover:bg-white/20 transition-all">Skip</button>
              <button className="px-5 py-2.5 border border-green-400/60 bg-green-500/20 text-white rounded-full text-sm font-medium">Selected Pill</button>
            </div>
          </Showcase>

          <Showcase name="End Call / Danger Circle" source="PostPaymentJourney.tsx" variant="circle-danger">
            <div className="flex items-center gap-4">
              <button className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </Showcase>

          <Showcase name="Addon Toggle" source="MotorWidgets.tsx" variant="selected/unselected">
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-purple-500 text-white hover:bg-purple-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/10 text-white/70 hover:bg-white/20 border border-white/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </Showcase>

          <Showcase name="Button Groups" source="ChatContainer.tsx, MotorWidgets.tsx" variant="2-button / 3-button">
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 border border-white/20 text-white/70 rounded-xl text-label-md font-medium hover:bg-white/10 transition-colors">Cancel</button>
                <button className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-label-md font-semibold hover:bg-purple-600 transition-colors active:scale-[0.97]">Edit</button>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors">View Dashboard</button>
                <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors">Download App</button>
              </div>
            </div>
          </Showcase>

          <Showcase name="Small CTA" source="app/page.tsx" variant="PWILO / compact">
            <div className="flex items-center gap-3">
              <button className="h-[32px] px-4 rounded-lg text-[12px] font-medium" style={{ background: '#6841e6', color: 'white' }}>Continue</button>
              <button className="h-[32px] px-4 rounded-lg text-[12px] font-medium" style={{ background: 'var(--app-surface)', color: 'var(--app-text)', border: '1px solid var(--app-border)' }}>Start New</button>
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 2. TAGS, BADGES & PILLS ═══════════════ */}
        <Section id="tags-badges" title="Tags, Badges & Pills" count={15}>
          <Showcase name="Status Pills" source="PostPaymentJourney.tsx, PolicyDashboard.tsx" variant="active / rejected / waiting">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-wider">Active</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-300">Rejected</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300">Waiting Period</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-500/20 text-green-300">Covered</span>
            </div>
          </Showcase>

          <Showcase name="Plan Tier Badges" source="MotorWidgets.tsx" variant="recommended / popular">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-400/20">Recommended</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/20">Popular</span>
              <span className="text-[10px] text-green-300 bg-green-500/30 px-2 py-0.5 rounded-full">Best Value</span>
              <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">2 options</span>
            </div>
          </Showcase>

          <Showcase name="Discount & Offer Badges" source="LandingPage.tsx" variant="amber">
            <div className="flex flex-wrap gap-2">
              <div className="bg-amber-500/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">-10%</div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-purple-300 tracking-wide uppercase">Intro Offer</span>
            </div>
          </Showcase>

          <Showcase name="Vehicle Type Badge" source="MotorHeader.tsx" variant="uppercase">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider" style={{ background: 'var(--app-surface)', color: '#C084FC', border: '1px solid var(--app-border)' }}>Car</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider" style={{ background: 'var(--app-surface)', color: '#C084FC', border: '1px solid var(--app-border)' }}>Bike</span>
            </div>
          </Showcase>

          <Showcase name="Phase & System Pills" source="PostPaymentJourney.tsx, LifeChatMessage.tsx" variant="contextual">
            <div className="flex flex-wrap gap-2">
              <span className="text-purple-300 text-xs bg-purple-500/20 px-2 py-1 rounded-full">Setup</span>
              <span className="text-label-md text-purple-300/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">System message</span>
            </div>
          </Showcase>

          <Showcase name="Mandatory & Warning" source="MotorWidgets.tsx" variant="orange">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full">Mandatory by law</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(234,88,12,0.15)', color: '#EA580C' }}>test</span>
            </div>
          </Showcase>

          <Showcase name="Option Badge (absolute)" source="ChatWidgets.tsx, MotorWidgets.tsx" variant="positioned">
            <div className="relative inline-block p-6 rounded-2xl border border-white/10 bg-white/6">
              <span className="absolute -top-2 -right-2 text-[11px] bg-pink-500 text-white px-2.5 py-0.5 rounded-full font-semibold shadow-sm">Popular</span>
              <span style={{ color: 'var(--app-text)' }}>Card with badge</span>
            </div>
          </Showcase>

          <Showcase name="Premium & Policy Badges" source="PolicyDashboard.tsx" variant="themed">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>₹2,499/mo</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7' }}>Active</span>
            </div>
          </Showcase>

          <Showcase name="Video Duration" source="LandingPage.tsx" variant="overlay">
            <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded">1:00</span>
          </Showcase>
        </Section>

        {/* ═══════════════ 3. PROGRESS & INDICATORS ═══════════════ */}
        <Section id="progress" title="Progress & Step Indicators" count={8}>
          <Showcase name="Header Progress Bar" source="MotorHeader.tsx" variant="thin gradient">
            <div className="space-y-4">
              {[25, 50, 75, 100].map(p => (
                <div key={p}>
                  <span className="text-[10px] font-mono mb-1 block" style={{ color: 'var(--app-text-muted)' }}>{p}%</span>
                  <div className="h-[2px] rounded-full" style={{ background: 'var(--app-border)' }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${p}%`, background: 'linear-gradient(90deg, #7C47E1, #A855F7)' }} />
                  </div>
                </div>
              ))}
            </div>
          </Showcase>

          <Showcase name="AccidentalLimitProgressBar" source="LifeRiderCards.tsx" variant="color-coded">
            <div className="space-y-3">
              {[
                { pct: 40, color: 'bg-emerald-400', label: 'Normal (40%)' },
                { pct: 75, color: 'bg-amber-400', label: 'Near limit (75%)' },
                { pct: 100, color: 'bg-red-400', label: 'Over limit (100%)' },
              ].map(b => (
                <div key={b.label}>
                  <span className="text-[10px] mb-1 block" style={{ color: 'var(--app-text-muted)' }}>{b.label}</span>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Showcase>

          <Showcase name="Member Stepper" source="ChatWidgets.tsx" variant="segmented dots">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300" style={{ background: i < 2 ? 'var(--app-cta-bg, #7C3AED)' : i === 2 ? 'var(--app-cta-bg, #7C3AED)' : 'rgba(255,255,255,0.12)' }} />
              ))}
            </div>
          </Showcase>

          <Showcase name="Step Circles" source="EntryScreen.tsx" variant="numbered">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center border ${n <= 2 ? 'bg-purple-500/30 border-purple-400/40' : 'bg-white/15 border-white/20'}`}>
                  {n <= 1 ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : n}
                </div>
              ))}
            </div>
          </Showcase>

          <Showcase name="Slide Indicators" source="PrototypeIntro.tsx" variant="expandable dots">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <button key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === 1 ? 'w-6 bg-white/50' : 'w-1.5 bg-white/15'}`} />
              ))}
            </div>
          </Showcase>

          <Showcase name="Progress Pills" source="LifeChatWidgets.tsx" variant="colored dots">
            <div className="flex items-center gap-1.5">
              {['bg-emerald-400', 'bg-emerald-400', 'bg-purple-600', 'bg-gray-200', 'bg-gray-200'].map((c, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${c}`} />
              ))}
            </div>
          </Showcase>

          <Showcase name="Circular Progress" source="AuraClaimsWidgets.tsx" variant="SVG circle">
            <div className="flex items-center gap-6">
              {[30, 65, 100].map(pct => {
                const r = 20; const c = 2 * Math.PI * r;
                return (
                  <div key={pct} className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <circle cx="24" cy="24" r={r} fill="none" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--app-text)' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Showcase>

          <Showcase name="Typing Indicator" source="LifeChatMessage.tsx" variant="3 animated dots">
            <div className="flex gap-1.5 items-center px-4 py-3 rounded-2xl bg-white/10 w-fit">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '600ms' }} />
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 4. AVATARS ═══════════════ */}
        <Section id="avatars" title="Avatars" count={5}>
          <Showcase name="Bot / Umbrella Avatar" source="LifeChatMessage.tsx, ChatContainer.tsx" variant="circular icon">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg shadow-purple-900/20 flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-7-9H4m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            </div>
          </Showcase>

          <Showcase name="Profile Initial Avatar" source="GlobalHero.tsx" variant="letter-based">
            <div className="flex items-center gap-3">
              {['R', 'A', 'P', 'M'].map((l, i) => (
                <div key={l} className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: ['#8B6F47', '#7C3AED', '#059669', '#D97706'][i], color: 'white' }}>{l}</div>
              ))}
            </div>
          </Showcase>

          <Showcase name="Member Avatar (status)" source="PostPaymentJourney.tsx" variant="colored bg">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/30"><span className="text-xs font-bold text-white">R</span></div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/30"><span className="text-xs font-bold text-white">S</span></div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/30"><span className="text-xs font-bold text-white">K</span></div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green-500/30"><span className="text-xs font-bold text-white">P</span></div>
            </div>
          </Showcase>

          <Showcase name="Expert Image Avatar" source="MotorHeader.tsx" variant="photo">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10"><img src={assetPath('/motor-expert.png')} alt="Expert" className="w-7 h-7 object-cover" /></div>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10"><img src={assetPath('/life-expert.png')} alt="Expert" className="w-7 h-7 object-cover" /></div>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10"><img src={assetPath('/ai-assistant.png')} alt="AI" className="w-7 h-7 object-cover" /></div>
            </div>
          </Showcase>

          <Showcase name="Stacked Avatars" source="LandingPage.tsx" variant="overlapping">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold" style={{ background: ['#7C3AED', '#059669', '#D97706', '#DC2626', '#2563EB'][n - 1], color: 'white', zIndex: 5 - n }}>
                  {String.fromCharCode(64 + n)}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-white/20 flex items-center justify-center text-[10px] font-semibold" style={{ color: 'var(--app-text)', zIndex: 0 }}>+5K</div>
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 5. SELECTIONS & INPUTS ═══════════════ */}
        <Section id="selections" title="Selection & Input Widgets" count={13}>
          <Showcase name="SelectionCards — 2-col Grid" source="ChatWidgets.tsx" variant="icon grid" description="Renders when options ≤ 4 and all have icons">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {GRID_OPTIONS.map((opt) => (
                <button key={opt.id} onClick={() => setSelectedCard(opt.id)} className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200 active:scale-[0.96] min-h-[120px] justify-center ${selectedCard === opt.id ? 'border-purple-400 bg-white/15 shadow-lg shadow-purple-900/20' : 'border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20'}`}>
                  <div className="mb-2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <SvgIcon d={ICON_PATHS[opt.icon!]} size={24} />
                  </div>
                  <span className="text-body-md font-medium text-white/90">{opt.label}</span>
                </button>
              ))}
            </div>
          </Showcase>

          <Showcase name="SelectionCards — 1-col List" source="ChatWidgets.tsx" variant="list layout" description="Renders when options > 4 or no icons">
            <div className="grid grid-cols-1 gap-2.5 max-w-md">
              {LIST_OPTIONS.map((opt) => (
                <button key={opt.id} className="text-left px-4 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.97] border-white/10 bg-white/6 hover:bg-white/12 hover:border-white/20">
                  <div className="flex items-center gap-3">
                    {opt.icon && (
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <SvgIcon d={ICON_PATHS[opt.icon]} size={18} />
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-body-md font-medium text-white/90">{opt.label}</span>
                      {opt.description && <p className="text-caption text-white/40 mt-0.5">{opt.description}</p>}
                    </div>
                    {opt.badge && <span className="text-label-sm bg-purple-500/50 text-white px-2 py-0.5 rounded-full border border-purple-400/30">{opt.badge}</span>}
                  </div>
                </button>
              ))}
            </div>
          </Showcase>

          <Showcase name="MultiSelect" source="ChatWidgets.tsx" variant="checkmark grid">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {MULTI_SELECT_OPTIONS.map((opt) => {
                const sel = selectedCard === opt.id;
                return (
                  <button key={opt.id} onClick={() => setSelectedCard(sel ? null : opt.id)} className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all min-h-[120px] justify-center ${sel ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/6 hover:bg-white/12'}`}>
                    {sel && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>}
                    <div className="mb-2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><SvgIcon d={ICON_PATHS[opt.icon!]} /></div>
                    <span className="text-body-md font-medium text-white/90">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </Showcase>

          <Showcase name="NumberInput" source="ChatWidgets.tsx" variant="with currency">
            <div className="max-w-md">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5">
                <span className="text-white/40">₹</span>
                <input type="text" defaultValue="25,00,000" className="flex-1 bg-transparent text-white text-body-lg font-semibold outline-none" readOnly />
              </div>
              <button className="mt-3 w-full py-3 bg-purple-700 text-white hover:bg-purple-600 rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97]">Confirm</button>
            </div>
          </Showcase>

          <Showcase name="TextInput" source="ChatWidgets.tsx, MotorWidgets.tsx" variant="with submit">
            <div className="max-w-md">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5">
                <input type="text" placeholder="Enter your name..." className="flex-1 bg-transparent text-white text-body-md outline-none placeholder:text-white/30" readOnly />
              </div>
              <button className="mt-3 w-full py-3 bg-purple-700 text-white rounded-xl text-label-lg font-semibold transition-colors active:scale-[0.97]">Submit</button>
            </div>
          </Showcase>

          <Showcase name="PincodeInput" source="ChatWidgets.tsx" variant="6-digit">
            <div className="max-w-md">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5">
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <input type="text" defaultValue="560001" maxLength={6} className="flex-1 bg-transparent text-white text-body-lg font-semibold outline-none tracking-wider" readOnly />
              </div>
            </div>
          </Showcase>

          <Showcase name="YesNo Toggle" source="LifeChatWidgets.tsx" variant="binary choice">
            <div className="flex gap-3 max-w-md">
              {YES_NO_OPTIONS.map(opt => (
                <button key={opt.id} className={`flex-1 py-2.5 rounded-xl border text-label-md font-medium transition-all ${opt.id === 'yes' ? 'border-purple-400 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}>{opt.label}</button>
              ))}
            </div>
          </Showcase>

          <Showcase name="Frequency Select" source="ChatWidgets.tsx" variant="monthly / yearly">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[{ label: 'Monthly', price: '₹2,499/mo', sub: 'Pay as you go' }, { label: 'Yearly', price: '₹24,999/yr', sub: 'Save 17%' }].map((f, i) => (
                <button key={f.label} className={`flex flex-col items-center p-5 rounded-2xl border transition-all min-h-[130px] justify-center ${i === 1 ? 'border-purple-400 bg-white/15' : 'border-white/10 bg-white/6 hover:bg-white/10'}`}>
                  <span className="text-body-md font-semibold text-white">{f.label}</span>
                  <span className="text-lg font-bold text-white mt-1">{f.price}</span>
                  <span className="text-caption text-white/40 mt-1">{f.sub}</span>
                </button>
              ))}
            </div>
          </Showcase>

          <Showcase name="Consent Checkbox" source="ChatWidgets.tsx" variant="checkbox + text">
            <label className="flex items-start gap-3 max-w-md p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 accent-purple-500 flex-shrink-0" />
              <span className="text-body-sm text-white/70">I agree to the terms and conditions and authorize ACKO to process my health insurance application.</span>
            </label>
          </Showcase>
        </Section>

        {/* ═══════════════ 6. CARDS ═══════════════ */}
        <Section id="cards" title="Cards" count={10}>
          <Showcase name="Plan Cards" source="ChatWidgets.tsx, MotorWidgets.tsx" variant="health plan tiers">
            <div className="space-y-3 max-w-md">
              {PLAN_TIERS.map(plan => (
                <div key={plan.tier} className="rounded-2xl border p-4 transition-all" style={{ background: 'var(--app-plan-card-bg, rgba(255,255,255,0.06))', borderColor: plan.recommended ? 'rgba(168,85,247,0.4)' : 'var(--app-plan-card-border, rgba(255,255,255,0.1))' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-body-md font-semibold text-white">{plan.name}</h4>
                      <p className="text-caption text-white/40">{plan.tagline}</p>
                    </div>
                    {plan.badge && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{plan.badge}</span>}
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-bold text-white">₹{plan.monthlyPremium.toLocaleString()}</span>
                    <span className="text-caption text-white/40">/month</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features.slice(0, 3).map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Showcase>

          <Showcase name="USP Cards" source="ChatWidgets.tsx" variant="feature grid">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {USP_OPTIONS.map(opt => (
                <div key={opt.id} className="p-4 rounded-2xl border border-white/10 bg-white/6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <SvgIcon d={ICON_PATHS[opt.icon!]} />
                  </div>
                  <h4 className="text-body-sm font-semibold text-white">{opt.label}</h4>
                  <p className="text-caption text-white/40 mt-0.5">{opt.description}</p>
                </div>
              ))}
            </div>
          </Showcase>

          <Showcase name="Vehicle Details Card" source="MotorWidgets.tsx" variant="info display">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/6 max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><img src={assetPath('/logos/Hyundai.svg')} alt="Hyundai" className="w-8 h-8 object-contain" /></div>
                <div>
                  <h4 className="text-body-md font-semibold text-white">{VEHICLE_DETAILS.make} {VEHICLE_DETAILS.model}</h4>
                  <p className="text-caption text-white/40">{VEHICLE_DETAILS.variant}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-caption">
                {[['Reg No', VEHICLE_DETAILS.regNumber], ['Year', String(VEHICLE_DETAILS.year)], ['Fuel', VEHICLE_DETAILS.fuelType], ['RTO', VEHICLE_DETAILS.rto]].map(([k, v]) => (
                  <div key={k} className="px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-white/40">{k}</span>
                    <span className="block text-white/80 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Showcase>

          <Showcase name="Addon Cards" source="MotorWidgets.tsx" variant="selectable list">
            <div className="space-y-2 max-w-md">
              {MOTOR_ADDON_LIST.slice(0, 4).map(addon => (
                <div key={addon.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/6">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <img src={assetPath(`/icons/${addon.icon}`)} alt="" className="w-5 h-5" style={{ filter: 'brightness(0) invert(0.7)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-white/90">{addon.label}</span>
                      {addon.recommended && <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full">Recommended</span>}
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{addon.description}</p>
                  </div>
                  <span className="text-body-sm font-semibold text-purple-300">{addon.price}</span>
                </div>
              ))}
            </div>
          </Showcase>

          <Showcase name="LOB Cards" source="app/page.tsx" variant="product bento">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {LOB_CARDS.map(card => (
                <div key={card.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/6 p-3">
                  <img src={assetPath(card.image)} alt={card.label} className="w-full h-20 object-contain mb-2" />
                  <h4 className="text-body-sm font-semibold text-white text-center">{card.label}</h4>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 7. GRID LAYOUTS ═══════════════ */}
        <Section id="grids" title="Grid Layouts" count={4}>
          <Showcase name="2-col Grid" source="ChatWidgets.tsx" variant="grid-cols-2 gap-3" description="Used for selection cards ≤ 4, LOB cards, vehicle type">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-20 rounded-2xl border border-white/10 bg-white/6 flex items-center justify-center text-white/40 text-sm">Cell {n}</div>)}
            </div>
          </Showcase>
          <Showcase name="3-col Grid" source="MotorWidgets.tsx" variant="grid-cols-3 gap-2" description="Used for brand logos, year selector, time slots">
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-16 rounded-xl border border-white/10 bg-white/6 flex items-center justify-center text-white/40 text-sm">Cell {n}</div>)}
            </div>
          </Showcase>
          <Showcase name="4-col Grid" source="LandingPage.tsx" variant="grid-cols-4 gap-1.5" description="Used for hospital partners, months">
            <div className="grid grid-cols-4 gap-1.5 max-w-md">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="h-14 rounded-lg border border-white/10 bg-white/6 flex items-center justify-center text-white/40 text-xs">C{n}</div>)}
            </div>
          </Showcase>
          <Showcase name="1-col List" source="ChatWidgets.tsx" variant="grid-cols-1 gap-2.5" description="Used for long option lists">
            <div className="grid grid-cols-1 gap-2.5 max-w-md">
              {[1, 2, 3].map(n => <div key={n} className="h-12 rounded-xl border border-white/10 bg-white/6 flex items-center px-4 text-white/40 text-sm">Item {n}</div>)}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 8. TABS & ACCORDIONS ═══════════════ */}
        <Section id="tabs-accordions" title="Tabs & Accordions" count={3}>
          <Showcase name="Plan Tier Tabs" source="ChatWidgets.tsx" variant="segmented control">
            <div className="flex gap-1 p-1 rounded-xl mb-4 max-w-md" style={{ background: 'var(--app-surface)' }}>
              {['Platinum', 'Platinum Lite', 'Super Top-Up'].map(t => (
                <button key={t} onClick={() => setTabActive(t)} className="flex-1 py-2.5 px-2 rounded-lg text-[13px] font-semibold transition-all duration-200" style={tabActive === t ? { background: 'var(--app-cta-bg, #7C3AED)', color: '#FFFFFF' } : { background: 'transparent', color: 'var(--app-text-muted)' }}>
                  {t}
                </button>
              ))}
            </div>
          </Showcase>

          <Showcase name="Covered / Not Covered Tabs" source="MotorWidgets.tsx" variant="plan detail tabs">
            <div className="flex gap-1 p-1 rounded-xl max-w-md" style={{ background: 'var(--app-surface)' }}>
              {['Covered', 'Not Covered', 'Upgrades'].map((t, i) => (
                <button key={t} className="flex-1 py-2 px-2 rounded-lg text-[12px] font-semibold transition-all" style={i === 0 ? { background: 'var(--app-cta-bg, #7C3AED)', color: '#FFFFFF' } : { background: 'transparent', color: 'var(--app-text-muted)' }}>
                  {t}
                </button>
              ))}
            </div>
          </Showcase>

          <Showcase name="Feature Accordion" source="ChatWidgets.tsx" variant="expandable">
            <div className="max-w-md border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setAccordionOpen(!accordionOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors">
                <span className="text-body-sm text-white/80">Unlimited restoration benefit</span>
                <svg className={`w-4 h-4 text-white/40 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {accordionOpen && (
                <div className="px-4 pb-3 text-caption text-white/50">
                  Your sum insured is restored to full value after every claim, giving you unlimited coverage throughout the year.
                </div>
              )}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 9. SKELETONS & DIVIDERS ═══════════════ */}
        <Section id="skeletons-dividers" title="Skeletons, Dividers & Banners" count={5}>
          <Showcase name="PlanCardSkeleton" source="MotorWidgets.tsx" variant="loading placeholder">
            <div className="rounded-2xl overflow-hidden p-4 animate-pulse max-w-md border border-white/10 bg-white/6">
              <div className="flex items-start justify-between mb-4">
                <div><div className="h-3.5 w-36 bg-white/10 rounded-full" /><div className="h-2.5 w-20 bg-white/10 rounded-full mt-2" /></div>
                <div className="h-5 w-16 bg-white/10 rounded-full" />
              </div>
              <div className="h-6 w-24 bg-white/10 rounded-full mb-3" />
              <div className="flex gap-2"><div className="h-5 w-20 bg-white/10 rounded-full" /><div className="h-5 w-24 bg-white/10 rounded-full" /><div className="h-5 w-16 bg-white/10 rounded-full" /></div>
            </div>
          </Showcase>

          <Showcase name="Dividers" source="MotorFinalWidgets.tsx, ChatWidgets.tsx" variant="horizontal / vertical">
            <div className="space-y-4 max-w-md">
              <div><span className="text-[10px] mb-1 block" style={{ color: 'var(--app-text-muted)' }}>Horizontal (themed)</span><div className="h-px" style={{ background: 'var(--app-border)' }} /></div>
              <div><span className="text-[10px] mb-1 block" style={{ color: 'var(--app-text-muted)' }}>Horizontal (subtle)</span><div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} /></div>
              <div className="flex items-center gap-3">
                <span className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>Vertical</span>
                <div className="w-px h-8 bg-white/20" />
                <span className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>(trust badges)</span>
              </div>
            </div>
          </Showcase>

          <Showcase name="Discount Banner" source="LandingPage.tsx" variant="amber">
            <div className="bg-amber-500/10 border-b border-amber-400/20 rounded-xl max-w-md">
              <div className="px-5 py-3.5 flex items-center gap-3">
                <div className="bg-amber-500/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">-10%</div>
                <span className="text-body-sm text-white/80">Existing ACKO customer? Get 10% off!</span>
              </div>
            </div>
          </Showcase>

          <Showcase name="DropOff Banner" source="DropOffBanner.tsx" variant="urgency colors">
            <div className="space-y-2 max-w-md">
              {[
                { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'High urgency' },
                { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Medium urgency' },
                { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Low urgency' },
              ].map(b => (
                <div key={b.label} className={`px-4 py-3 rounded-xl border ${b.color} flex items-center justify-between`}>
                  <span className="text-body-sm font-medium">{b.label} — Continue your journey</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 10. CHAT COMPONENTS ═══════════════ */}
        <Section id="chat" title="Chat Components" count={4}>
          <Showcase name="Chat Bubbles" source="ChatMessage.tsx, LifeChatMessage.tsx" variant="bot / user / system" maxWidth="430px">
            <div className="space-y-3">
              {CHAT_MESSAGES.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : msg.type === 'system' ? 'justify-center' : 'justify-start gap-2'}`}>
                  {msg.type === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375" /></svg>
                    </div>
                  )}
                  {msg.type === 'system' ? (
                    <span className="text-label-sm text-purple-300/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">{msg.content}</span>
                  ) : (
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${msg.type === 'user' ? 'bg-purple-600 text-white rounded-br-md' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>
                      <p className="text-body-sm">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 11. INLINE SVG ICONS ═══════════════ */}
        <Section id="inline-icons" title="Inline SVG Icon Systems" count={Object.keys(ICON_PATHS).length}>
          <Showcase name="Icon Size Selector" source="—" variant="render controls" noPadding>
            <div className="flex items-center gap-2 px-5 py-3">
              <span className="text-[11px] font-medium" style={{ color: 'var(--app-text-muted)' }}>Size:</span>
              {[16, 20, 24, 32, 48].map(s => (
                <button key={s} onClick={() => setIconSize(s)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${iconSize === s ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{s}px</button>
              ))}
            </div>
          </Showcase>

          {Object.entries(ICON_SECTIONS).map(([group, icons]) => (
            <Showcase key={group} name={`ICON_PATHS — ${group}`} source="ChatWidgets.tsx" variant={`${icons.length} icons`} maxWidth="100%">
              <div className="flex flex-wrap gap-4">
                {icons.map(name => (
                  <div key={name} className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors hover:bg-white/10" style={{ width: iconSize + 24, height: iconSize + 24, color: '#C084FC' }}>
                      <SvgIcon d={ICON_PATHS[name]} size={iconSize} />
                    </div>
                    <span className="text-[9px] font-mono text-white/40 max-w-[60px] text-center truncate">{name}</span>
                  </div>
                ))}
              </div>
            </Showcase>
          ))}
        </Section>

        {/* ═══════════════ 12. FILE-BASED ICONS ═══════════════ */}
        <Section id="file-icons" title="File-based SVG Icons" count={269}>
          {Object.entries(FILE_ICON_SECTIONS).map(([group, files]) => (
            <Showcase key={group} name={group} source="public/icons/" variant={`${files.length} icons`} maxWidth="100%">
              <div className="flex flex-wrap gap-4">
                {files.map(file => (
                  <div key={file} className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors hover:bg-white/10" style={{ width: iconSize + 24, height: iconSize + 24 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={assetPath(`/icons/${file}`)} alt={file} style={{ width: iconSize, height: iconSize, filter: 'brightness(0) invert(0.7)' }} />
                    </div>
                    <span className="text-[8px] font-mono text-white/40 max-w-[60px] text-center truncate" title={file}>{file.replace('.svg', '')}</span>
                  </div>
                ))}
              </div>
            </Showcase>
          ))}
        </Section>

        {/* ═══════════════ 13. BRAND LOGOS ═══════════════ */}
        <Section id="brand-logos" title="Vehicle Brand Logos" count={BRAND_LOGOS_ALL.length}>
          <Showcase name="All Brands (SVG)" source="public/logos/" variant="grid" maxWidth="100%">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {BRAND_LOGOS_ALL.map(brand => (
                <div key={brand} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(`/logos/${brand}.svg`)} alt={brand} className="w-10 h-10 object-contain" />
                  <span className="text-[9px] text-white/40 text-center truncate w-full">{brand}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 14. VEHICLE IMAGES ═══════════════ */}
        <Section id="vehicle-images" title="Vehicle Images" count={VEHICLE_IMAGES.length}>
          <Showcase name="Car & Bike Images" source="public/car-images/" variant="grid" maxWidth="100%">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {VEHICLE_IMAGES.map(v => (
                <div key={v.file} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(`/car-images/${v.file}`)} alt={v.name} className="w-20 h-12 object-contain" />
                  <span className="text-[10px] text-white/50 text-center">{v.name}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 15. HOSPITAL LOGOS ═══════════════ */}
        <Section id="hospital-logos" title="Hospital Partner Logos" count={HOSPITAL_PARTNERS.length}>
          <Showcase name="Hospital Partners" source="public/hospitals/" variant="4-col grid" maxWidth="100%">
            <div className="grid grid-cols-4 gap-3">
              {HOSPITAL_PARTNERS.map(h => (
                <div key={h.id} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(h.logo)} alt={h.name} className="w-12 h-12 object-contain rounded-lg" />
                  <span className="text-[10px] text-white/50">{h.name}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 16. ACKO BRAND ═══════════════ */}
        <Section id="acko-brand" title="ACKO Brand Assets" count={4}>
          <Showcase name="Brand Logos" source="public/brand-logo/" variant="4 variants" maxWidth="100%">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ACKO_BRAND_LOGOS.map(logo => (
                <div key={logo.name} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(logo.file)} alt={logo.name} className="h-8 object-contain" />
                  <span className="text-[10px] text-white/50 text-center">{logo.name}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 17. OFFERING IMAGES ═══════════════ */}
        <Section id="offering-images" title="Product & Offering Images" count={OFFERING_IMAGES.length}>
          <Showcase name="Product Cards & Heroes" source="public/offerings/" variant="grid" maxWidth="100%">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {OFFERING_IMAGES.map(img => (
                <div key={img.name} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(img.file)} alt={img.name} className="w-full h-20 object-contain" />
                  <span className="text-[10px] text-white/50 text-center">{img.name}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 18. CHARACTER IMAGES ═══════════════ */}
        <Section id="character-images" title="Character & Expert Images" count={CHARACTER_IMAGES.length}>
          <Showcase name="Characters" source="public/" variant="avatars & illustrations" maxWidth="100%">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {CHARACTER_IMAGES.map(img => (
                <div key={img.name} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(img.file)} alt={img.name} className="w-16 h-16 object-contain" />
                  <span className="text-[9px] text-white/50 text-center">{img.name}</span>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 19. FOOTER ICONS ═══════════════ */}
        <Section id="footer-icons" title="Footer & Social Icons" count={FOOTER_ICONS.length}>
          <Showcase name="Social & Compliance" source="public/footer/" variant="all sizes" maxWidth="100%">
            <div className="space-y-4">
              {[20, 24, 32, 48].map(size => (
                <SizeRow key={size} label={`${size}px`}>
                  {FOOTER_ICONS.map(icon => (
                    <div key={`${icon.name}-${size}`} className="flex flex-col items-center gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={assetPath(icon.file)} alt={icon.name} style={{ width: size, height: size, filter: 'brightness(0) invert(0.7)' }} />
                      <span className="text-[8px] text-white/30">{icon.name}</span>
                    </div>
                  ))}
                </SizeRow>
              ))}
            </div>
          </Showcase>
        </Section>

        {/* ═══════════════ 20. ANIMATED BG ═══════════════ */}
        <Section id="animated-bg" title="Animated Backgrounds" count={2}>
          <Showcase name="Theme Backgrounds" source="public/Animated_BG/" variant="light & dark" maxWidth="100%">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Light theme-BG', 'Dark theme-BG'].map(name => (
                <div key={name} className="rounded-xl overflow-hidden border border-white/10">
                  <video autoPlay loop muted playsInline className="w-full h-48 object-cover" src={assetPath(`/Animated_BG/${name}.mp4`)} />
                  <div className="px-3 py-2 bg-white/5">
                    <span className="text-[10px] text-white/50">{name}.mp4</span>
                  </div>
                </div>
              ))}
            </div>
          </Showcase>
        </Section>

      </main>

      <footer className="py-8 text-center border-t" style={{ borderColor: 'var(--app-border)' }}>
        <p className="text-caption" style={{ color: 'var(--app-text-subtle)' }}>ACKO Design System — Component Catalog</p>
      </footer>
    </div>
  );
}
