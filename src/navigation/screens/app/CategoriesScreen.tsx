import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {listCategories, createCategory, deleteCategory} from '../../../api/category';
import {Category} from '../../../types/category';

const schema = z.object({
    name: z.string().trim().min(1, {message: 'Le nom de la catégorie est requis.'}),
});

// Extrait un message d'erreur lisible depuis une réponse django-ninja/axios
function getErrorMessage(err: unknown): string {
    const anyErr = err as {response?: {status?: number; statusText?: string; data?: unknown}};
    const data = anyErr?.response?.data as
        | string
        | {detail?: unknown; message?: unknown; error?: unknown}
        | undefined;

    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
        const {detail, message, error} = data;
        if (typeof detail === 'string') return detail;
        if (typeof message === 'string') return message;
        if (Array.isArray(error) && error.length > 0) {
            const first = error[0] as {msg?: unknown};
            if (first && typeof first.msg === 'string') return first.msg;
        }
        if (error && typeof error === 'object' && !Array.isArray(error)) {
            const firstValue = Object.values(error)[0] as unknown;
            if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0];
            if (typeof firstValue === 'string') return firstValue;
        }
    }
    if (anyErr?.response?.statusText) return anyErr.response.statusText;
    return 'Une erreur est survenue.';
}

export function CategoriesScreen() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);          // premier chargement
    const [refreshing, setRefreshing] = useState(false);   // pull-to-refresh
    const [listError, setListError] = useState<string | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const {control, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: zodResolver(schema),
        defaultValues: {name: ''},
    });

    const load = useCallback(async (mode: 'initial' | 'refresh') => {
        if (mode === 'initial') {
            setLoading(true);
        } else {
            setRefreshing(true);
        }
        setListError(null);
        try {
            const {data} = await listCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            setListError(getErrorMessage(err));
        } finally {
            if (mode === 'initial') {
                setLoading(false);
            } else {
                setRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        load('initial');
    }, [load]);

    const onAddSubmit = async (values: {name: string}) => {
        setSaving(true);
        try {
            await createCategory({name: values.name});
            reset();
            setShowAddModal(false);
            load('refresh');
        } catch (err) {
            Alert.alert('Ajout impossible', getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (category: Category) => {
        Alert.alert(
            'Supprimer une catégorie',
            `Supprimer « ${category.name} » ? Cette action est irréversible.`,
            [
                {text: 'Annuler', style: 'cancel'},
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(category.id);
                        try {
                            await deleteCategory(category.id);
                            load('refresh');
                        } catch (err) {
                            Alert.alert('Suppression impossible', getErrorMessage(err));
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor="#03A9F4"/>
                }
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#03A9F4"/>
                    </View>
                ) : (
                    <>
                        {/* Bloc 1 : Liste des catégories (+ suppr par ligne, Bloc 3) */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Catégories</Text>
                            {listError && <Text style={styles.errorText}>{listError}</Text>}
                            {!listError && categories.length === 0 && (
                                <Text style={styles.empty}>Aucune catégorie.</Text>
                            )}
                            {categories.map(category => (
                                <View key={category.id} style={styles.categoryRow}>
                                    <Text style={styles.categoryName} numberOfLines={1}>
                                        {category.name}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => confirmDelete(category)}
                                        disabled={deletingId === category.id}
                                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Supprimer ${category.name}`}
                                    >
                                        {deletingId === category.id ? (
                                            <ActivityIndicator size="small" color="#ff6b6b"/>
                                        ) : (
                                            <Ionicons name="trash-outline" size={20} color="#ff6b6b"/>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* Bloc 2 : Ajouter une catégorie */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ajouter une catégorie</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => setShowAddModal(true)}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff"/>
                                <Text style={styles.primaryText}>Ajouter une catégorie</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Modal d'ajout */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nouvelle catégorie</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>Nom</Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <TextInput
                                        placeholder="Ex. Fruits"
                                        placeholderTextColor="#9e9e9e"
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        style={styles.input}
                                    />
                                )}
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowAddModal(false)}
                                disabled={saving}
                            >
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSubmit(onAddSubmit)}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff"/>
                                ) : (
                                    <Text style={styles.saveText}>Ajouter</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    scroll: {flex: 1},
    scrollContent: {padding: 16, paddingBottom: 32},
    center: {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},
    section: {marginBottom: 18, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee'},
    sectionTitle: {fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 12},
    categoryRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0'},
    categoryName: {flex: 1, color: '#222', fontSize: 15, marginRight: 12},
    deleteBtn: {padding: 4},
    empty: {color: '#9e9e9e', fontStyle: 'italic', paddingVertical: 8},
    errorText: {color: '#ff6b6b', marginTop: 4, fontSize: 13},
    primaryBtn: {flexDirection: 'row', backgroundColor: '#03A9F4', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8},
    primaryText: {color: '#fff', fontSize: 15, fontWeight: '600'},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    modalCard: {backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 28},
    modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 14},
    field: {marginBottom: 16},
    label: {color: '#666', marginBottom: 8, fontSize: 14},
    input: {backgroundColor: '#f5f5f5', color: '#212121', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.select({ios: 12, android: 10}) as number, borderWidth: 1, borderColor: '#e0e0e0'},
    modalActions: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, gap: 12},
    cancelBtn: {paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)'},
    cancelText: {color: '#757575', fontSize: 15, fontWeight: '600'},
    saveBtn: {backgroundColor: '#03A9F4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    saveText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});
