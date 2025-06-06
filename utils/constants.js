// types of plans
export const PLANS = {
  FREE: "FREE",
  ESSENTIAL: "ESSENTIAL",
  EXPAND: "EXPAND",
  ELITE: "ELITE",
};
// status types
export const STATUS = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  IN_PROGRESS: "IN_PROGRESS",
};

// plans rate
export const PLANS_RATE = {
  FREE: 0,
  ESSENTIAL: 499,
  EXPAND: 1999,
  ELITE: 5499,
};

// agents per plan
export const AGENT_PER_PLAN = {
  ESSENTIAL: 2,
  EXPAND: 3,
  ELITE: 5,
  FREE: 1,
};

// links per plan
export const LINKS_PER_PLAN = {
  ESSENTIAL: 1,
  EXPAND: 3,
  ELITE: 8,
};

// PLAN hierarchy
export const PLAN_HIERARCHY = {
  ESSENTIAL: 1,
  EXPAND: 2,
  ELITE: 3,
};

// Countries list 
export const countryCodes = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PH', name: 'Philippines' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' },
  { code: 'TH', name: 'Thailand' },
  { code: 'KE', name: 'Kenya' },
  { code: 'PL', name: 'Poland' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'VN', name: 'Vietnam' }
];
