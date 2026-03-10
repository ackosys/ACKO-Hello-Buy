'use client';

import { motion } from 'framer-motion';
import { useJourneyStore } from '../../lib/store';
import { useLanguageStore } from '../../lib/languageStore';
import { Language } from '../../lib/types';
import { useThemeStore } from '../../lib/themeStore';
import AckoLogo from './AckoLogo';
import Link from 'next/link';
import { useT } from '../../lib/translations';

const LANGUAGE_ICONS: Record<Language, string> = {
  en: 'A', hi: 'अ', hinglish: 'Hi', kn: 'ಅ', ta: 'அ', ml: 'അ', te: 'అ',
};

interface LanguageSelectorProps {
  onSelect: () => void;
}

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const { setLanguage: setJourneyLanguage } = useJourneyStore();
  const { setLanguage } = useLanguageStore();
  const { theme } = useThemeStore();
  const t = useT();
  const isLight = theme === 'light';

  const LANGUAGES: { id: Language; label: string; sublabel: string; icon: string }[] = [
    { id: 'en', label: t.langSelect.english, sublabel: t.langSelect.englishSub, icon: LANGUAGE_ICONS.en },
    { id: 'hi', label: t.langSelect.hindi, sublabel: t.langSelect.hindiSub, icon: LANGUAGE_ICONS.hi },
    { id: 'hinglish', label: t.langSelect.hinglish, sublabel: t.langSelect.hinglishSub, icon: LANGUAGE_ICONS.hinglish },
    { id: 'kn', label: t.langSelect.kannada, sublabel: t.langSelect.kannadaSub, icon: LANGUAGE_ICONS.kn },
    { id: 'ta', label: t.langSelect.tamil, sublabel: t.langSelect.tamilSub, icon: LANGUAGE_ICONS.ta },
    { id: 'ml', label: t.langSelect.malayalam, sublabel: t.langSelect.malayalamSub, icon: LANGUAGE_ICONS.ml },
    { id: 'te', label: t.langSelect.telugu, sublabel: t.langSelect.teluguSub, icon: LANGUAGE_ICONS.te },
  ];

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setJourneyLanguage(lang);
    onSelect();
  };

  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const cardHoverBg = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.14)';
  const iconBg = isLight ? 'rgba(109,40,217,0.08)' : 'rgba(255,255,255,0.12)';
  const titleColor = isLight ? 'rgba(0,0,0,0.88)' : '#FFFFFF';
  const subColor = isLight ? 'rgba(0,0,0,0.5)' : 'var(--app-text-muted, rgba(255,255,255,0.6))';
  const headingColor = isLight ? 'rgba(0,0,0,0.88)' : '#FFFFFF';
  const subheadColor = isLight ? 'rgba(0,0,0,0.5)' : 'var(--app-text-muted, rgba(255,255,255,0.6))';
  const footerColor = isLight ? 'rgba(0,0,0,0.3)' : 'var(--app-text-subtle, rgba(255,255,255,0.4))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--app-bg)' }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <Link href="/">
          <AckoLogo variant={isLight ? 'color' : 'white'} className="h-8 mx-auto" />
        </Link>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: headingColor }}>
          {t.langSelect.title}
        </h1>
        <p className="text-sm" style={{ color: subheadColor }}>{t.langSelect.subtitle}</p>
      </motion.div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-2.5">
        {LANGUAGES.map((lang, i) => (
          <motion.button
            key={lang.id}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => handleSelect(lang.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl backdrop-blur-sm transition-all duration-200 cursor-pointer"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = cardHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = cardBg;
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold shrink-0"
              style={{ background: iconBg, color: titleColor }}
            >
              {lang.icon}
            </div>
            <div className="text-center">
              <div className="font-semibold text-[15px] leading-tight" style={{ color: titleColor }}>
                {lang.label}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: subColor }}>
                {lang.sublabel}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 text-xs text-center"
        style={{ color: footerColor }}
      >
        {t.global.poweredBy}
      </motion.p>
    </motion.div>
  );
}
