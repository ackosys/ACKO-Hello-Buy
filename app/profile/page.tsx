'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserProfileStore } from '../../lib/userProfileStore';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const APP_FEATURE_ICONS = ['/icons/Policy.svg', '/icons/Claim.svg', '/icons/Alarm.svg', '/icons/Towing.svg'];

function BackArrow({ color }: { color: string }) {
  return (
    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1L1 9l8 8" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3.61 1.814L13.793 12 3.61 22.186a1.007 1.007 0 01-.61-.92V2.734c0-.388.223-.723.61-.92z" fill="#4285F4" />
      <path d="M17.114 8.683l-3.32 3.32-3.322-3.32L3.61 1.814a1.007 1.007 0 011.178-.164l12.325 6.854v.179z" fill="#EA4335" />
      <path d="M17.114 15.497l-3.32-3.5-3.322 3.32-6.862 6.869c.34.195.75.21 1.178-.164l12.326-6.525z" fill="#34A853" />
      <path d="M20.39 12l-3.276-3.317-3.32 3.32 3.32 3.497L20.39 12.82a1.079 1.079 0 000-1.64v.82z" fill="#FBBC04" />
    </svg>
  );
}

function AppStoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.4" fill="#0D96F6" />
      <path d="M17.04 12.865l-2.658-4.604a.623.623 0 00-1.08 0l-.684 1.186 1.364 2.363h2.435c.345 0 .623.128.623.473h-3.684l-1.364-2.363-2.046 3.546h-2.25a.623.623 0 000 .623h2.873l1.364 2.363-.684 1.186a.623.623 0 001.08 0l4.711-4.773z" fill="white" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { firstName } = useUserProfileStore();
  const { theme } = useThemeStore();
  const t = useT();
  const isLight = theme === 'light';

  const APP_FEATURES = [
    { icon: APP_FEATURE_ICONS[0], title: t.appDownload.feature1Title, desc: t.appDownload.feature1Desc },
    { icon: APP_FEATURE_ICONS[1], title: t.appDownload.feature2Title, desc: t.appDownload.feature2Desc },
    { icon: APP_FEATURE_ICONS[2], title: t.appDownload.feature3Title, desc: t.appDownload.feature3Desc },
    { icon: APP_FEATURE_ICONS[3], title: t.appDownload.feature4Title, desc: t.appDownload.feature4Desc },
  ];

  const handleGetApp = useCallback(() => {
    window.open('https://acko.onelink.me/app', '_blank');
  }, []);

  return (
    <div className={`app-${theme} min-h-screen pb-24`} style={{ background: isLight ? '#ebebeb' : 'var(--app-bg)' }}>
      <div className="max-w-[430px] mx-auto">
        {/* Nav Bar */}
        <div className="flex items-center px-5 py-3.5">
          <button onClick={() => router.back()} className="p-1">
            <BackArrow color={isLight ? '#040222' : 'var(--app-text)'} />
          </button>
        </div>

        {/* Hero Card */}
        <div className="px-4 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl overflow-hidden"
            style={{
              background: isLight ? '#fbfbfb' : 'var(--app-surface)',
              border: isLight ? '1px solid white' : '1px solid var(--app-border)',
              boxShadow: isLight
                ? '0 20px 20px -3px rgba(0,0,0,0.02), 0 6px 6px -2px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02)'
                : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {/* Heading Section */}
            <div className="flex flex-col items-center pt-8 px-6 pb-2">
              <p
                className="text-[13px] font-medium tracking-[0.5px] uppercase"
                style={{ color: '#7C47E1' }}
              >
                {t.appDownload.trustedBy}
              </p>
              <h1
                className="text-[24px] font-semibold tracking-[-0.1px] leading-[32px] text-center mt-2"
                style={{ color: isLight ? '#040222' : 'var(--app-text)' }}
              >
                {t.appDownload.title}
              </h1>
              <p
                className="text-[14px] leading-[22px] text-center mt-2"
                style={{ color: isLight ? '#5b5675' : 'var(--app-text-muted)' }}
              >
                {t.appDownload.subtitle}
              </p>
            </div>

            {/* App Screenshot */}
            <div className="flex justify-center pt-4 pb-0 overflow-hidden">
              <div className="w-[280px] relative">
                <Image
                  src={`${BASE}/App-shot/Frame 2085661463.png`}
                  alt="ACKO App screenshot"
                  width={560}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Why download section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="px-4 mt-6"
        >
          <div className="flex flex-col gap-3">
            {APP_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isLight ? '#fbfbfb' : 'var(--app-surface)',
                  border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid var(--app-border)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: isLight ? '#f0ebfa' : 'rgba(124,71,225,0.15)' }}
                >
                  <Image src={`${BASE}${f.icon}`} alt="" width={20} height={20} className={isLight ? 'invert brightness-0' : ''} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold leading-[20px]" style={{ color: isLight ? '#040222' : 'var(--app-text)' }}>
                    {f.title}
                  </p>
                  <p className="text-[12px] leading-[18px] mt-0.5" style={{ color: isLight ? '#5b5675' : 'var(--app-text-muted)' }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Store Ratings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-4 mt-6 flex gap-3"
        >
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{
              background: isLight ? '#fbfbfb' : 'var(--app-surface)',
              border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid var(--app-border)',
            }}
          >
            <PlayStoreIcon />
            <div>
              <p className="text-[18px] font-bold leading-[22px]" style={{ color: isLight ? '#040222' : 'var(--app-text)' }}>4.6</p>
              <p className="text-[11px] leading-[14px]" style={{ color: isLight ? '#5b5675' : 'var(--app-text-muted)' }}>{t.appDownload.playStore}</p>
            </div>
          </div>
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{
              background: isLight ? '#fbfbfb' : 'var(--app-surface)',
              border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid var(--app-border)',
            }}
          >
            <AppStoreIcon />
            <div>
              <p className="text-[18px] font-bold leading-[22px]" style={{ color: isLight ? '#040222' : 'var(--app-text)' }}>4.8</p>
              <p className="text-[11px] leading-[14px]" style={{ color: isLight ? '#5b5675' : 'var(--app-text-muted)' }}>{t.appDownload.appStore}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA Button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: isLight
            ? 'linear-gradient(to top, #ebebeb 70%, transparent)'
            : 'linear-gradient(to top, var(--app-bg) 70%, transparent)',
        }}
      >
        <div className="max-w-[430px] mx-auto px-4 pt-4 pb-6">
          <button
            onClick={handleGetApp}
            className="w-full h-[52px] rounded-2xl text-[16px] font-semibold transition-all active:scale-[0.97]"
            style={{
              background: '#7C47E1',
              color: 'white',
              boxShadow: '0 4px 14px rgba(124,71,225,0.4)',
            }}
          >
            {t.appDownload.downloadCta}
          </button>
        </div>
      </div>
    </div>
  );
}
