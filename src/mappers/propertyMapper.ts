import { Property } from '@/types/property';

export function propertyMapper(raw: any): Property {
  // 1. Extract images from property_images (joined table)
  const imgs = (raw.property_images || []) as any[];
  let images = imgs.map(img => img.url || img.image_url || img.path || img.src).filter(Boolean);

  // 2. Fallback to 'images' array column if joined table is empty
  if (images.length === 0 && raw.images && Array.isArray(raw.images)) {
    images = raw.images;
  }

  // 3. Determine cover image
  const cover_image = raw.cover_image || images[0] || null;

  const location = [raw.province, raw.city, raw.neighborhood].filter(Boolean).join(', ');

  const mapped: Property = {
    ...raw,
    id: raw.id,
    cover_image: cover_image,
    images: images,
    location: location,
  } as Property;

  return mapped;
}
