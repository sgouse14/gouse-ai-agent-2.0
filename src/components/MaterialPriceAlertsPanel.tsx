import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Mail,
  Calendar,
  Zap,
  Sliders,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  LiveMaterialPrice,
  MaterialPriceAlertSubscription,
  MaterialPriceAlertItem,
  AlertFrequency,
} from '../types';

interface MaterialPriceAlertsPanelProps {
  subscription: MaterialPriceAlertSubscription;
  onUpdateSubscription: (updated: Partial<MaterialPriceAlertSubscription>) => void;
  materials: LiveMaterialPrice[];
  onToggleMaterialTracked: (materialId: string) => void;
  recentAlerts: MaterialPriceAlertItem[];
  onDismissAlert: (alertId: string) => void;
  onClearAllAlerts: () => void;
  onTriggerTestAlert: () => void;
}

export const MaterialPriceAlertsPanel: React.FC<MaterialPriceAlertsPanelProps> = ({
  subscription,
  onUpdateSubscription,
  materials,
  onToggleMaterialTracked,
  recentAlerts,
  onDismissAlert,
  onClearAllAlerts,
  onTriggerTestAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'preferences' | 'materials' | 'history'>('preferences');
  const [customEmail, setCustomEmail] = useState<string>(subscription.recipientEmail || 'sgouse14@gmail.com');
  const [emailSavedFeedback, setEmailSavedFeedback] = useState<boolean>(false);

  const trackedCount = subscription.subscribedMaterialIds.length;
  const isMasterEnabled = subscription.enabled;

  const handleToggleMaster = () => {
    onUpdateSubscription({ enabled: !isMasterEnabled });
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail.trim()) {
      onUpdateSubscription({ recipientEmail: customEmail.trim() });
      setEmailSavedFeedback(true);
      setTimeout(() => setEmailSavedFeedback(false), 2500);
    }
  };

  const handleSelectAll = () => {
    const allIds = materials.map((m) => m.id);
    onUpdateSubscription({ subscribedMaterialIds: allIds });
  };

  const handleClearAllTracked = () => {
    onUpdateSubscription({ subscribedMaterialIds: [] });
  };

  const handleTrackCoreEssentials = () => {
    // Select cement, steel, sand, concrete, blocks
    const coreIds = materials
      .filter(
        (m) =>
          m.category.toLowerCase().includes('cement') ||
          m.category.toLowerCase().includes('steel') ||
          m.category.toLowerCase().includes('sand') ||
          m.category.toLowerCase().includes('concrete') ||
          m.category.toLowerCase().includes('block')
      )
      .map((m) => m.id);
    onUpdateSubscription({
      subscribedMaterialIds: Array.from(new Set([...subscription.subscribedMaterialIds, ...coreIds])),
    });
  };

  return (
    <div
      id="material-price-alerts-panel"
      className={`rounded-2xl transition-all duration-300 border ${
        isMasterEnabled
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Main Header / Master Toggle Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Icon & Description */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border shrink-0 transition-colors ${
              isMasterEnabled
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isMasterEnabled ? <BellRing className="w-5 h-5 text-amber-400 animate-pulse" /> : <BellOff className="w-5 h-5" />}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Periodic Price Change Notifications
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  isMasterEnabled
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isMasterEnabled ? 'Active Subscription' : 'Notifications Paused'}
              </span>

              {isMasterEnabled && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {trackedCount} of {materials.length} Materials Tracked
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {isMasterEnabled
                ? `Receiving ${subscription.frequency} market digest & alerts for ${trackedCount} material${
                    trackedCount === 1 ? '' : 's'
                  } via ${subscription.channelEmail ? 'Email' : ''}${
                    subscription.channelEmail && subscription.channelInApp ? ' & ' : ''
                  }${subscription.channelInApp ? 'In-App Alerts' : ''}.`
                : 'Subscribe to periodic market price change digests and volatility alerts for your tracked materials.'}
            </p>
          </div>
        </div>

        {/* Right: Master Toggle Switch & Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {/* Master Toggle Switch */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              {isMasterEnabled ? 'Subscribed' : 'Off'}
            </span>
            <button
              id="toggle-subscribe-price-alerts"
              type="button"
              role="switch"
              aria-checked={isMasterEnabled}
              onClick={handleToggleMaster}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                isMasterEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                  isMasterEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-400'
                }`}
              />
            </button>
          </div>

          {/* Test Alert Button */}
          {isMasterEnabled && (
            <button
              id="btn-test-price-alert"
              type="button"
              onClick={onTriggerTestAlert}
              title="Simulate sending a periodic price alert notification digest"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-medium transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Test Alert Digest</span>
            </button>
          )}

          {/* Expand/Collapse Settings */}
          <button
            id="btn-toggle-alert-preferences"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Preferences</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Preferences & Material Tracker Drawer */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 p-4 sm:p-5 bg-slate-950/40 space-y-4">
          {/* Sub-navigation tabs inside preferences */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('preferences')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeSettingsTab === 'preferences'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Frequency & Channels</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('materials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeSettingsTab === 'materials'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tracked Materials ({trackedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeSettingsTab === 'history'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alert History ({recentAlerts.length})</span>
              </button>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* TAB 1: FREQUENCY & CHANNELS */}
          {activeSettingsTab === 'preferences' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Frequency Selection */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Notification Schedule &amp; Frequency
                </span>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="alert-frequency"
                      checked={subscription.frequency === 'daily'}
                      onChange={() => onUpdateSubscription({ frequency: 'daily' })}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-medium text-white block">Daily Morning Digest (08:00 IST)</span>
                      <span className="text-[11px] text-slate-400">
                        Consolidated summary of overnight spot price movements and primary mill adjustments.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="alert-frequency"
                      checked={subscription.frequency === 'weekly'}
                      onChange={() => onUpdateSubscription({ frequency: 'weekly' })}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-medium text-white block">Weekly Market Summary (Mondays)</span>
                      <span className="text-[11px] text-slate-400">
                        Macro procurement trends, regional inventory reports, and 7-day commodity swings.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="alert-frequency"
                      checked={subscription.frequency === 'volatility'}
                      onChange={() => onUpdateSubscription({ frequency: 'volatility' })}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-medium text-white block">Instant Volatility Trigger</span>
                      <span className="text-[11px] text-slate-400">
                        Dispatches immediately whenever a tracked material spot rate moves by ≥ {subscription.volatilityThresholdPercent}%.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Volatility Threshold Slider / Selector */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Minimum Price Movement Threshold:</span>
                  <select
                    value={subscription.volatilityThresholdPercent}
                    onChange={(e) => onUpdateSubscription({ volatilityThresholdPercent: Number(e.target.value) })}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>≥ 1.0% change</option>
                    <option value={1.5}>≥ 1.5% change</option>
                    <option value={2}>≥ 2.0% change</option>
                    <option value={3}>≥ 3.0% change</option>
                    <option value={5}>≥ 5.0% change</option>
                  </select>
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" />
                  Delivery Channels &amp; Destinations
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={subscription.channelInApp}
                      onChange={(e) => onUpdateSubscription({ channelInApp: e.target.checked })}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-medium text-white block">In-App Notification Banner &amp; Toasts</span>
                      <span className="text-[11px] text-slate-400">
                        Instant floating alert badge and notification drawer in MaterialsView.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={subscription.channelEmail}
                      onChange={(e) => onUpdateSubscription({ channelEmail: e.target.checked })}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-medium text-white block">Email Dispatch Digest</span>
                      <span className="text-[11px] text-slate-400">
                        Delivers clean markdown/HTML bulletin with rate charts and price drivers.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Email Address Input */}
                <form onSubmit={handleSaveEmail} className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">Recipient Email Address</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="e.g. architect@practice.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition"
                    >
                      Save
                    </button>
                  </div>
                  {emailSavedFeedback && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Email recipient updated!
                    </span>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: TRACKED MATERIALS SELECTION */}
          {activeSettingsTab === 'materials' && (
            <div className="space-y-3">
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTrackCoreEssentials}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition font-medium"
                  >
                    + Track Key Structural Commodities (Steel, Cement, Aggregates)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    Select All ({materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllTracked}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Grid of Materials with Checkboxes/Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {materials.map((mat) => {
                  const isTracked = subscription.subscribedMaterialIds.includes(mat.id);
                  const isUp = mat.trend === 'up';
                  const isDown = mat.trend === 'down';

                  return (
                    <div
                      key={mat.id}
                      onClick={() => onToggleMaterialTracked(mat.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                        isTracked
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isTracked
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'bg-slate-950 border-slate-700'
                          }`}
                        >
                          {isTracked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="truncate">
                          <span className="text-xs font-semibold text-white block truncate">
                            {mat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {mat.category} • ₹{mat.currentPrice.toLocaleString()}/{mat.unit}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold">
                        <span
                          className={`flex items-center gap-0.5 ${
                            isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                          {mat.changePercent > 0 ? `+${mat.changePercent}%` : `${mat.changePercent}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ALERT NOTIFICATION HISTORY */}
          {activeSettingsTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recent Price Change Notifications Generated</span>
                {recentAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllAlerts}
                    className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Alert History</span>
                  </button>
                )}
              </div>

              {recentAlerts.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <Bell className="w-6 h-6 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No price change alerts recorded yet. Click "Test Alert Digest" or wait for the next scheduled market update.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {recentAlerts.map((alert) => {
                    const isUp = alert.trend === 'up';
                    const isDown = alert.trend === 'down';

                    return (
                      <div
                        key={alert.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{alert.materialName}</span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                              {alert.category}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                                isUp
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                  : isDown
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                              {alert.changePercent > 0 ? `+${alert.changePercent}%` : `${alert.changePercent}%`}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 font-mono flex items-center gap-2">
                            <span>Old: ₹{alert.oldPrice.toLocaleString()}</span>
                            <span>→</span>
                            <span className="font-bold text-amber-300">New: ₹{alert.newPrice.toLocaleString()} / {alert.unit}</span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug">
                            {alert.trendReason}
                          </p>

                          <span className="text-[10px] text-slate-500 font-mono block">
                            Logged: {new Date(alert.timestamp).toLocaleTimeString()} • {new Date(alert.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDismissAlert(alert.id)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
