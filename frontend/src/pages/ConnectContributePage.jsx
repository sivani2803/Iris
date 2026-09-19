import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
    { key: 'orphanage', icon: '👶', labelKey: 'orphanages', color: 'bg-pink-50 border-pink-200 hover:border-pink-400', iconBg: 'bg-pink-100' },
    { key: 'old_age_home', icon: '👴', labelKey: 'oldAgeHomes', color: 'bg-amber-50 border-amber-200 hover:border-amber-400', iconBg: 'bg-amber-100' },
    { key: 'charitable_trust', icon: '❤️', labelKey: 'charitableTrusts', color: 'bg-rose-50 border-rose-200 hover:border-rose-400', iconBg: 'bg-rose-100' },
    { key: 'ngo', icon: '🤝', labelKey: 'ngos', color: 'bg-teal-50 border-teal-200 hover:border-teal-400', iconBg: 'bg-teal-100' },
    { key: 'community_center', icon: '🏠', labelKey: 'communityCenters', color: 'bg-sky-50 border-sky-200 hover:border-sky-400', iconBg: 'bg-sky-100' },
];

export default function ConnectContributePage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/senior"
                    className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center transition shrink-0"
                    aria-label="Back to dashboard"
                >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-950">
                        {t('connectContribute')}
                    </h1>
                    <p className="text-sm text-stone-500 font-medium mt-1">
                        {t('connectContributeDesc')}
                    </p>
                </div>
            </div>

            {/* Instruction */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-center">
                <p className="text-base font-semibold text-teal-800">
                    {t('selectCategory')}
                </p>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.key}
                        to={`/connect-contribute/${cat.key}`}
                        className={`flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-3xl border-2 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${cat.color}`}
                    >
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl ${cat.iconBg} flex items-center justify-center text-4xl sm:text-5xl shadow-sm`}>
                            {cat.icon}
                        </div>
                        <span className="text-base sm:text-lg font-bold text-charcoal-900 text-center leading-tight">
                            {t(cat.labelKey)}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
