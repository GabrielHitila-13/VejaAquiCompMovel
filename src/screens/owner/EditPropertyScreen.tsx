import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/utils/theme';
import { useAuth } from '@/context/AuthContext';
import { createProperty, updateProperty, getPropertyById, uploadPropertyImage, uploadPropertyDocument } from '@/services/properties';
import { ImageUploader } from '@/components/owner/ImageUploader';
import { DocumentUploader } from '@/components/owner/DocumentUploader';
import { PROPERTY_TYPES, AMENITIES, PROVINCES, RENTAL_DURATIONS } from '@/constants/enums';

export default function EditPropertyScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { user } = useAuth();
    const propertyId = route.params?.propertyId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0].id);
    const [rentalDuration, setRentalDuration] = useState('monthly');
    const [province, setProvince] = useState(PROVINCES[0]);
    const [city, setCity] = useState(''); // Simplified for now
    const [address, setAddress] = useState('');
    const [bedrooms, setBedrooms] = useState('1');
    const [bathrooms, setBathrooms] = useState('1');
    const [area, setArea] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [docImages, setDocImages] = useState<string[]>([]);
    const [specialConditions, setSpecialConditions] = useState('');

    useEffect(() => {
        // Mock cities for selected province (Expand this later)
        if (province === 'Maputo') {
            setAvailableCities(['Maputo', 'Matola']);
        } else {
            setAvailableCities([province + ' City']);
        }
        if (!city || !availableCities.includes(city)) setCity(availableCities[0] || '');
    }, [province]);

    useEffect(() => {
        if (propertyId) {
            loadProperty();
        }
    }, [propertyId]);

    const loadProperty = async () => {
        setLoading(true);
        const data = await getPropertyById(propertyId);
        if (data) {
            setTitle(data.title);
            setDescription(data.description || '');
            setPrice(data.price.toString());
            setPropertyType(data.property_type);
            setRentalDuration(data.rental_duration || 'monthly');
            setProvince(data.province);
            setCity(data.city);
            setAddress(data.address || '');
            setBedrooms(data.bedrooms?.toString() || '0');
            setBathrooms(data.bathrooms?.toString() || '0');
            setArea(data.area_sqm?.toString() || '');
            setImages(data.images || (data.cover_image ? [data.cover_image] : []));
            setSelectedAmenities(data.amenities || []);
            setDocImages(data.documentation_urls || []);
            setSpecialConditions(data.special_conditions || '');
        }
        setLoading(false);
    };

    const toggleAmenity = (amenityId: string) => {
        if (selectedAmenities.includes(amenityId)) {
            setSelectedAmenities(prev => prev.filter(id => id !== amenityId));
        } else {
            setSelectedAmenities(prev => [...prev, amenityId]);
        }
    };

    const handleSave = async () => {
        if (!title || !price || !city || !province) {
            Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios (*)');
            return;
        }

        if (!user) return;

        setSaving(true);
        try {
            // 1. Upload new images (if necessary)
            // For simplicity, we assume ImageUploader returns ready-to-use URIs (local or remote)
            // In a real app, we would upload local files here and get remote URLs
            // mocking upload for local URIs
            const uploadedImages = await Promise.all(images.map(async (img) => {
                if (img.startsWith('file:') || img.startsWith('content:')) {
                    const url = await uploadPropertyImage(img, user.id);
                    return url || img; // Fallback
                }
                return img;
            }));

            // 2. Upload new documents
            const uploadedDocs = await Promise.all(docImages.map(async (doc) => {
                if (doc.startsWith('file:') || doc.startsWith('content:')) {
                    const url = await uploadPropertyDocument(doc, user.id);
                    return url || doc;
                }
                return doc;
            }));

            const propertyData: any = {
                title,
                description,
                price: parseFloat(price),
                property_type: propertyType,
                rental_duration: rentalDuration,
                province,
                city,
                address,
                bedrooms: parseInt(bedrooms) || 0,
                bathrooms: parseInt(bathrooms) || 0,
                area_sqm: parseFloat(area) || 0,
                amenities: selectedAmenities,
                images: uploadedImages,
                cover_image: uploadedImages[0] || null,
                documentation_urls: uploadedDocs,
                has_documents: uploadedDocs.length > 0,
                special_conditions: specialConditions,
                owner_id: user.id,
                is_available: true,
                currency: 'MT',
            };

            if (propertyId) {
                await updateProperty(propertyId, propertyData);
                Alert.alert('Sucesso', 'Anúncio atualizado!');
            } else {
                await createProperty(propertyData);
                Alert.alert('Sucesso', 'Anúncio criado!');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Error saving property:', error);
            Alert.alert('Erro', 'Falha ao salvar anúncio.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <ImageUploader
                        images={images}
                        onImagesChange={setImages}
                        maxImages={10}
                    />

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Documentação Legais</Text>
                        <DocumentUploader
                            documents={docImages}
                            onDocumentsChange={setDocImages}
                            maxDocs={5}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informações Básicas</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Título do Anúncio *</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Ex: Apartamento T3 moderno na Polana"
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Preço (MT) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={colors.mutedForeground}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Período</Text>
                                {/* Simple dropdown simulation */}
                                <View style={styles.pickerContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {Object.entries(RENTAL_DURATIONS).map(([key, label]) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[
                                                    styles.chip,
                                                    rentalDuration === key && styles.chipSelected
                                                ]}
                                                onPress={() => setRentalDuration(key)}
                                            >
                                                <Text style={[
                                                    styles.chipText,
                                                    rentalDuration === key && styles.chipTextSelected
                                                ]}>{label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tipo de Imóvel</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.sm }}>
                                {PROPERTY_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.chip,
                                            propertyType === type.id && styles.chipSelected
                                        ]}
                                        onPress={() => setPropertyType(type.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            propertyType === type.id && styles.chipTextSelected
                                        ]}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Descrição</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                placeholder="Descreva os detalhes do imóvel..."
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Localização</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Província</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {PROVINCES.map((prov) => (
                                    <TouchableOpacity
                                        key={prov}
                                        style={[
                                            styles.chip,
                                            province === prov && styles.chipSelected
                                        ]}
                                        onPress={() => setProvince(prov)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            province === prov && styles.chipTextSelected
                                        ]}>{prov}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Cidade *</Text>
                            <TextInput
                                style={styles.input}
                                value={city}
                                onChangeText={setCity}
                                placeholder="Ex: Maputo"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Endereço Completo</Text>
                            <TextInput
                                style={styles.input}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Av. Julius Nyerere, nº 123"
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Características</Text>
                        <View style={styles.row}>
                            <View style={styles.counterGroup}>
                                <Text style={styles.label}>Quartos</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bedrooms}
                                    onChangeText={setBedrooms}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.counterGroup}>
                                <Text style={styles.label}>Banhos</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bathrooms}
                                    onChangeText={setBathrooms}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.counterGroup}>
                                <Text style={styles.label}>Área (m²)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={area}
                                    onChangeText={setArea}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { marginTop: spacing.md }]}>Comodidades</Text>
                        <View style={styles.amenitiesGrid}>
                            {AMENITIES.map((amenity) => (
                                <TouchableOpacity
                                    key={amenity.id}
                                    style={[
                                        styles.amenityChip,
                                        selectedAmenities.includes(amenity.id) && styles.amenityChipSelected
                                    ]}
                                    onPress={() => toggleAmenity(amenity.id)}
                                >
                                    <MaterialIcons
                                        name={selectedAmenities.includes(amenity.id) ? "check-box" : "check-box-outline-blank"}
                                        size={20}
                                        color={selectedAmenities.includes(amenity.id) ? colors.primary : colors.mutedForeground}
                                    />
                                    <Text style={[
                                        styles.amenityText,
                                        selectedAmenities.includes(amenity.id) && styles.amenityTextSelected
                                    ]}>{amenity.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { marginTop: spacing.md }]}>Condições Especiais</Text>
                        <TextInput
                            style={[styles.input, styles.textAreaSmall]}
                            value={specialConditions}
                            onChangeText={setSpecialConditions}
                            multiline
                            numberOfLines={3}
                            placeholder="Ex: Não aceita animais..."
                        />


                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Publicar Anúncio</Text>
                        )}
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        ...typography.h4,
        color: colors.foreground,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.xs,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.label,
        color: colors.mutedForeground,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        color: colors.foreground,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    textAreaSmall: {
        height: 70,
        textAlignVertical: 'top',
        marginTop: 4,
    },
    switchThumbActive: {
        transform: [{ translateX: 22 }],
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    pickerContainer: {
        paddingVertical: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.muted,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    chipTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    counterGroup: {
        flex: 1,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    amenityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        padding: 8,
        gap: 8,
    },
    amenityChipSelected: {
        backgroundColor: colors.primary + '05',
        borderRadius: 8,
    },
    amenityText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    amenityTextSelected: {
        color: colors.primary,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        ...typography.h4,
        color: colors.primaryForeground,
        fontWeight: 'bold',
    },
});
