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
import {useIsFocused} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {listProducts, deleteProduct} from '../../../api/product';
import {Product} from '../../../types/product';
import type {AppStackParamList} from '../../index';

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

export function ProductsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [products, setProducts] = useState<Product[]>([]);
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
            const {data} = await listProducts();
            setProducts(Array.isArray(data) ? data : []);
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

    const confirmDelete = (product: Product) => {
        Alert.alert(
            'Supprimer un produit',
            `Supprimer « ${product.name} » ? L'historique de ses mouvements sera également supprimé.`,
            [
                {text: 'Annuler', style: 'cancel'},
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(product.id);
                        try {
                            await deleteProduct(product.id);
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
                            <Text style={styles.sectionTitle}>Produits</Text>
                            {listError && <Text style={styles.errorText}>{listError}</Text>}
                            {!listError && products.length === 0 && (
                                <Text style={styles.empty}>Aucun produit.</Text>
                            )}
                            {products.map(product => (
                                <TouchableOpacity
                                    key={product.id}
                                    style={[styles.productRow, !product.is_active && styles.productRowInactive]}
                                    onPress={() => navigation.navigate('ProductForm', {productId: product.id})}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Modifier ${product.name}`}
                                >
                                    <View style={styles.productInfo}>
                                        <View style={styles.productNameRow}>
                                            <Text style={styles.productName} numberOfLines={1}>
                                                {product.name}
                                            </Text>
                                            {!product.is_active && (
                                                <View style={styles.badgeInactive}>
                                                    <Text style={styles.badgeInactiveText}>Inactif</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.productMeta}>
                                            {product.category_name} · Code {product.barcode}
                                        </Text>
                                        <View style={styles.productQtyRow}>
                                            <Text style={styles.productQty}>{product.quantity}</Text>
                                            <Text style={styles.productQtyLabel}>en stock</Text>
                                            {product.is_low_stock && (
                                                <View style={styles.badgeLow}>
                                                    <Text style={styles.badgeLowText}>Stock bas</Text>
                                                </View>
                                            )}
                                            <Text style={styles.productMin}>min {product.min_quantity}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => confirmDelete(product)}
                                        disabled={deletingId === product.id}
                                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Supprimer ${product.name}`}
                                    >
                                        {deletingId === product.id ? (
                                            <ActivityIndicator size="small" color="#ff6b6b"/>
                                        ) : (
                                            <Ionicons name="trash-outline" size={20} color="#ff6b6b"/>
                                        )}
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ajouter un produit</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => navigation.navigate('ProductForm')}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff"/>
                                <Text style={styles.primaryText}>Ajouter un produit</Text>
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
    productRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0'},
    productRowInactive: {opacity: 0.65},
    productInfo: {flex: 1, marginRight: 8},
    productNameRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    productName: {flex: 1, color: '#222', fontSize: 15, fontWeight: '600'},
    productMeta: {color: '#757575', fontSize: 12, marginTop: 2},
    productQtyRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6},
    productQty: {color: '#212121', fontSize: 14, fontWeight: '600'},
    productQtyLabel: {color: '#757575', fontSize: 12},
    productMin: {color: '#9e9e9e', fontSize: 12, marginLeft: 'auto'},
    badgeInactive: {backgroundColor: '#eeeeee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
    badgeInactiveText: {color: '#757575', fontSize: 11, fontWeight: '600'},
    badgeLow: {backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
    badgeLowText: {color: '#e65100', fontSize: 11, fontWeight: '600'},
    deleteBtn: {padding: 4, marginLeft: 8},
    empty: {color: '#9e9e9e', fontStyle: 'italic', paddingVertical: 8},
    errorText: {color: '#ff6b6b', marginTop: 4, fontSize: 13},
    primaryBtn: {flexDirection: 'row', backgroundColor: '#03A9F4', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8},
    primaryText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});
