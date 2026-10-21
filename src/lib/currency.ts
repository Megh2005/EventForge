export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const POPULAR_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD (AU$) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF (CHF) - Swiss Franc' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'AED', symbol: 'AED', label: 'AED (AED) - UAE Dirham' },
  { code: 'BRL', symbol: 'R$', label: 'BRL (R$) - Brazilian Real' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR (R) - South African Rand' }
];

export function getCurrencySymbol(code: string): string {
  const match = POPULAR_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
  return match ? match.symbol : '$';
}

export function formatMoney(amount: number | string | undefined | null, symbol: string = '$'): string {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString()}`;
}
