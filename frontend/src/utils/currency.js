export const INR_TO_USD_RATE = 0.012;

export const convertRupeesToDollars = (inr, rate = INR_TO_USD_RATE) => {
  const amount = Number(inr) || 0;
  return Math.round(amount * rate * 100) / 100;
};

export const formatUsd = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatUsdFromInr = (inr, rate = INR_TO_USD_RATE) => formatUsd(convertRupeesToDollars(inr, rate));
