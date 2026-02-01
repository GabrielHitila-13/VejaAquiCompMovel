import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Property, SearchFilters } from '@/types/property';
import { Card, Input } from '../components/ui';
import { FilterModal } from '../components/FilterModal';
import { FilterChips } from '../components/FilterChips';
import { SaveSearchModal } from '../components/SaveSearchModal';
import { searchProperties } from '@/services/properties';
import { useAuth } from '@/context/AuthContext';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { colors, spacing, typography } from '../utils/theme';

const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [saveSearchModalVisible, setSaveSearchModalVisible] = useState(false);
  const { user } = useAuth();

  const {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    setMultipleFilters,
    activeFilterCount,
    hasActiveFilters,
  } = useSearchFilters();

  // Perform search when filters or query changes
  useEffect(() => {
    handleSearch();
  }, [filters]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const searchFilters = {
        ...filters,
        query: searchQuery.trim() || undefined,
      };

      const results = await searchProperties(searchFilters, user?.id);
      setProperties(results as any);
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setSearching(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    handleSearch();
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setMultipleFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    clearAllFilters();
    setSearchQuery('');
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PropertyDetail', { id: property.id })}
      activeOpacity={0.7}
    >
      <Card style={{ marginBottom: spacing.md }}>
        {property.cover_image && (
          <Image
            source={{ uri: property.cover_image }}
            style={styles.propertyImage}
          />
        )}
        <Text style={styles.propertyTitle}>
          {property.title}
        </Text>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={14} color={colors.mutedForeground} />
          <Text style={styles.locationText}>
            {property.city}, {property.province}
          </Text>
        </View>

        {(property.bedrooms || property.bathrooms || property.area_sqm) && (
          <View style={styles.featuresContainer}>
            {property.bedrooms !== undefined && (
              <View style={styles.feature}>
                <MaterialIcons name="bed" size={16} color={colors.muted} />
                <Text style={styles.featureText}>{property.bedrooms}</Text>
              </View>
            )}
            {property.bathrooms !== undefined && (
              <View style={styles.feature}>
                <MaterialIcons name="bathtub" size={16} color={colors.muted} />
                <Text style={styles.featureText}>{property.bathrooms}</Text>
              </View>
            )}
            {property.area_sqm && (
              <View style={styles.feature}>
                <MaterialIcons name="square-foot" size={16} color={colors.muted} />
                <Text style={styles.featureText}>{property.area_sqm} m²</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {property.price.toLocaleString('pt-BR')} MT
          </Text>
          {property.rental_duration && (
            <Text style={styles.duration}>
              /{property.rental_duration === 'daily' ? 'dia' :
                property.rental_duration === 'monthly' ? 'mês' : 'ano'}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.headerTitle}>Pesquisar Imóveis</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={colors.mutedForeground} />
            <Input
              placeholder="Buscar imóvel..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="tune" size={24} color={colors.primaryForeground} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Filters Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFiltersBar}
          contentContainerStyle={styles.quickFiltersContent}
        >
          <TouchableOpacity
            style={[styles.quickFilterChip, filters.province && styles.quickFilterChipActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="location-on" size={16} color={filters.province ? '#FFF' : colors.primary} />
            <Text style={[styles.quickFilterText, filters.province && styles.quickFilterTextActive]}>
              {filters.province || 'Localização'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterChip, filters.property_types && styles.quickFilterChipActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="home" size={16} color={filters.property_types ? '#FFF' : colors.primary} />
            <Text style={[styles.quickFilterText, filters.property_types && styles.quickFilterTextActive]}>
              {filters.property_types ? `${filters.property_types.length} Tipos` : 'Tipo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterChip, filters.rental_duration && styles.quickFilterChipActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="event" size={16} color={filters.rental_duration ? '#FFF' : colors.primary} />
            <Text style={[styles.quickFilterText, filters.rental_duration && styles.quickFilterTextActive]}>
              {filters.rental_duration === 'daily' ? 'Diário' : filters.rental_duration === 'monthly' ? 'Mensal' : filters.rental_duration === 'yearly' ? 'Anual' : 'Duração'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterChip, (filters.min_price || filters.max_price) && styles.quickFilterChipActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="attach-money" size={16} color={(filters.min_price || filters.max_price) ? '#FFF' : colors.primary} />
            <Text style={[styles.quickFilterText, (filters.min_price || filters.max_price) && styles.quickFilterTextActive]}>
              Preço
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Active Filters */}
        {hasActiveFilters && (
          <View>
            <FilterChips
              filters={filters}
              onRemoveFilter={clearFilter}
              onClearAll={handleClearAllFilters}
            />
            {user && (
              <TouchableOpacity
                style={styles.saveSearchButton}
                onPress={() => setSaveSearchModalVisible(true)}
              >
                <MaterialIcons name="bookmark-border" size={16} color={colors.primary} />
                <Text style={styles.saveSearchButtonText}>Salvar esta busca</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results Count */}
        {!searching && (
          <Text style={styles.resultsCount}>
            {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
          </Text>
        )}

        {/* Loading State */}
        {searching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Pesquisando...</Text>
          </View>
        )}

        {/* Results */}
        {!searching && properties.length > 0 ? (
          properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))
        ) : !searching && (searchQuery || hasActiveFilters) ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color={colors.mutedForeground} />
            <Text style={styles.emptyStateTitle}>Nenhum imóvel encontrado</Text>
            <Text style={styles.emptyStateText}>
              Tente ajustar os filtros ou termos de pesquisa
            </Text>
          </View>
        ) : !searching && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search" size={64} color={colors.mutedForeground} />
            <Text style={styles.emptyStateTitle}>Comece a pesquisar</Text>
            <Text style={styles.emptyStateText}>
              Use a barra de pesquisa ou filtros para encontrar imóveis
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={clearAllFilters}
      />

      {/* Save Search Modal */}
      {user && (
        <SaveSearchModal
          visible={saveSearchModalVisible}
          filters={filters}
          userId={user.id}
          onClose={() => setSaveSearchModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.foreground,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.destructive,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...typography.label,
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '700',
  },
  resultsCount: {
    ...typography.body,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  propertyImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  propertyTitle: {
    ...typography.h4,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    ...typography.label,
    color: colors.foreground,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  price: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  duration: {
    ...typography.label,
    color: colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.foreground,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  quickFiltersBar: {
    marginBottom: spacing.md,
  },
  quickFiltersContent: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  quickFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickFilterText: {
    fontSize: 13,
    color: colors.foreground,
    ...typography.label,
  },
  quickFilterTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  saveSearchButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SearchScreen;
