import Settings from '../models/Settings.js';

// Currency conversion rates (relative to INR)
const CURRENCY_RATES = {
    'INR': 1,
    'USD': 0.012,
    'EUR': 0.011,
    'GBP': 0.0096,
    'AED': 0.044,
    'SAR': 0.045,
    'PKR': 3.0,
    'BDT': 1.3,
    'KWD': 0.0037
};

const CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'SAR': '﷼',
    'PKR': '₨',
    'BDT': '৳',
    'KWD': 'KWD'
};

const convertKwdToINR = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    // 1 INR = 0.0037 KWD, so KWD to INR uses reciprocal rate.
    return Number((numeric / CURRENCY_RATES['KWD']).toFixed(2));
};

const COUNTRIES = {
    'India': { currency: 'INR', symbol: '₹' },
    'United States': { currency: 'USD', symbol: '$' },
    'United Kingdom': { currency: 'GBP', symbol: '£' },
    'United Arab Emirates': { currency: 'AED', symbol: 'د.إ' },
    'Saudi Arabia': { currency: 'SAR', symbol: '﷼' },
    'Pakistan': { currency: 'PKR', symbol: '₨' },
    'Bangladesh': { currency: 'BDT', symbol: '৳' },
    'Germany': { currency: 'EUR', symbol: '€' },
    'Kuwait': { currency: 'KWD', symbol: 'KWD' }
};

export const getCurrentCurrencySettings = async () => {
    try {
        const [countrySetting, currencySetting, symbolSetting, shippingKwdSetting, shippingInrSetting, oldShippingSetting, showKwdNavbarOptionSetting, showNewArrivalsNavbarSetting] = await Promise.all([
            Settings.findOne({ key: 'country' }),
            Settings.findOne({ key: 'currency' }),
            Settings.findOne({ key: 'currencySymbol' }),
            Settings.findOne({ key: 'shippingPriceKWD' }),
            Settings.findOne({ key: 'shippingPriceINR' }),
            Settings.findOne({ key: 'shippingPrice' }),
            Settings.findOne({ key: 'showKwdNavbarOption' }),
            Settings.findOne({ key: 'showNewArrivalsNavbar' })
        ]);

        const country = countrySetting?.value || 'India';
        const currency = currencySetting?.value || 'INR';
        const symbol = symbolSetting?.value || '₹';
        const shippingPriceKWD = shippingKwdSetting?.value !== undefined ? Number(shippingKwdSetting.value) : (oldShippingSetting?.value !== undefined ? Number(oldShippingSetting.value) : 5);
        const shippingPriceINR = shippingInrSetting?.value !== undefined ? Number(shippingInrSetting.value) : convertKwdToINR(shippingPriceKWD);
        const shippingPrice = currency === 'KWD' ? shippingPriceKWD : shippingPriceINR;
        const showKwdNavbarOption = showKwdNavbarOptionSetting?.value !== undefined ? Boolean(showKwdNavbarOptionSetting.value) : false;
        const showNewArrivalsNavbar = showNewArrivalsNavbarSetting?.value !== undefined ? Boolean(showNewArrivalsNavbarSetting.value) : false;

        return { country, currency, symbol, shippingPrice, shippingPriceKWD, shippingPriceINR, showKwdNavbarOption, showNewArrivalsNavbar };
    } catch (error) {
        console.error('Error getting currency settings:', error);
        return { country: 'India', currency: 'INR', symbol: '₹', shippingPrice: 5, showKwdNavbarOption: false, showNewArrivalsNavbar: false };
    }
};

export const convertPrice = (priceInINR, targetCurrency = null) => {
    if (!targetCurrency) {
        return { price: priceInINR, currency: 'INR', symbol: '₹' };
    }

    const rate = CURRENCY_RATES[targetCurrency] || 1;
    const decimals = targetCurrency === 'KWD' ? 3 : 2;
    const convertedPrice = Number((priceInINR * rate).toFixed(decimals));

    return {
        price: convertedPrice,
        currency: targetCurrency,
        symbol: CURRENCY_SYMBOLS[targetCurrency] || targetCurrency
    };
};

export const formatPrice = (price, currency = 'INR', symbol = '₹') => {
    const options = currency === 'KWD'
        ? { minimumFractionDigits: 3, maximumFractionDigits: 3 }
        : {};
    return `${symbol}${Number(price).toLocaleString(undefined, options)}`;
};

export { COUNTRIES, CURRENCY_RATES, CURRENCY_SYMBOLS };