/**
 * ACKO Design System — Barrel File
 *
 * Single source of truth for shared components.
 * All journeys (Health, Motor, Life, Aura) import from here.
 *
 * How it works:
 *   - Canonical implementations live in this directory.
 *   - Old locations (components/global/, components/AckoLogo.tsx, etc.)
 *     have been replaced with re-exports pointing here.
 *   - Changing a component here propagates everywhere.
 */

// ── Group A: Identical components ──
export { default as AckoLogo } from './AckoLogo';
export { default as ThemeToggle } from './ThemeToggle';
export { default as ThemeProvider } from './ThemeProvider';
export { default as LanguageSelector } from './LanguageSelector';
export { default as FloatingHelpButton } from './FloatingHelpButton';

// ── Group B: Configurable base components ──
export { default as SelectionCards } from './SelectionCards';
export type { SelectionOption, SelectionTheme, SelectionCardsProps } from './SelectionCards';

export { default as MultiSelect } from './MultiSelect';
export type { MultiSelectOption, MultiSelectTheme, MultiSelectProps } from './MultiSelect';

export { default as NumberInput } from './NumberInput';
export type { InputTheme, NumberInputProps } from './NumberInput';

export { default as TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';

export { default as PincodeInput } from './PincodeInput';
export type { PincodeInputProps } from './PincodeInput';

export { default as ChatMessage, TypingIndicator } from './ChatMessage';
export type { ChatMessageData, ChatBubbleTheme, BaseChatMessageProps, TypingIndicatorProps } from './ChatMessage';

// ── Group C: Global components ──
export { default as TrustBadges } from './TrustBadges';
export { default as ValueProps } from './ValueProps';
export { default as LobSelector } from './LobSelector';
export { default as GlobalHero } from './GlobalHero';
export { default as DropOffBanner } from './DropOffBanner';
export { default as PolicyDashboard } from './PolicyDashboard';
export { default as PolicyActionScreen } from './PolicyActionScreen';

// ── Design System Catalog components ──
export { Showcase, Section, SizeRow } from './ComponentShowcase';
export { default as DesignSystemNav } from './DesignSystemNav';
