import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { connectContributeApi } from '../services/api';
import { ArrowLeft, MapPin } from 'lucide-react';

const CATEGORY_LABELS = {
    orphanage: 'orphanages',
    old_age_home: 'oldAgeHomes',
    charitable_trust: 'charitableTrusts',
    ngo: 'ngos',
    community_center: 'communityCenters',
};

export default function OrganizationListPage() {
    const { category } = useParams();
    const { t } = useLanguage();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        connectContributeApi.getOrganizations(category)
            .then(res => setOrganizations(res.data.data || []))
            .catch(() => setError('Failed to load organizations.'))
            .finally(() => setLoading(false));
    }, [category]);

    const categoryLabel = t(CATEGORY_LABELS[category] || category);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/connect-contribute"
                    className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center transition shrink-0"
                    aria-label={t('backToCategories')}
                >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Link>
                <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-teal-700">{t('connectContribute')}</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-950">
                        {categoryLabel}
                    </h1>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 font-semibold">
                    {error}
                </div>
            )}

            {/* No results */}
            {!loading && !error && organizations.length === 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center">
                    <p className="text-lg font-bold text-stone-600">{t('noOrganizationsFound')}</p>
                </div>
            )}

            {/* Organization Cards */}
            {!loading && !error && organizations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {organizations.map((org) => (
                        <Link
                            key={org._id}
                            to={`/connect-contribute/org/${org._id}`}
                            className="bg-white rounded-3xl border-2 border-stone-200 hover:border-teal-300 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex items-start gap-5 group"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl sm:text-4xl shrink-0 group-hover:scale-105 transition">
                                {org.image || '🏠'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-charcoal-950 leading-tight">{org.name}</h3>
                                <p className="text-xs text-stone-500 font-medium mt-1 line-clamp-2">{org.description}</p>
                                <div className="flex items-center gap-1 mt-3">
                                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                    <span className="text-xs font-semibold text-teal-700">
                                        {org.location?.city || t('nearby')}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
