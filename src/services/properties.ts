/**
 * Properties Service
 * Queries reais para o Supabase
 * Schema: properties table
 */

import { supabase } from '@/services/supabase';
import { Property, Location, SearchFilters } from '@/types/property';

/**
 * Obter propriedades em destaque (featured)
 */
export async function getFeaturedProperties(limit: number = 6, userId?: string): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('is_available', true)
      .order('views_count', { ascending: false })
      .limit(limit);

    // RLS-aware: public users only approved; owners see their own unapproved
    if (userId && require('@/utils/validation').isValidUUID(userId)) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Supabase data (featured):', data);
      console.log('Supabase error (featured):', error);
    }

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));

    if (error) {
      console.error('Error fetching featured properties:', error);
      return [];
    }

    return processed || [];
  } catch (error) {
    console.error('Exception in getFeaturedProperties:', error);
    return [];
  }
}

/**
 * Obter propriedades mais recentes
 */
export async function getLatestProperties(limit: number = 8, userId?: string): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId && require('@/utils/validation').isValidUUID(userId)) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Supabase data (latest):', data);
      console.log('Supabase error (latest):', error);
    }

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));

    if (error) {
      console.error('Error fetching latest properties:', error);
      return [];
    }

    return processed || [];
  } catch (error) {
    console.error('Exception in getLatestProperties:', error);
    return [];
  }
}

/**
 * Obter propriedades por tipo
 */
export async function getPropertiesByType(
  type: string,
  limit: number = 10,
  userId?: string
): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('property_type', type)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId && require('@/utils/validation').isValidUUID(userId)) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    console.log('Supabase data:', data);
    console.log('Supabase error:', error);

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));

    if (error) {
      console.error(`Error fetching properties by type ${type}:`, error);
      return [];
    }

    return processed || [];
  } catch (error) {
    console.error(`Exception in getPropertiesByType:`, error);
    return [];
  }
}

/**
 * Obter propriedades por cidade
 */
export async function getPropertiesByCity(
  city: string,
  limit: number = 10,
  userId?: string
): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('city', city)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    console.log('Supabase data:', data);
    console.log('Supabase error:', error);

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));

    if (error) {
      console.error(`Error fetching properties in city ${city}:`, error);
      return [];
    }

    return processed || [];
  } catch (error) {
    console.error(`Exception in getPropertiesByCity:`, error);
    return [];
  }
}

/**
 * Obter propriedades por província
 */
export async function getPropertiesByProvince(
  province: string,
  limit: number = 10,
  userId?: string
): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('province', province)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    console.log('Supabase data:', data);
    console.log('Supabase error:', error);

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));

    if (error) {
      console.error(`Error fetching properties in province ${province}:`, error);
      return [];
    }

    return processed || [];
  } catch (error) {
    console.error(`Exception in getPropertiesByProvince:`, error);
    return [];
  }
}

/**
 * Obter uma propriedade por ID
 */
export async function getPropertyById(id: string, userId?: string): Promise<Property | null> {
  try {
    let queryBuilder = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('id', id)
      .eq('is_available', true);

    if (userId && require('@/utils/validation').isValidUUID(userId)) {
      queryBuilder = queryBuilder.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      queryBuilder = queryBuilder.eq('is_approved', true);
    }

    const { data, error } = await queryBuilder.single();

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Supabase data (property):', data);
      console.log('Supabase error (property):', error);
    }

    if (data) {
      // Map to frontend-friendly shape
      const mapped = require('@/mappers/propertyMapper').propertyMapper(data);

      if (error) {
        console.error('Error fetching property:', error);
        return null;
      }

      return mapped;
    }

    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }

    return null;
  } catch (error) {
    console.error('Exception in getPropertyById:', error);
    return null;
  }
}

/**
 * Contar propriedades por tipo
 */
export async function getPropertyTypesCounts(userId?: string): Promise<
  Array<{ property_type: string; count: number }>
> {
  try {
    let query = supabase
      .from('properties')
      .select('property_type')
      .eq('is_available', true);

    if (userId && require('@/utils/validation').isValidUUID(userId)) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Supabase data (typeCounts):', data);
      console.log('Supabase error (typeCounts):', error);
    }

    if (error) {
      console.error('Error counting property types:', error);
      return [];
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      counts[item.property_type] = (counts[item.property_type] || 0) + 1;
    });

    return Object.entries(counts).map(([property_type, count]) => ({
      property_type,
      count,
    }));
  } catch (error) {
    console.error('Exception in getPropertyTypesCounts:', error);
    return [];
  }
}

/**
 * Obter províncias e cidades disponíveis
 */
export async function getLocations(userId?: string): Promise<Location[]> {
  try {
    let query = supabase
      .from('properties')
      .select('province, city')
      .eq('is_available', true);

    if (userId && require('@/utils/validation').isValidUUID(userId)) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Supabase data (locations):', data);
      console.log('Supabase error (locations):', error);
    }

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    const locations: Record<string, Set<string>> = {};
    (data || []).forEach((item: any) => {
      if (!locations[item.province]) {
        locations[item.province] = new Set();
      }
      if (item.city) {
        locations[item.province].add(item.city);
      }
    });

    return Object.entries(locations).map(([province, cities]) => ({
      province,
      cities: Array.from(cities),
    }));
  } catch (error) {
    console.error('Exception in getLocations:', error);
    return [];
  }
}


/**
 * Buscar propriedades com filtros avançados
 */
