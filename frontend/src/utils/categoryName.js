const CATEGORY_MAPPING = { J: 'Junior', H: 'Men', D: 'Women', S: 'Senior' };

export function getCategoryName(code) {
  return CATEGORY_MAPPING[code] || code || 'Player';
}
