import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../components/ui';
import { colors, spacing, typography } from '../utils/theme';
import { getPropertyById } from '@/services/properties';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import type { Property } from '@/types/property';

// New Components
import { ImageGallery } from '@/components/property/ImageGallery';
import { OwnerInfoSection } from '@/components/property/OwnerInfoSection';
import { LegalStatusSection } from '@/components/property/LegalStatusSection';
import { PropertyHistorySection } from '@/components/property/PropertyHistorySection';
import { SpecialConditionsSection } from '@/components/property/SpecialConditionsSection';

const PropertyDetailScreen = ({ route, navigation }: any) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { propertyId } = route.params;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const data = await getPropertyById(propertyId, user?.id);
      if (data) {
        setProperty(data);
      } else {
        Alert.alert('Erro', 'Imóvel não encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Erro', 'Não foi possível carregar o imóvel');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisit = () => {
    Alert.alert(
      'Agendar Visita',
      'Deseja agendar uma visita para este imóvel?',
      [
        { text: 'Cancelar', onPress: () => { } },
        {
          text: 'Agendar',
          onPress: () => {
            Alert.alert('Sucesso', 'Visita agendada com sucesso! O proprietário entrará em contato.');
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Confira este imóvel: ${property.title} - ${property.city}, ${property.province}`,
        title: property.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenMap = () => {
    if (property?.latitude && property?.longitude) {
      const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
      const url = `${scheme}${property.latitude},${property.longitude}?q=${property.title}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Mapa', 'Localização exata não disponível');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Imóvel não encontrado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={handleShare} style={styles.iconButton}>
              <MaterialIcons name="share" size={24} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => toggleFavorite(property.id)} style={styles.iconButton}>
              <MaterialIcons
                name={isFavorite(property.id) ? "favorite" : "favorite-border"}
                size={24}
                color={isFavorite(property.id) ? colors.destructive : colors.foreground}
              />
            </Pressable>
          </View>
        </View>

        {/* Image Gallery */}
        <ImageGallery
          images={property.images || []}
          coverImage={property.cover_image}
        />

        <View style={styles.contentContainer}>
          {/* Title & Price */}
          <View style={styles.headerSection}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{property.property_type}</Text>
            </View>
            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={colors.mutedForeground} />
              <Text style={styles.locationText}>
                {property.location || `${property.city}, ${property.province}`}
              </Text>
              {(property.latitude && property.longitude) && (
                <Pressable onPress={handleOpenMap}>
                  <Text style={styles.mapLink}>Ver no mapa</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.price}>
              {property.price.toLocaleString('pt-AO')} {property.currency || 'MT'}
              {property.rental_duration && (
                <Text style={styles.duration}>
                  /{property.rental_duration === 'daily' ? 'dia' :
                    property.rental_duration === 'monthly' ? 'mês' : 'ano'}
                </Text>
              )}
            </Text>
          </View>

          {/* Key Features */}
          <View style={styles.featuresCard}>
            <View style={styles.featureItem}>
              <MaterialIcons name="bed" size={24} color={colors.primary} />
              <Text style={styles.featureValue}>{property.bedrooms || '-'}</Text>
              <Text style={styles.featureLabel}>Quartos</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.featureItem}>
              <MaterialIcons name="bathtub" size={24} color={colors.primary} />
              <Text style={styles.featureValue}>{property.bathrooms || '-'}</Text>
              <Text style={styles.featureLabel}>Banhos</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.featureItem}>
              <MaterialIcons name="square-foot" size={24} color={colors.primary} />
              <Text style={styles.featureValue}>{property.area_sqm || '-'}</Text>
              <Text style={styles.featureLabel}>m²</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={showFullDescription ? undefined : 4}
            >
              {property.description}
            </Text>
            {property.description && property.description.length > 150 && (
              <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMore}>
                  {showFullDescription ? 'Ler menos' : 'Ler mais'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comodidades</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* New Enhanced Sections */}
          <OwnerInfoSection property={property} />
          <LegalStatusSection property={property} />
          <PropertyHistorySection property={property} />
          <SpecialConditionsSection property={property} />

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleScheduleVisit}
          style={styles.scheduleButton}
        >
          <Text style={styles.scheduleButtonText}>Agendar Visita</Text>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/?text=Tenho interesse no imóvel: ${property.title}`)}
          style={styles.contactButton}
        >
          <MaterialIcons name="chat" size={20} color={colors.primary} />
          <Text style={styles.contactButtonText}>Contato</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 20,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  typeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.h2,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 4,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
  },
  mapLink: {
    ...typography.bodySmall,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  price: {
    ...typography.h3,
    color: colors.primary,
  },
  duration: {
    ...typography.body,
    color: colors.mutedForeground,
    fontWeight: 'normal',
  },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureValue: {
    ...typography.h4,
    color: colors.foreground,
    marginVertical: 4,
  },
  featureLabel: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: colors.border,
    height: '100%',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    color: colors.mutedForeground,
    lineHeight: 24,
  },
  readMore: {
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 6,
  },
  amenityText: {
    ...typography.bodySmall,
    color: colors.foreground,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scheduleButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  scheduleButtonText: {
    ...typography.h4,
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    ...typography.h4,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;
