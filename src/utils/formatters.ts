export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rateFromINR: number; locale: string }> = {
  INR: { symbol: '₹', rateFromINR: 1, locale: 'en-IN' },
  USD: { symbol: '$', rateFromINR: 0.012, locale: 'en-US' },
  EUR: { symbol: '€', rateFromINR: 0.011, locale: 'de-DE' },
  GBP: { symbol: '£', rateFromINR: 0.0095, locale: 'en-GB' },
  AED: { symbol: 'AED ', rateFromINR: 0.044, locale: 'en-AE' },
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const config = CURRENCY_RATES[currency] || CURRENCY_RATES.INR;
  const converted = amount * config.rateFromINR;

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(converted);
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency === 'AED' ? 'AED' : currency,
    maximumFractionDigits: 0,
  }).format(converted);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
