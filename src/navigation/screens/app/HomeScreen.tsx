import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {listProducts} from '../../../api/product';
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

export function HomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

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

    const lowStockItems = useMemo(() => {
        return products.filter(p => p.is_low_stock);
    }, [products]);

    const openReplenish = (product: Product) => {
        navigation.navigate('MovementForm', {kind: 'in', barcode: product.barcode});
    };

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor="#ff6b6b"/>
                }
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#ff6b6b"/>
                    </View>
                ) : (
                    <>
                        <View style={styles.hero}>
                            <Text style={styles.heroTitle}>Alertes de stock</Text>
                            <Text style={styles.heroSub}>
                                {lowStockItems.length === 0
                                    ? 'Tout est au niveau'
                                    : `${lowStockItems.length} produit${lowStockItems.length > 1 ? 's' : ''} sous le seuil minimum`}
                            </Text>
                        </View>

                        <View style={styles.alertCard}>
                            <View style={styles.alertHeader}>
                                <Ionicons name="alert-circle" size={20} color="#ff6b6b"/>
                                <Text style={styles.alertTitle}>Stock bas</Text>
                            </View>

                            {listError && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="close-circle" size={16} color="#ff6b6b"/>
                                    <Text style={styles.errorText}>{listError}</Text>
                                </View>
                            )}

                            {!listError && lowStockItems.length === 0 && (
                                <View style={styles.allGood}>
                                    <Ionicons name="checkmark-circle" size={20} color="#2e7d32"/>
                                    <Text style={styles.allGoodText}>Tous les stocks sont au niveau.</Text>
                                </View>
                            )}

                            {!listError &&
                                lowStockItems.map(product => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={styles.row}
                                        onPress={() => openReplenish(product)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Réassortir ${product.name}`}
                                    >
                                        <View style={styles.rowInfo}>
                                            <Text style={styles.rowName} numberOfLines={1}>
                                                {product.name}
                                            </Text>
                                            <Text style={styles.rowMeta}>
                                                {product.category_name} · Code {product.barcode}
                                            </Text>
                                            <View style={styles.rowQty}>
                                                <Text style={styles.qtyLow}>{product.quantity}</Text>
                                                <Text style={styles.qtyLabel}>en stock</Text>
                                                <Text style={styles.rowMin}>min {product.min_quantity}</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="trending-up" size={22} color="#ff6b6b"/>
                                    </TouchableOpacity>
                                ))}
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
    scrollContent: {padding: 16, paddingBottom: 32},
    center: {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},

    hero: {
        marginBottom: 16,
        padding: 18,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    heroTitle: {fontSize: 18, fontWeight: 'bold', color: '#212121'},
    heroSub: {fontSize: 13, color: '#757575', marginTop: 2},

    alertCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#ffcdd2',
        backgroundColor: '#fffafa',
    },
    alertHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
    alertTitle: {fontSize: 16, fontWeight: '600', color: '#d32f2f'},

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ffe3e3',
    },
    rowInfo: {flex: 1, marginRight: 8},
    rowName: {color: '#222', fontSize: 15, fontWeight: '600'},
    rowMeta: {color: '#757575', fontSize: 12, marginTop: 2},
    rowQty: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6},
    qtyLow: {color: '#ff6b6b', fontSize: 14, fontWeight: '700'},
    qtyLabel: {color: '#757575', fontSize: 12},
    rowMin: {color: '#9e9e9e', fontSize: 12, marginLeft: 'auto'},

    allGood: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8},
    allGoodText: {color: '#2e7d32', fontSize: 13},

    errorBox: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 6},
    errorText: {color: '#ff6b6b', fontSize: 13, flex: 1},
});
