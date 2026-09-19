import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { connectContributeApi } from '../services/api';
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';

const CATEGORY_DISPLAY = {
    orphanage: 'orphanages',
    old_age_home: 'oldAgeHomes',
    charitable_trust: 'charitableTrusts',
    ngo: 'ngos',
    community_center: 'communityCenters',
};

export default function OrganizationDetailPage() {
    const { id } = useParams();
    const { t } = useLanguage();
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        connectContributeApi.getOrganization(id)
            .then(res => setOrg(res.data.data))
            .catch(() => setError('Failed to load organization details.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
                <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !org) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 font-semibold">
                    {error || 'Organization not found.'}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header with back */}
            <div className="flex items-center gap-4">
                <Link
                    to={`/connect-contribute/${org.category}`}
                    className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center transition shrink-0"
                    aria-label={t('backToOrganizations')}
                >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Link>
                <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-teal-700">{t('organizationDetails')}</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-950">
                        {org.name}
                    </h1>
                </div>
            </div>

            {/* Organization Profile Card */}
            <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Large Icon */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-5xl sm:text-6xl shrink-0 shadow-sm">
                        {org.image || '🏠'}
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 inline-block">
                            {t(CATEGORY_DISPLAY[org.category] || org.category)}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal-950 mt-2">{org.name}</h2>
                        <p className="text-sm text-stone-600 mt-2 leading-relaxed">{org.description}</p>
                    </div>
                </div>

                {/* Contact & Location Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
                    {org.location?.address && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="text-sm text-stone-700 font-medium">
                                {org.location.address}{org.location.city ? `, ${org.location.city}` : ''}
                            </span>
                        </div>
                    )}
                    {org.contactPhone && (
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="text-sm text-stone-700 font-medium">{org.contactPhone}</span>
                        </div>
                    )}
                    {org.contactEmail && (
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="text-sm text-stone-700 font-medium">{org.contactEmail}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Available Activities */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-charcoal-950">{t('availableActivities')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(org.activities || []).map((activity, index) => (
                        <Link
                            key={index}
                            to={`/connect-contribute/org/${org._id}/activity/${index}`}
                            className="flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 hover:border-teal-300 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition">
                                {activity.icon || '📋'}
                            </div>
                            <span className="text-sm sm:text-base font-bold text-charcoal-900 text-center">
                                {activity.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
