const DEFAULT_CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80',
];

const DEFAULT_SUBCATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
];

const DEFAULT_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
];

export function normalizeImageUrl(value, fallback = '') {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) return fallback;

  if (/^(https?:\/\/|data:|blob:)/i.test(normalized)) {
    return normalized;
  }

  return fallback;
}

export function getDefaultCategoryImage(categoryId = 1) {
  const index = ((Number(categoryId) || 1) - 1) % DEFAULT_CATEGORY_IMAGES.length;
  return DEFAULT_CATEGORY_IMAGES[index];
}

export function getDefaultSubcategoryImage(subcategoryId = 1) {
  const index = ((Number(subcategoryId) || 1) - 1) % DEFAULT_SUBCATEGORY_IMAGES.length;
  return DEFAULT_SUBCATEGORY_IMAGES[index];
}

export function getDefaultProductImage(productOrCode = '') {
  const seedText = String(productOrCode ?? '');
  const total = seedText.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DEFAULT_PRODUCT_IMAGES[total % DEFAULT_PRODUCT_IMAGES.length];
}
