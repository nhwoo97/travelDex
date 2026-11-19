// Place categories shown in forms, filters and badges.
const CATEGORIES = [
  { key: "food", label: "Food & Drink", icon: "🍜" },
  { key: "nature", label: "Nature & Hikes", icon: "🌲" },
  { key: "beach", label: "Beach & Water", icon: "🏖️" },
  { key: "city", label: "City & Sights", icon: "🏙️" },
  { key: "culture", label: "Culture & History", icon: "🏛️" },
  { key: "stay", label: "Places to Stay", icon: "🏕️" },
  { key: "nightlife", label: "Nightlife", icon: "🎶" },
  { key: "other", label: "Other", icon: "📍" },
];
const CATEGORY_KEYS = CATEGORIES.map(category => category.key);
const categoryByKey = Object.fromEntries(CATEGORIES.map(category => [category.key, category]));
function getCategory(key) {
  return categoryByKey[key] || categoryByKey.other;
}
module.exports = { CATEGORIES, CATEGORY_KEYS, getCategory };
