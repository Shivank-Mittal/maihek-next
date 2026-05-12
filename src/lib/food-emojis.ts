export const ADDON_EMOJI: Record<string, string> = {
  "addon-chicken": "🍗",
  "addon-lamb": "🥩",
  "addon-shrimp": "🦐",
  "addon-paneer": "🧀",
  "addon-extra-chicken": "🍗",
  "addon-extra-lamb": "🥩",
  "addon-extra-shrimp": "🦐",
  "addon-extra-sauce": "🥣",
  "addon-extra-gravy": "🍲",
  "addon-potatoes": "🥔",
  "addon-peas": "🫛",
  "addon-mixed-veg": "🥦",
  "addon-extra-garlic": "🧄",
  "addon-coriander": "🌿",
  "addon-ginger": "🫚",
  "addon-lemon": "🍋",
  "addon-onions": "🧅",
  "addon-pickles": "🥒",
  "addon-raita": "🥛",
  "addon-fresh-cream": "🍦",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  entrées: "🥗",
  entrees: "🥗",
  starters: "🥗",
  curry: "🍛",
  curries: "🍛",
  tandoori: "🔥",
  biryani: "🍚",
  "riz basmati": "🍚",
  rice: "🍚",
  riz: "🍚",
  pains: "🫓",
  pain: "🫓",
  breads: "🫓",
  bread: "🫓",
  "side dishes": "🥘",
  desserts: "🍮",
  dessert: "🍮",
  boissons: "🥤",
  drinks: "🥤",
  beverages: "🥤",
  soupes: "🍜",
  soups: "🍜",
  "add-ons": "✨",
};

export const getCategoryEmoji = (categoryName: string): string =>
  CATEGORY_EMOJI[categoryName.toLowerCase().trim()] ?? "🍽️";

export const getItemEmoji = (id: string, category?: string): string =>
  ADDON_EMOJI[id] ?? getCategoryEmoji(category ?? "");
