'use client';

import { assetPath } from '../../lib/assetPath';
import { useThemeStore } from '../../lib/themeStore';

export type DisplayMode = 'inline' | 'sticky' | 'sheet';

interface PhoneFrameProps {
  children?: React.ReactNode;
  displayMode?: DisplayMode;
}

export default function PhoneFrame({ children, displayMode = 'inline' }: PhoneFrameProps) {
  const hasContent = !!children;
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';
  const logoFile = isLight ? '/brand-logo/acko-full-black.svg' : '/brand-logo/acko-full-white.svg';

  return (
    <div
      className="relative w-[375px] h-[812px] rounded-[44px] border-[3px] overflow-hidden flex flex-col"
      style={{
        borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
        background: 'var(--app-bg)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Dynamic Island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[28px] rounded-full bg-black z-20" />

      {/* iOS Status Bar */}
      <div className="h-[52px] flex items-end justify-between px-8 text-[12px] font-semibold pb-1 flex-shrink-0 z-10" style={{ color: 'var(--app-text-muted)' }}>
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2z" /></svg>
          <div className="w-[18px] h-[9px] rounded-sm border border-current flex items-center p-px"><div className="h-full bg-current rounded-[1px]" style={{ width: '70%' }} /></div>
        </div>
      </div>

      {/* App Header — matches actual Header.tsx */}
      <div className="flex-shrink-0" style={{ background: 'var(--app-header-bg)', borderBottom: '1px solid var(--app-border)' }}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={assetPath(logoFile)} alt="ACKO" className="h-[18px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: isLight ? '#7C3AED' : '#D8B4FE' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 pl-0.5 pr-2.5 py-0.5 rounded-full" style={{ background: 'var(--app-overlay-bg)', border: '1px solid var(--app-border)' }}>
              <div className="w-6 h-6 rounded-full overflow-hidden" style={{ background: 'var(--app-surface)' }}>
                <img src={assetPath('/brand-ambassador.png')} alt="Expert" className="w-6 h-6 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--app-text)', opacity: 0.9 }}>Expert</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--app-text)' }}>
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </div>
          </div>
        </div>
        <div className="h-[2px]" style={{ background: 'var(--app-border)' }}>
          <div className="h-full" style={{ width: '35%', background: 'var(--app-progress-gradient)', boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />
        </div>
      </div>

      {/* ═══ CONTENT AREA — varies by displayMode ═══ */}
      {displayMode === 'inline' && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {hasContent ? (
            <div className="px-4 pt-4 pb-8">
              <div className="max-w-[80%] mb-3">
                <div className="px-4 py-3 rounded-2xl rounded-tl-md text-[13px] leading-relaxed" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-bot-text)' }}>
                  Here you go — preview this component:
                </div>
              </div>
              <div className="mb-4">{children}</div>
            </div>
          ) : <EmptyState />}
        </div>
      )}

      {displayMode === 'sticky' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-4 pt-4">
            <div className="max-w-[80%] mb-3">
              <div className="px-4 py-3 rounded-2xl rounded-tl-md text-[13px] leading-relaxed" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-bot-text)' }}>
                Which option would you like to pick?
              </div>
            </div>
          </div>
          {hasContent ? (
            <div className="shrink-0 shadow-[0_-4px_40px_rgba(0,0,0,0.3)]" style={{ background: 'var(--app-glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--app-border)' }}>
              <div className="px-5 py-5 pb-8">{children}</div>
            </div>
          ) : <EmptyState />}
        </div>
      )}

      {displayMode === 'sheet' && (
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto scrollbar-hide px-4 pt-4">
            <div className="max-w-[80%] mb-3">
              <div className="px-4 py-3 rounded-2xl rounded-tl-md text-[13px] leading-relaxed" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-bot-text)' }}>
                Let me pull that up for you...
              </div>
            </div>
          </div>
          {hasContent ? (
            <>
              <div className="absolute inset-0 bg-black/40 z-10" />
              <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl overflow-hidden" style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)', borderBottom: 'none', maxHeight: '75%' }}>
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--app-text-muted)', opacity: 0.3 }} /></div>
                <div className="overflow-y-auto scrollbar-hide px-0 pb-8" style={{ maxHeight: 'calc(75vh - 40px)' }}>
                  {children}
                </div>
              </div>
            </>
          ) : <EmptyState />}
        </div>
      )}

      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full z-30" style={{ background: 'var(--app-text-muted)', opacity: 0.2 }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
          <svg className="w-6 h-6" style={{ color: 'var(--app-text-muted)', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" /></svg>
        </div>
        <p className="text-[13px] font-medium" style={{ color: 'var(--app-text-muted)' }}>No component selected</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--app-text-subtle)' }}>Pick one from the list to preview</p>
      </div>
    </div>
  );
}
