import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Sliders,
  Check,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShieldAlert,
  Info,
  Clock,
  Activity,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { BOQItem, Project, LiveMaterialPrice } from '../types';
import { formatCurrency, CurrencyCode } from '../utils/formatters';
import { matchBOQItemToMarket } from '../utils/marketPriceEngine';

export interface BOQPriceFluctuationAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
  boqRate: number;
  boqAmount: number;
  liveMarketPrice: number;
  liveMarketOldPrice?: number;
  marketBrand?: string;
  rateVariance: number; // liveMarketPrice - boqRate
  percentVariance: number; // ((liveMarketPrice - boqRate) / (boqRate || 1)) * 100
  costImpact: number; // quantity * rateVariance
  trend: 'up' | 'down' | 'stable';
  trendReason?: string;
  thresholdExceeded: boolean;
  severity: 'critical' | 'warning' | 'info';
  marketSource: string;
  updatedAt: string;
  isDismissed?: boolean;
}

export interface PriceMonitorSettings {
  enabled: boolean;
  intervalSeconds: number;
  thresholdPercent: number; // e.g. 5%
  costThresholdAmount: number; // e.g. ₹10,000
  pushNotificationsEnabled: boolean;
  soundEnabled: boolean;
  alertDirection: 'surge_only' | 'all';
}

interface BOQRealTimePriceMonitorProps {
  items: BOQItem[];
  activeProject: Project;
  currency: CurrencyCode;
  onUpdateItemRate: (itemId: string, newRate: number) => void;
  onUpdateMultipleItemRates?: (updates: Array<{ id: string; newRate: number }>) => void;
  onAlertTriggered?: (alert: BOQPriceFluctuationAlert) => void;
}

/**
 * Web Audio API synthesizer for audible notification chime
 */
function playAudioChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone rising chime (F5 -> A5)
    osc.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (_e) {
    // Ignore audio autoplay restrictions
  }
}

