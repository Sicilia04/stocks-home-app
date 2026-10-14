import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {listCategories, deleteCategory} from '../../../api/category';
import {Category} from '../../../types/category';
import type {AppStackParamList} from '../../../navigation';

function toMessage(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === 'string' && first.trim()) return first;
        if (first && typeof first === 'object') {
            const f = first as {msg?: unknown; message?: unknown};
            if (typeof f.msg === 'string') return f.msg;
            if (typeof f.message === 'string') return f.message;
        }
    }
    return null;
}

function getErrorMessage(err: unknown): string {
    const anyErr = err as {code?: string; response?: {status?: number; statusText?: string; data?: unknown}};

    if (anyErr?.code === 'ERR_NETWORK') {
        return "Connexion impossible à l'API. Vérifiez votre réseau.";
    }

    const data = anyErr?.response?.data as
        | string
        | {detail?: unknown; message?: unknown; error?: unknown}
        | undefined;

    if (typeof data === 'string') return data;

    if (data && typeof data === 'object') {
        const detailMsg = toMessage(data.detail);
        if (detailMsg) return detailMsg;
        const messageMsg = toMessage(data.message);
        if (messageMsg) return messageMsg;
        const errorMsg = toMessage(data.error);
        if (errorMsg) return errorMsg;
    }

    if (anyErr?.response?.status === 500) {
        return "Erreur interne du serveur (500). Vérifiez l'état de l'API.";
    }
    if (anyErr?.response?.statusText) return anyErr.response.statusText;
    return 'Une erreur est survenue.';
}

export function CategoriesScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

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

    useEffect(() => {
        if (isFocused) {
            load('refresh');
        }
    }, [isFocused, load]);

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
        <View style={[styles.container, {paddingTop: insets.top}]}>
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Catégories</Text>
                            {listError && <Text style={styles.errorText}>{listError}</Text>}
                            {!listError && categories.length === 0 && (
                                <Text style={styles.empty}>Aucune catégorie.</Text>
                            )}
                            {categories.map(category => (
                                <View key={category.id} style={styles.categoryRow}>
                                    <TouchableOpacity
                                        style={styles.categoryNameBtn}
                                        onPress={() => navigation.navigate('CategoryForm', {categoryId: category.id})}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Modifier ${category.name}`}
                                    >
                                        <Text style={styles.categoryName} numberOfLines={1}>
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
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

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ajouter une catégorie</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => navigation.navigate('CategoryForm')}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff"/>
                                <Text style={styles.primaryText}>Ajouter une catégorie</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    scroll: {flex: 1},
    scrollContent: {padding: 16, paddingTop: 8, paddingBottom: 32},
    center: {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},
    section: {marginBottom: 18, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee'},
    sectionTitle: {fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 12},
    categoryRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0'},
    categoryNameBtn: {flex: 1},
    categoryName: {color: '#222', fontSize: 15, marginRight: 12},
    deleteBtn: {padding: 4},
    empty: {color: '#9e9e9e', fontStyle: 'italic', paddingVertical: 8},
    errorText: {color: '#ff6b6b', marginTop: 4, fontSize: 13},
    primaryBtn: {flexDirection: 'row', backgroundColor: '#03A9F4', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8},
    primaryText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});
