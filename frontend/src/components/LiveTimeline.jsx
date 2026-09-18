import React from 'react';
import { Clock, CheckCircle2, AlertCircle, UserCheck, Navigation, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LiveTimeline({ timeline = [], activeStatus = 'detected' }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'detected':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'analyzing':
        return <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />;
      case 'assigned':
        return <UserCheck className="w-4 h-4 text-teal-600" />;
      case 'acknowledged':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'en_route':
        return <Navigation className="w-4 h-4 text-indigo-600 animate-pulse" />;
      case 'arrived':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'resolved':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'reassessing':
        return <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-stone-500" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'detected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'analyzing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'assigned':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_route':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'arrived':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'reassessing':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
        No active incident timeline. Telemetry is being monitored continuously.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        {timeline.map((item, index) => {
          const isLatest = index === timeline.length - 1;
          const timeFormatted = item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'Just now';

          return (
            <div key={item._id || index} className="relative mb-6 last:mb-0 group animate-in fade-in">
              {/* Dot Icon */}
              <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                isLatest ? 'border-teal-600 ring-4 ring-teal-100' : 'border-stone-300'
              }`}>
                {getStatusIcon(item.status)}
              </div>

              {/* Content Box */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:border-stone-300 transition">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-charcoal-900">{item.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {timeFormatted}
                  </div>
                </div>

                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{item.description}</p>

                {item.actor && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Actor: <strong className="text-stone-700 font-medium">{item.actor}</strong></span>
                    {isLatest && (
                      <span className="inline-flex items-center gap-1 text-teal-700 font-semibold text-[10px] uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                        Active Step
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