export const BOQRealTimePriceMonitor: React.FC<BOQRealTimePriceMonitorProps> = ({
  items,
  activeProject,
  currency,
  onUpdateItemRate,
  onUpdateMultipleItemRates,
  onAlertTriggered,
}) => {
  // Settings with LocalStorage persistence
  const [settings, setSettings] = useState<PriceMonitorSettings>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_boq_price_monitor_settings');
      if (saved) {
        return {
          enabled: true,
          intervalSeconds: 45,
          thresholdPercent: 5,
          costThresholdAmount: 10000,
          pushNotificationsEnabled: false,
          soundEnabled: true,
          alertDirection: 'surge_only',
          ...JSON.parse(saved),
        };
      }
    } catch {}
    return {
      enabled: true,
      intervalSeconds: 45,
      thresholdPercent: 5,
      costThresholdAmount: 10000,
      pushNotificationsEnabled: false,
      soundEnabled: true,
      alertDirection: 'surge_only',
    };
  });

  useEffect(() => {
    localStorage.setItem('gouse_ai_boq_price_monitor_settings', JSON.stringify(settings));
  }, [settings]);

  // Push notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  // Live marketplace pricing state fetched from existing API
  const [liveMarketPrices, setLiveMarketPrices] = useState<LiveMaterialPrice[]>([]);
  const [marketRadarAlerts, setMarketRadarAlerts] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncCount, setSyncCount] = useState<number>(0);
  const [marketSummaryText, setMarketSummaryText] = useState<string>('');

  // UI Drawer / Details toggle states
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // Recent push notification log (for audit trail)
  const [notificationHistory, setNotificationHistory] = useState<Array<{ id: string; title: string; body: string; time: string }>>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Request Notification permission
  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setToastMessage({
        text: 'Browser notifications are not supported in this browser.',
        type: 'info',
      });
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        setSettings((prev) => ({ ...prev, pushNotificationsEnabled: true }));
        setToastMessage({
          text: '🔔 Browser push notifications enabled for price fluctuations!',
          type: 'success',
        });
        // Send a test notification
        new Notification('🔔 Gouse AI Price Monitor Active', {
          body: `Real-time price monitoring connected. Threshold alert set to ${settings.thresholdPercent}%.`,
          icon: '/favicon.ico',
        });
        playAudioChime();
      } else {
        setSettings((prev) => ({ ...prev, pushNotificationsEnabled: false }));
        setToastMessage({
          text: 'Notification permission denied in browser settings.',
          type: 'alert',
        });
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  /**
   * Primary API fetch function using existing marketplace endpoints:
   * 1. POST /api/materials/live-prices
   * 2. POST /api/materials/radar-alerts
   */
  const fetchMarketplacePrices = useCallback(async (isManualTrigger: boolean = false) => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const location = activeProject.location || 'Bangalore / South India';
      const res = await fetch('/api/materials/live-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          category: 'all',
          customQuery: 'cement steel concrete sand aggregates bricks blocks tiles paint',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prices) && data.prices.length > 0) {
          setLiveMarketPrices(data.prices);
          if (data.marketSummary) {
            setMarketSummaryText(data.marketSummary);
          }
        }
      }

      // Query wholesale radar alerts from marketplace endpoint
      try {
        const radarRes = await fetch('/api/materials/radar-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectData: {
              builtUpAreaSqFt: activeProject.builtUpAreaSqFt || 3000,
              location,
              floors: activeProject.floorsCount || 3,
            },
          }),
        });
        if (radarRes.ok) {
          const radarData = await radarRes.json();
          if (Array.isArray(radarData.alerts) && radarData.alerts.length > 0) {
            setMarketRadarAlerts(radarData.alerts);
          }
        }
      } catch (_e) {}

      setLastSyncTime(new Date());
      setSyncCount((prev) => prev + 1);

      if (isManualTrigger) {
        setToastMessage({
          text: `⚡ Synced with live marketplace API (${location}). Rates updated.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.warn('Notice from marketplace API, falling back to local spot benchmarks:', err);
    } finally {
      setIsFetching(false);
    }
  }, [activeProject.location, isFetching]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMarketplacePrices();
  }, [fetchMarketplacePrices]);

  // Periodic polling interval when enabled
  useEffect(() => {
    if (!settings.enabled) return;

    const intervalMs = Math.max(15, settings.intervalSeconds) * 1000;
    const timer = setInterval(() => {
      fetchMarketplacePrices();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.enabled, settings.intervalSeconds, fetchMarketplacePrices]);

  /**
   * Helper: Match any BOQ Item against the Live Marketplace Prices or Regional Grounding
   */
  const matchItemToMarketplace = useCallback(
    (item: BOQItem): {
      livePrice: number;
      oldPrice?: number;
      brand?: string;
      source: string;
      trend: 'up' | 'down' | 'stable';
      trendReason?: string;
    } => {
      const normName = item.name.toLowerCase();
      const normCat = item.category.toLowerCase();

      // 1. Check liveMarketPrices from API
      if (liveMarketPrices && liveMarketPrices.length > 0) {
        // Direct keyword matching against live prices
        for (const live of liveMarketPrices) {
          const liveName = live.name.toLowerCase();
          const liveCat = live.category.toLowerCase();

          // Cement matching
          if (
            (normName.includes('cement') || normCat.includes('cement')) &&
            (liveName.includes('cement') || liveCat.includes('cement'))
          ) {
            return {
              livePrice: live.currentPrice,
              oldPrice: live.minPrice,
              brand: live.brands?.[0] || 'JSW / UltraTech / ACC',
              source: `Live Marketplace API (${live.location || 'Regional Spot'})`,
              trend: live.trend || 'up',
              trendReason: live.trendReason || 'High infrastructure dispatch & slag logistics',
            };
          }

          // Steel matching
          if (
            (normName.includes('steel') || normName.includes('tmt') || normName.includes('rebar') || normCat.includes('steel')) &&
            (liveName.includes('steel') || liveName.includes('tmt') || liveName.includes('rebar') || liveCat.includes('steel'))
          ) {
            // Check unit: MT vs kg
            let adjustedPrice = live.currentPrice;
            if (item.unit.toLowerCase() === 'kg' && adjustedPrice > 1000) {
              adjustedPrice = Math.round(adjustedPrice / 1000);
            } else if (item.unit.toLowerCase() === 'mt' && adjustedPrice < 1000) {
              adjustedPrice = Math.round(adjustedPrice * 1000);
            }
            return {
              livePrice: adjustedPrice,
              oldPrice: live.minPrice,
              brand: live.brands?.[0] || 'A-One Gold / Tata Tiscon',
              source: `Live Marketplace API (${live.location || 'Regional Mill'})`,
              trend: live.trend || 'down',
              trendReason: live.trendReason || 'Spot mandi value pricing window',
            };
          }

          // Concrete / RMC matching
          if (
            (normName.includes('concrete') || normName.includes('rmc') || normCat.includes('concrete')) &&
            (liveName.includes('concrete') || liveName.includes('rmc'))
          ) {
            return {
              livePrice: live.currentPrice,
              oldPrice: live.minPrice,
              brand: live.brands?.[0] || 'RMC Readymix M25',
              source: `Live Marketplace API (${live.location || 'Batching Plant'})`,
              trend: live.trend || 'stable',
              trendReason: live.trendReason || 'Standard batching plant spot tariff',
            };
          }

          // Sand / Aggregate matching
          if (
            (normName.includes('sand') || normName.includes('aggregate') || normCat.includes('sand')) &&
            (liveName.includes('sand') || liveName.includes('aggregate'))
          ) {
            return {
              livePrice: live.currentPrice,
              oldPrice: live.minPrice,
              brand: live.brands?.[0] || 'Zone II M-Sand',
              source: `Live Marketplace API (${live.location || 'Quarry Spot'})`,
              trend: live.trend || 'stable',
              trendReason: live.trendReason || 'Quarry processing & haulage tariff',
            };
          }

          // Bricks / Blocks
          if (
            (normName.includes('brick') || normName.includes('block') || normCat.includes('masonry')) &&
            (liveName.includes('brick') || liveName.includes('block'))
          ) {
            return {
              livePrice: live.currentPrice,
              oldPrice: live.minPrice,
              brand: live.brands?.[0] || 'Wire-Cut / AAC',
              source: `Live Marketplace API (${live.location || 'Kiln Direct'})`,
              trend: live.trend || 'stable',
              trendReason: live.trendReason || 'Kiln coal & transport tariff',
            };
          }
        }
      }

      // 2. Fallback to calibrated regional spot engine
      const fallback = matchBOQItemToMarket(item, 'bangalore', 'Standard', 'spot_market');
      const isUp = fallback.rateDelta > 0;
      return {
        livePrice: fallback.marketRate,
        oldPrice: Math.round(fallback.marketRate * 0.95),
        brand: fallback.matchedBenchmark.name.split(' ')[0] || 'Standard Benchmark',
        source: fallback.sourceCitation,
        trend: isUp ? 'up' : 'stable',
        trendReason: 'Market index adjustment based on seasonal demand.',
      };
    },
    [liveMarketPrices]
  );

  /**
   * Compute comprehensive Fluctuation Alerts across all BOQ Items
   */
  const computedAlerts = useMemo<BOQPriceFluctuationAlert[]>(() => {
    const alerts: BOQPriceFluctuationAlert[] = [];

    items.forEach((item) => {
      const market = matchItemToMarketplace(item);
      const boqRate = Number(item.rate) || 0;
      const livePrice = Number(market.livePrice) || 0;
      const qty = Number(item.quantity) || 1;

      // Rate variance: market minus current BOQ
      const rateVariance = livePrice - boqRate;
      const percentVariance = boqRate > 0 ? Number(((rateVariance / boqRate) * 100).toFixed(1)) : 100;
      const costImpact = Math.round(qty * rateVariance);

      // Threshold check based on settings
      let thresholdExceeded = false;
      if (settings.alertDirection === 'surge_only') {
        thresholdExceeded =
          (percentVariance >= settings.thresholdPercent || costImpact >= settings.costThresholdAmount) &&
          rateVariance > 0;
      } else {
        thresholdExceeded =
          Math.abs(percentVariance) >= settings.thresholdPercent || Math.abs(costImpact) >= settings.costThresholdAmount;
      }

      const severity: 'critical' | 'warning' | 'info' =
        percentVariance >= 10 || costImpact >= 25000
          ? 'critical'
          : percentVariance >= 5 || costImpact >= 10000
          ? 'warning'
          : 'info';

      alerts.push({
        id: `alert-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
        quantity: qty,
        boqRate,
        boqAmount: qty * boqRate,
        liveMarketPrice: livePrice,
        liveMarketOldPrice: market.oldPrice,
        marketBrand: market.brand,
        rateVariance,
        percentVariance,
        costImpact,
        trend: market.trend,
        trendReason: market.trendReason,
        thresholdExceeded,
        severity,
        marketSource: market.source,
        updatedAt: lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isDismissed: dismissedAlertIds.has(item.id),
      });
    });

    return alerts;
  }, [items, matchItemToMarketplace, settings, lastSyncTime, dismissedAlertIds]);

  // Active (non-dismissed) alerts exceeding threshold
  const activeExceededAlerts = useMemo(() => {
    return computedAlerts.filter((a) => a.thresholdExceeded && !a.isDismissed);
  }, [computedAlerts]);

  // Summary statistics
  const totalCostEscalationExposure = useMemo(() => {
    return activeExceededAlerts.reduce((sum, a) => (a.costImpact > 0 ? sum + a.costImpact : sum), 0);
  }, [activeExceededAlerts]);

  const initialScanDoneRef = useRef<boolean>(false);
  const prevActiveCountRef = useRef<number>(0);

  // Send push notification function (Native Browser Notification + Visual In-App Toast + Audio Chime + History)
  const sendNotificationAlert = useCallback(
    (title: string, body: string, alert?: BOQPriceFluctuationAlert) => {
      // 1. Play audio chime
      if (settings.soundEnabled) {
        playAudioChime();
      }

      // 2. Native browser push notification
      if (
        settings.pushNotificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: `price-alert-${Date.now()}`,
          });
        } catch (_e) {}
      }

      // 3. Visual in-app toast notification banner
      setToastMessage({
        text: `${title}: ${body}`,
        type: 'alert',
      });

      // 4. In-app history audit log
      setNotificationHistory((prev) => [
        {
          id: `push-${Date.now()}`,
          title,
          body,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);

      if (alert && onAlertTriggered) {
        onAlertTriggered(alert);
      }
    },
    [settings.soundEnabled, settings.pushNotificationsEnabled, onAlertTriggered]
  );

  // Trigger push notifications & sound when new threshold-exceeded alerts are detected
  useEffect(() => {
    const currentCount = activeExceededAlerts.length;

    if (!initialScanDoneRef.current) {
      initialScanDoneRef.current = true;
      prevActiveCountRef.current = currentCount;
      if (currentCount > 0 && settings.pushNotificationsEnabled) {
        const topAlert = activeExceededAlerts[0];
        const title = `🚨 Gouse AI Material Price Alert (${currentCount} Items)`;
        const body = `${topAlert.itemName} deviates by ${topAlert.percentVariance > 0 ? `+${topAlert.percentVariance}%` : `${topAlert.percentVariance}%`} (Market: ₹${topAlert.liveMarketPrice.toLocaleString()} vs BOQ: ₹${topAlert.boqRate.toLocaleString()}). Total budget exposure: +₹${totalCostEscalationExposure.toLocaleString()}.`;
        sendNotificationAlert(title, body, topAlert);
      }
      return;
    }

    // Detect if new items crossed threshold
    if (currentCount > prevActiveCountRef.current || (currentCount > 0 && prevActiveCountRef.current === 0)) {
      const topAlert = activeExceededAlerts[0];
      const title = `🚨 Gouse AI Material Price Alert (${currentCount} Items)`;
      const body = `${topAlert.itemName} surged by ${topAlert.percentVariance > 0 ? `+${topAlert.percentVariance}%` : `${topAlert.percentVariance}%`} (Now ₹${topAlert.liveMarketPrice.toLocaleString()}). Total budget exposure: +₹${totalCostEscalationExposure.toLocaleString()}.`;
      sendNotificationAlert(title, body, topAlert);
    }

    prevActiveCountRef.current = currentCount;
  }, [activeExceededAlerts, settings.pushNotificationsEnabled, totalCostEscalationExposure, sendNotificationAlert]);

  // Test Notification Trigger
  const handleTriggerTestNotification = () => {
    const sample = activeExceededAlerts[0] || computedAlerts[0] || {
      itemName: 'JSW Cement Concreel HD / Rebar Fe550D',
      percentVariance: 7.2,
      liveMarketPrice: 385,
      costImpact: 14700,
    };
    const title = '🔔 Test Material Price Alert';
    const body = `${sample.itemName} threshold breached (+${sample.percentVariance}%). Live spot: ₹${sample.liveMarketPrice.toLocaleString()}. Budget exposure: ₹${(sample.costImpact || 12500).toLocaleString()}.`;
    sendNotificationAlert(title, body, activeExceededAlerts[0]);
  };

  // Single Item Rate Update
  const handleApplySingleRate = (alert: BOQPriceFluctuationAlert) => {
    onUpdateItemRate(alert.itemId, alert.liveMarketPrice);
    setToastMessage({
      text: `Updated "${alert.itemName}" rate to live marketplace price: ₹${alert.liveMarketPrice.toLocaleString()} / ${alert.unit}`,
      type: 'success',
    });
  };

  // 1-Click Update All Exceeded Items to Live Marketplace Price
  const handleApplyAllExceededRates = () => {
    if (activeExceededAlerts.length === 0) return;

    if (onUpdateMultipleItemRates) {
      const updates = activeExceededAlerts.map((a) => ({
        id: a.itemId,
        newRate: a.liveMarketPrice,
      }));
      onUpdateMultipleItemRates(updates);
    } else {
      activeExceededAlerts.forEach((a) => {
        onUpdateItemRate(a.itemId, a.liveMarketPrice);
      });
    }

    setToastMessage({
      text: `⚡ Successfully updated ${activeExceededAlerts.length} items to current live market rates!`,
      type: 'success',
    });
  };

  // Dismiss a single alert card
  const handleDismissAlert = (itemId: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, itemId]));
  };

  // Reset all dismissed alerts
  const handleRestoreDismissed = () => {
    setDismissedAlertIds(new Set());
  };

  return (
    <div
      id="boq-realtime-price-monitor"
      className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg"
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-2.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-between gap-2 shadow-md animate-in fade-in slide-in-from-top-1 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'alert'
              ? 'bg-red-950/90 border border-red-500/50 text-red-200'
              : 'bg-amber-950/90 border border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Price Monitoring Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition ${
              activeExceededAlerts.length > 0
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : settings.enabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>Real-Time Marketplace Price Monitor</span>
                {settings.enabled ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE POLLING ON ({settings.intervalSeconds}s)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                    PAUSED
                  </span>
                )}
              </span>

              {/* Threshold indicator pill */}
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                Threshold: ±{settings.thresholdPercent}%
              </span>

              {/* Push notifications status pill */}
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border transition ${
                  notificationPermission === 'granted' && settings.pushNotificationsEnabled
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Click to toggle browser push notification permissions"
              >
                {notificationPermission === 'granted' && settings.pushNotificationsEnabled ? (
                  <>
                    <BellRing className="w-3 h-3 text-sky-400" />
                    <span>Push Alerts: ON</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3 h-3 text-slate-500" />
                    <span>Enable Push</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Tracking live commodity indices via Google Grounding & regional mandis. Exceeding threshold triggers desktop push & visual warnings.
            </p>
          </div>
        </div>

        {/* Quick Actions & Metrics */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Total Budget Escalation Warning */}
          {totalCostEscalationExposure > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Budget Exposure: +{currency} {totalCostEscalationExposure.toLocaleString()}</span>
            </div>
          )}

          {/* Alert count trigger button */}
          <button
            type="button"
            id="btn-toggle-boq-alerts-drawer"
            onClick={() => setIsAlertsDrawerOpen(!isAlertsDrawerOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm ${
              activeExceededAlerts.length > 0
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {activeExceededAlerts.length > 0
                ? `🚨 ${activeExceededAlerts.length} Exceeded Alerts`
                : 'All Rates Within Threshold'}
            </span>
            {isAlertsDrawerOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Sync Button */}
          <button
            type="button"
            id="btn-sync-marketplace-rates"
            disabled={isFetching}
            onClick={() => fetchMarketplacePrices(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Poll existing marketplace API right now"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Polling API...' : 'Sync Market'}</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            type="button"
            id="btn-open-price-monitor-settings"
            onClick={() => setIsSettingsModalOpen(!isSettingsModalOpen)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Configure Price Fluctuation Alert Thresholds & Notification Rules"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Visual Alerts Drawer */}
      {isAlertsDrawerOpen && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase text-amber-300">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Visual Cost Fluctuation Alerts ({activeExceededAlerts.length} Flagged / {computedAlerts.length} Tracked)
              </span>
            </span>

            <div className="flex items-center gap-2">
              {activeExceededAlerts.length > 0 && (
                <button
                  type="button"
                  id="btn-apply-all-exceeded-rates"
                  onClick={handleApplyAllExceededRates}
                  className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
                  title="Auto-update current BOQ rates to live market rates for all alerted items"
                >
                  <Zap className="w-3 h-3 fill-slate-950" />
                  <span>Update All to Live Market Rates</span>
                </button>
              )}

              <button
                type="button"
                id="btn-trigger-test-push"
                onClick={handleTriggerTestNotification}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 text-xs font-mono font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
                title="Send a sample push notification and play chime"
              >
                <BellRing className="w-3 h-3 text-sky-400" />
                <span>Test Alert</span>
              </button>

              {dismissedAlertIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDismissed}
                  className="text-[10px] text-slate-400 hover:text-white underline font-mono"
                >
                  Restore Dismissed ({dismissedAlertIds.size})
                </button>
              )}
            </div>
          </div>

          {activeExceededAlerts.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  All BOQ items are currently within your defined ±{settings.thresholdPercent}% price fluctuation threshold.
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Last Checked: {lastSyncTime.toLocaleTimeString()}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeExceededAlerts.map((alert) => {
                const isSurge = alert.rateVariance > 0;
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 shadow-sm ${
                      alert.severity === 'critical'
                        ? 'bg-red-950/40 border-red-500/50 hover:border-red-400'
                        : 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="pr-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            {alert.category}
                          </span>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{alert.itemName}</h4>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-0.5 ${
                            isSurge
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isSurge ? <TrendingUp className="w-2.5 h-2.5 text-red-400" /> : <TrendingDown className="w-2.5 h-2.5 text-emerald-400" />}
                          <span>{alert.percentVariance > 0 ? `+${alert.percentVariance}%` : `${alert.percentVariance}%`}</span>
                        </span>
                      </div>

                      {/* Pricing Comparison Stats */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Current BOQ Rate</div>
                          <div className="text-slate-200 font-bold">
                            ₹{alert.boqRate.toLocaleString()} <span className="text-[9px] text-slate-500">/{alert.unit}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-amber-400 uppercase">Live Market Spot</div>
                          <div className="text-amber-300 font-bold">
                            ₹{alert.liveMarketPrice.toLocaleString()} <span className="text-[9px] text-slate-500">/{alert.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cost Impact Breakdown */}
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Total Budget Impact:</span>
                        <span className={`font-bold ${isSurge ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isSurge ? `+${currency} ${alert.costImpact.toLocaleString()}` : `-${currency} ${Math.abs(alert.costImpact).toLocaleString()}`}
                        </span>
                      </div>

                      {alert.trendReason && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                          "{alert.trendReason}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleDismissAlert(alert.itemId)}
                        className="text-[10px] font-mono text-slate-400 hover:text-white transition p-1"
                        title="Dismiss this visual alert"
                      >
                        Dismiss
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplySingleRate(alert)}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
                        title={`Update this line item rate to ₹${alert.liveMarketPrice.toLocaleString()}`}
                      >
                        <Zap className="w-3 h-3 fill-slate-950" />
                        <span>Apply Rate (₹{alert.liveMarketPrice.toLocaleString()})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings Modal (Threshold & Notification Rules) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-serif-classic">
                  Real-Time Price Monitor Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Enable / Disable Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-white font-semibold">Active Price Monitoring</div>
                  <div className="text-slate-400 text-[11px]">Continuously poll marketplace API in background</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.enabled ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      settings.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Threshold Percentage Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Price Fluctuation Threshold (%):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 8, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, thresholdPercent: pct }))}
                      className={`py-1.5 rounded text-xs font-mono font-bold transition border ${
                        settings.thresholdPercent === pct
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      ±{pct}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Alert triggers when live market rate deviates from current BOQ rate by this percentage.
                </p>
              </div>

              {/* Cost Threshold Amount */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Budget Escalation Exposure Threshold (₹):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, costThresholdAmount: amt }))}
                      className={`py-1.5 rounded text-xs font-mono font-bold transition border ${
                        settings.costThresholdAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction: Surge vs All */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alert Trigger Rule:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, alertDirection: 'surge_only' }))}
                    className={`p-2 rounded text-xs font-mono font-semibold transition border text-left ${
                      settings.alertDirection === 'surge_only'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div>🔺 Surges Only</div>
                    <div className="text-[10px] text-slate-400 font-normal">Costs exceeding current budget</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, alertDirection: 'all' }))}
                    className={`p-2 rounded text-xs font-mono font-semibold transition border text-left ${
                      settings.alertDirection === 'all'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div>📊 All Fluctuations</div>
                    <div className="text-[10px] text-slate-400 font-normal">Both price drops & price hikes</div>
                  </button>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-400" />
                    <span>Browser Push Notifications</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestNotificationPermission}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      settings.pushNotificationsEnabled ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {settings.pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Audio Chime on Threshold Breach</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      settings.soundEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {settings.soundEnabled ? 'Enabled' : 'Muted'}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-settings-test-notification"
                    onClick={handleTriggerTestNotification}
                    className="w-full py-2 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold transition flex items-center justify-center gap-2"
                  >
                    <BellRing className="w-3.5 h-3.5 text-sky-400" />
                    <span>Send Test Push Notification Now</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
