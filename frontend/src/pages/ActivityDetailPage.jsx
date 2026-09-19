import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { connectContributeApi } from '../services/api';
import { ArrowLeft, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export default function ActivityDetailPage() {
    const { id, activityIndex } = useParams();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        connectContributeApi.getOrganization(id)
            .then(res => setOrg(res.data.data))
            .catch(() => setError('Failed to load activity details.'))
            .finally(() => setLoading(false));
    }, [id]);

    const activity = org?.activities?.[parseInt(activityIndex)];

    const handleParticipate = async () => {
        if (!org || !activity || submitting) return;
        setSubmitting(true);
        try {
            await connectContributeApi.participate({
                organizationId: org._id,
                organizationName: org.name,
                activityName: activity.name,
                activityIcon: activity.icon || '📋',
            });
            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit your request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex justify-center">
                <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error && !org) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 font-semibold">
                    {error}
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center text-stone-600 font-semibold">
                    Activity not found.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header with back */}
            <div className="flex items-center gap-4">
                <Link
                    to={`/connect-contribute/org/${org._id}`}
                    className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center transition shrink-0"
                    aria-label={t('backToOrganizations')}
                >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Link>
                <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-teal-700">{org.name}</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-950">
                        {activity.name}
                    </h1>
                </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Activity Icon & Name */}
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-28 h-28 rounded-3xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-6xl shadow-sm">
                        {activity.icon || '📋'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-charcoal-950">{activity.name}</h2>
                        <p className="text-sm text-stone-500 font-medium mt-1">{org.name}</p>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                    {activity.description && (
                        <div className="bg-stone-50 rounded-2xl p-4">
                            <p className="text-sm text-stone-700 leading-relaxed">{activity.description}</p>
                        </div>
                    )}

                    {activity.schedule && (
                        <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-200">
                            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">{t('schedule')}</span>
                                <p className="text-sm text-amber-900 font-semibold mt-0.5">{activity.schedule}</p>
                            </div>
                        </div>
                    )}

                    {org.location?.address && (
                        <div className="flex items-center gap-3 bg-sky-50 rounded-2xl p-4 border border-sky-200">
                            <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">{t('location')}</span>
                                <p className="text-sm text-sky-900 font-semibold mt-0.5">
                                    {org.location.address}{org.location.city ? `, ${org.location.city}` : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Participate Button or Success */}
                <div className="pt-4 border-t border-stone-100">
                    {submitted ? (
                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-center space-y-3 animate-in fade-in">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-900">{t('participateSuccess')}</h3>
                            <p className="text-sm text-emerald-700 font-medium">
                                {t('participateSuccessDesc')}
                            </p>
                            <Link
                                to="/connect-contribute"
                                className="inline-block mt-2 px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition"
                            >
                                {t('backToCategories')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-rose-700 font-semibold mb-4">
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handleParticipate}
                                disabled={submitting}
                                className="w-full min-h-[70px] p-5 rounded-3xl bg-teal-700 hover:bg-teal-800 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-teal-400 text-white shadow-lg border-2 border-teal-800 transition flex items-center justify-center gap-4 text-xl font-black uppercase tracking-tight cursor-pointer disabled:opacity-60"
                            >
                                {submitting ? t('submitting') : t('connectParticipate')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
