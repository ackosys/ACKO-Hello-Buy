'use client';

import { motion } from 'framer-motion';
import { useThemeStore } from '../../lib/themeStore';
import { useT } from '../../lib/translations';

export default function TrustBadges() {
  const theme = useThemeStore((s) => s.theme);
  const t = useT();
  const isLight = theme === 'light';

  const BADGES = [
    { label: t.global.irdai,       sublabel: t.global.irdaiSub       },
    { label: t.global.customers,   sublabel: t.global.customersSub   },
    { label: t.global.claimsStat,  sublabel: t.global.claimsStatSub  },
    { label: t.global.hospitals,   sublabel: t.global.hospitalsSub   },
    { label: t.global.appRating,   sublabel: t.global.appRatingSub   },
    { label: t.global.support,     sublabel: t.global.supportSub     },
  ];

  const bgColor     = isLight ? '#FFFFFF' : 'var(--app-surface)';
  const borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'var(--app-border)';
  const fadeColor   = isLight ? '#F5F3FF' : 'var(--app-surface-2, #121214)';

  return (
    <div
      className="relative overflow-hidden rounded-2xl py-4"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }} />

      <motion.div
        className="flex gap-8"
        animate={{ x: [0, -1000] }}
        transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: 20, ease: 'linear' } }}
      >
        {[1, 2, 3].map((set) =>
          BADGES.map((badge, i) => (
            <div key={`badge-${set}-${i}`} className="flex items-center gap-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-center whitespace-nowrap">
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--app-text)' }}>{badge.label}</p>
                  <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--app-text-muted)' }}>{badge.sublabel}</p>
                </div>
              </div>
              {i < BADGES.length - 1 && (
                <span className="w-px h-8" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}