export async function searchProperties(filters: SearchFilters, userId?: string): Promise<Property[]> {
  try {
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`is_approved.eq.true,owner_id.eq.${userId}`);
    } else {
      query = query.eq('is_approved', true);
    }

    // Property types filter (multiple selection)
    if (filters.property_types && filters.property_types.length > 0) {
      query = query.in('property_type', filters.property_types);
    }

    // Property type (single selection) - for compatibility with simple filters
    if (filters.property_type) {
      query = query.eq('property_type', filters.property_type);
    }

    // Location filters
    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    if (filters.province) {
      query = query.eq('province', filters.province);
    }

    // Price range filters
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }

    // Rental duration filter
    if (filters.rental_duration) {
      query = query.eq('rental_duration', filters.rental_duration);
    }

    // Bedrooms filter
    if (filters.bedrooms !== undefined) {
      query = query.gte('bedrooms', filters.bedrooms);
    }

    // Bathrooms filter
    if (filters.bathrooms !== undefined) {
      query = query.gte('bathrooms', filters.bathrooms);
    }

    // Area range filters
    if (filters.min_area !== undefined) {
      query = query.gte('area_sqm', filters.min_area);
    }

    if (filters.max_area !== undefined) {
      query = query.lte('area_sqm', filters.max_area);
    }

    // Filter by status
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Granular filters (from Web model)
    if (filters.is_furnished !== undefined) {
      query = query.eq('is_furnished', filters.is_furnished);
    }
    if (filters.has_parking !== undefined) {
      query = query.eq('has_parking', filters.has_parking);
    }
    if (filters.has_pool !== undefined) {
      query = query.eq('has_pool', filters.has_pool);
    }
    if (filters.has_garden !== undefined) {
      query = query.eq('has_garden', filters.has_garden);
    }
    if (filters.has_security !== undefined) {
      query = query.eq('has_security', filters.has_security);
    }
    if (filters.available_from) {
      query = query.gte('created_at', filters.available_from); // Assuming available_from relates to listing date or we could add a specific column
    }

    // Text search filter
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    const { data, error } = await query
      .limit(filters.limit || 50);

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('Supabase data (search):', data);
      console.log('Supabase error (search):', error);
    }

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));

    if (error) {
      console.error('Error searching properties:', error);
      return [];
    }

    return processed || [];
  } catch (error) {
    console.error('Exception in searchProperties:', error);
    return [];
  }
}

/**
 * Criar uma nova propriedade
 */
export async function createProperty(propertyData: Partial<Property>): Promise<Property | null> {
  try {
    // 1. Extract images and cover_image from payload
    const { id, images, ...data } = propertyData as any;

    // 2. Insert into properties table
    const { data: newProperty, error } = await supabase
      .from('properties')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return null;
    }

    // 3. Save images to property_images table for canonical display
    if (images && Array.isArray(images) && images.length > 0) {
      const imageRecords = images.map((url, index) => ({
        property_id: newProperty.id,
        image_url: url,
        is_primary: index === 0,
        display_order: index
      }));

      const { error: imgError } = await supabase
        .from('property_images')
        .insert(imageRecords);

      if (imgError) {
        console.error('Error saving property images:', imgError);
      }
    }

    return newProperty;
  } catch (error) {
    console.error('Exception in createProperty:', error);
    return null;
  }
}

/**
 * Atualizar uma propriedade existente
 */
export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  try {
    const { data: updatedProperty, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return null;
    }

    return updatedProperty;
  } catch (error) {
    console.error('Exception in updateProperty:', error);
    return null;
  }
}

/**
 * Excluir uma propriedade (Soft delete ou Hard delete dependendo da regra de negócio)
 * Aqui faremos hard delete por simplicidade, ou setar is_available = false
 */
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in deleteProperty:', error);
    return false;
  }
}

/**
 * Obter propriedades de um proprietário específico (Meus Anúncios)
 */
export async function getMyProperties(userId: string): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my properties:', error);
      return [];
    }

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));
    return processed || [];
  } catch (error) {
    console.error('Exception in getMyProperties:', error);
    return [];
  }
}

/**
 * Renovar anúncio (atualizar created_at para topo da lista)
 */
export async function renewProperty(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ created_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error renewing property:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in renewProperty:', error);
    return false;
  }
}

/**
 * Upload de imagem de propriedade
 * Nota: Isso requer configuração de Storage no Supabase
 * bucket: 'property-images'
 */
export async function uploadPropertyImage(fileUri: string, userId: string): Promise<string | null> {
  try {
    // 1. Prepare file info
    const fileName = `${userId}/${Date.now()}.jpg`;
    const formData = new FormData();

    // React Native specific file handling
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    // 2. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, formData, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Exception in uploadPropertyImage:', error);
    return null;
  }
}
/**
 * Obter propriedades pendentes de aprovação (Admin)
 */
export async function getPendingProperties(): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending properties:', error);
      return [];
    }

    const processed = (data || []).map((p: any) => require('@/mappers/propertyMapper').propertyMapper(p));
    return processed || [];
  } catch (error) {
    console.error('Exception in getPendingProperties:', error);
    return [];
  }
}

/**
 * Aprovar uma propriedade
 */
export async function approveProperty(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      console.error('Error approving property:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in approveProperty:', error);
    return false;
  }
}

/**
 * Rejeitar uma propriedade (pode ser exclusão ou setar um status específico)
 */
export async function rejectProperty(id: string, reason?: string): Promise<boolean> {
  try {
    // Por enquanto vamos apenas deletar ou você pode adicionar uma coluna 'rejection_reason'
    // Para este MVP vamos marcar is_available = false ou deletar
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error rejecting property:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in rejectProperty:', error);
    return false;
  }
}
