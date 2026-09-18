import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Search, Globe, Check } from 'lucide-react';

export default function LanguageSelectorModal({ isOpen, onClose }) {
  const { lang, languages, changeLanguage, t } = useLanguage();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 id="language-modal-title" className="text-lg font-extrabold text-charcoal-900 tracking-tight">
                {t('selectLanguage')}
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                32 Official Indian & Global Healthcare Languages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-charcoal-900 hover:bg-stone-100 transition"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-stone-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language (e.g., Telugu, हिन्दी, Tamil, Arabic, French)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition bg-stone-50/40 text-charcoal-900 placeholder:text-stone-400"
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable Language Grid */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Indian Scheduled Languages Section */}
          {indianLanguages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  {t('indianLanguages') || '22 Official Indian Languages'}
                </span>
                <span className="text-xs text-stone-400 font-medium">({indianLanguages.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {indianLanguages.map((l) => {
                  const isSelected = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => handleSelect(l.code)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between group ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-2 ring-teal-500/20'
                          : 'border-stone-200/80 bg-white hover:border-teal-300 hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-bold text-sm text-charcoal-950 truncate">
                          {l.nativeName}
                        </div>
                        <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <span>{l.name}</span>
                          {l.dir === 'rtl' && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              RTL
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global Healthcare Languages Section */}
          {globalLanguages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
                  {t('globalLanguages') || 'Global Healthcare Languages'}
                </span>
                <span className="text-xs text-stone-400 font-medium">({globalLanguages.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {globalLanguages.map((l) => {
                  const isSelected = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => handleSelect(l.code)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between group ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-2 ring-teal-500/20'
                          : 'border-stone-200/80 bg-white hover:border-teal-300 hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-bold text-sm text-charcoal-950 truncate">
                          {l.nativeName}
                        </div>
                        <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <span>{l.name}</span>
                          {l.dir === 'rtl' && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              RTL
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-stone-500">
              <Globe className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-semibold">No language matched "{search}"</p>
              <p className="text-xs text-stone-400 mt-1">Try searching by English or native script</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <span>Active preference is saved automatically</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-charcoal-900 text-white text-xs font-bold hover:bg-charcoal-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
