/**
 * ACKO Design System — Barrel File
 *
 * Re-exports shared components that are used across multiple journeys.
 * When consolidating, move the canonical implementation into this directory
 * and update all journey-specific files to import from here.
 *
 * Current component locations:
 *
 * SHARED (used in Health, Motor, Life):
 *   SelectionCards     → components/ChatWidgets.tsx
 *   MultiSelect        → components/ChatWidgets.tsx
 *   NumberInput         → components/ChatWidgets.tsx
 *   TextInput           → components/ChatWidgets.tsx
 *   PincodeInput        → components/ChatWidgets.tsx
 *   USPCards            → components/ChatWidgets.tsx
 *   ChatMessage         → components/ChatMessage.tsx
 *   ConversationalFlow  → components/ConversationalFlow.tsx
 *   FloatingHelpButton  → components/FloatingHelpButton.tsx
 *   LanguageSelector    → components/LanguageSelector.tsx
 *   AckoLogo            → components/AckoLogo.tsx
 *
 * GLOBAL:
 *   ThemeProvider       → components/global/ThemeProvider.tsx
 *   ThemeToggle         → components/global/ThemeToggle.tsx
 *   TrustBadges         → components/global/TrustBadges.tsx
 *   ValueProps          → components/global/ValueProps.tsx
 *   LobSelector         → components/global/LobSelector.tsx
 *   DropOffBanner       → components/global/DropOffBanner.tsx
 *   PolicyDashboard     → components/global/PolicyDashboard.tsx
 *   PolicyActionScreen  → components/global/PolicyActionScreen.tsx
 *   GlobalHero          → components/global/GlobalHero.tsx
 *
 * HEALTH-SPECIFIC:
 *   PlanSwitcher        → components/ChatWidgets.tsx
 *   FrequencySelect     → components/ChatWidgets.tsx
 *   Celebration         → components/ChatWidgets.tsx
 *   HospitalList        → components/ChatWidgets.tsx
 *   DobCollection       → components/ChatWidgets.tsx
 *   GapResults          → components/ChatWidgets.tsx
 *   ConfirmDetails      → components/ChatWidgets.tsx
 *   ReviewSummary       → components/ChatWidgets.tsx
 *   ConsentWidget       → components/ChatWidgets.tsx
 *
 * MOTOR-SPECIFIC:
 *   VehicleRegInput     → components/motor/MotorWidgets.tsx
 *   BrandSelector       → components/motor/MotorWidgets.tsx
 *   ModelSelector        → components/motor/MotorWidgets.tsx
 *   VariantSelector      → components/motor/MotorWidgets.tsx
 *   YearSelector         → components/motor/MotorWidgets.tsx
 *   PlanSelector         → components/motor/MotorWidgets.tsx
 *   PremiumBreakdown     → components/motor/MotorFinalWidgets.tsx
 *   MotorCelebration     → components/motor/MotorFinalWidgets.tsx
 *   PolicyTracker        → components/motor/MotorFinalWidgets.tsx
 *   NpsFeedback          → components/motor/MotorFinalWidgets.tsx
 *   AppDownloadCta       → components/motor/MotorFinalWidgets.tsx
 *
 * LIFE-SPECIFIC:
 *   LifeDatePicker       → components/life/LifeChatWidgets.tsx
 *   LifeYesNo            → components/life/LifeChatWidgets.tsx
 *   CoverageInput        → components/life/LifeChatWidgets.tsx
 *   CoverageCard         → components/life/LifeChatWidgets.tsx
 *   RiderCards           → components/life/LifeRiderCards.tsx
 *   PremiumSummary       → components/life/LifeChatWidgets.tsx
 *
 * AURA-SPECIFIC:
 *   AuraMotorWidgets     → components/motor/aura/AuraMotorWidgets.tsx
 *   AuraClaimsWidgets    → components/motor/aura/AuraClaimsWidgets.tsx
 */

export { Showcase, Section, SizeRow } from './ComponentShowcase';
export { default as DesignSystemNav } from './DesignSystemNav';
