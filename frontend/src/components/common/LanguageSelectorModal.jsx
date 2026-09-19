import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { X, Search, Globe, Check } from 'lucide-react';

function LanguageTile({ language, isSelected, onSelect, tileRef, onKeyDown }) {
  return (
    <button
      ref={tileRef}
      type="button"
      onClick={() => onSelect(language.code)}
      onKeyDown={onKeyDown}
      className={`min-h-[4.5rem] w-full min-w-0 p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 cursor-pointer ${
        isSelected
          ? 'border-teal-600 bg-teal-50/90 shadow-xs ring-2 ring-teal-500/20'
          : 'border-stone-200/80 bg-white hover:border-teal-300 hover:bg-stone-50/70'
      }`}
      aria-pressed={isSelected}
      lang={language.code}
      dir={language.dir || 'ltr'}
      style={{ fontFeatureSettings: 'normal', fontVariantLigatures: 'normal' }}
    >
      <div className="min-w-0 flex-1 pr-1">
        <div className="font-bold text-sm text-charcoal-950 break-words [overflow-wrap:anywhere] leading-normal font-sans">
          {language.nativeName}
        </div>
        <div className="text-xs text-stone-500 flex flex-wrap items-center gap-1.5 mt-0.5 leading-normal">
          <span className="break-words [overflow-wrap:anywhere]">{language.name}</span>
          {language.dir === 'rtl' && (
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase shrink-0">
              RTL
            </span>
          )}
        </div>
      </div>
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Check className="w-3 h-3" aria-hidden="true" />
        </div>
      )}
    </button>
  );
}

export default function LanguageSelectorModal({ isOpen, onClose }) {
  const { lang, languages, changeLanguage, t } = useLanguage();
  const [search, setSearch] = useState('');
  const dialogRef = useRef(null);
  const searchRef = useRef(null);
  const previousFocusRef = useRef(null);
  const tileRefs = useRef({});
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      return undefined;
    }

    // Capture the trigger element that opened the modal to restore focus on close
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the search input on open
    const focusTimer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 50);

    const getFocusable = () => {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      const restoreTarget = previousFocusRef.current;
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        window.requestAnimationFrame(() => {
          restoreTarget.focus();
        });
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined' || !document.body) return null;

  const filtered = languages.filter((l) => {
    const q = search.toLowerCase().trim();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const indianLanguages = filtered.filter((l) => l.region.includes('India') || l.region.includes('South Asia'));
  const globalLanguages = filtered.filter((l) => l.region.includes('Global') && !l.region.includes('India'));

  const handleSelect = (code) => {
    changeLanguage(code);
    onClose();
  };

  const handleTileKeyDown = (e, index, list) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % list.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + list.length) % list.length;
    }

    if (nextIndex !== null && list[nextIndex]) {
      const nextCode = list[nextIndex].code;
      tileRefs.current[nextCode]?.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-charcoal-950/60 backdrop-blur-xs"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 flex flex-col h-[85vh] max-h-[85vh] sm:h-[min(85vh,720px)] sm:max-h-[720px] min-h-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs shrink-0">
              <Globe className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-extrabold text-charcoal-900 tracking-tight break-words">
                {t('selectLanguage')}
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                32 Official Indian & Global Healthcare Languages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-charcoal-900 hover:bg-stone-100 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Container */}
        <div className="shrink-0 p-4 border-b border-stone-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchLanguage') || 'Search language (e.g., Telugu, हिन्दी, Tamil, Arabic, French)...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition bg-stone-50/40 text-charcoal-900 placeholder:text-stone-400"
              aria-label={t('searchLanguage') || 'Search languages'}
            />
          </div>
        </div>

        {/* Independently Scrollable Language List */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 pb-8">
          {indianLanguages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  {t('indianLanguages') || '22 Official Indian Languages'}
                </span>
                <span className="text-xs text-stone-400 font-medium">({indianLanguages.length})</span>
              </div>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-2.5 items-stretch">
                {indianLanguages.map((l, index) => (
                  <LanguageTile
                    key={l.code}
                    language={l}
                    isSelected={lang === l.code}
                    onSelect={handleSelect}
                    tileRef={(el) => (tileRefs.current[l.code] = el)}
                    onKeyDown={(e) => handleTileKeyDown(e, index, indianLanguages)}
                  />
                ))}
              </div>
            </div>
          )}

          {globalLanguages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
                  {t('globalLanguages') || 'Global Healthcare Languages'}
                </span>
                <span className="text-xs text-stone-400 font-medium">({globalLanguages.length})</span>
              </div>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-2.5 items-stretch">
                {globalLanguages.map((l, index) => (
                  <LanguageTile
                    key={l.code}
                    language={l}
                    isSelected={lang === l.code}
                    onSelect={handleSelect}
                    tileRef={(el) => (tileRefs.current[l.code] = el)}
                    onKeyDown={(e) => handleTileKeyDown(e, index, globalLanguages)}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-stone-500">
              <Globe className="w-8 h-8 mx-auto text-stone-300 mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold">No language matched "{search}"</p>
              <p className="text-xs text-stone-400 mt-1">Try searching by English or native script</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3 sm:py-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between gap-3 text-xs text-stone-500">
          <span className="min-w-0 break-words">Active preference is saved automatically</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-charcoal-900 text-white text-xs font-bold hover:bg-charcoal-800 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
