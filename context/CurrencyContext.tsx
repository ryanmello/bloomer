"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser } from "./AuthContext";

interface ExchangeRates {
  [currency: string]: number; // example: { "EUR": 0.85, "GBP": 0.73 }
}

interface CurrencyContextType {
  selectedCurrency: string;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  convertPrice: (usdPrice: number) => number;
  formatPrice: (usdPrice: number) => string;
  refreshRates: () => Promise<void>;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { user } = useUser();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Update selected currency when user changes
  useEffect(() => {
    if (user?.defaultCurrency && SUPPORTED_CURRENCIES.includes(user.defaultCurrency)) {
      setSelectedCurrency(user.defaultCurrency);
    }
  }, [user?.defaultCurrency]);

  const fetchExchangeRates = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/exchange-rates");
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.status}`);
      }

      const data = await response.json();
      const rates: ExchangeRates = {};

      // Only include supported currencies
      SUPPORTED_CURRENCIES.forEach(currency => {
        if (currency === "USD") {
          rates[currency] = 1;
        } else if (data.rates[currency]) {
          rates[currency] = data.rates[currency];
        }
      });

      setExchangeRates(rates);
      setLastFetchTime(Date.now());

      // Store in localStorage as fallback
      localStorage.setItem("exchangeRates", JSON.stringify(rates));
      localStorage.setItem("exchangeRatesTimestamp", Date.now().toString());

      console.log("Exchange rates loaded successfully:", rates);

    } catch (err) {
      console.error("Error fetching exchange rates:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch exchange rates");

      // Try to load from localStorage as fallback
      const storedRates = localStorage.getItem("exchangeRates");
      const storedTimestamp = localStorage.getItem("exchangeRatesTimestamp");

      if (storedRates && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const hoursSinceLastFetch = (Date.now() - timestamp) / (1000 * 60 * 60);

        // Use stored rates if less than 24 hours old
        if (hoursSinceLastFetch < 24) {
          setExchangeRates(JSON.parse(storedRates));
          setError(null); // Clear error since we have fallback
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRates = async (): Promise<void> => {
    await fetchExchangeRates();
  };

  const setCurrency = (currency: string): void => {
    if (SUPPORTED_CURRENCIES.includes(currency)) {
      setSelectedCurrency(currency);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchExchangeRates();

    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const convertPrice = (usdPrice: number): number => {
    if (!exchangeRates) {
      console.warn("Exchange rates not loaded yet, using USD fallback");
      return usdPrice;
    }

    if (selectedCurrency === "USD") {
      return usdPrice;
    }

    const rate = exchangeRates[selectedCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${selectedCurrency}, using USD`);
      return usdPrice;
    }

    const converted = usdPrice * rate;
    console.log(`Converting $${usdPrice} USD to ${selectedCurrency}: ${usdPrice} * ${rate} = ${converted}`);
    return converted;
  };

  const formatPrice = (usdPrice: number): string => {
    const convertedPrice = convertPrice(usdPrice);

    // Format with currency symbol and 2 decimal places
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(convertedPrice);
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    exchangeRates,
    isLoading,
    error,
    convertPrice,
    formatPrice,
    refreshRates,
    setCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}