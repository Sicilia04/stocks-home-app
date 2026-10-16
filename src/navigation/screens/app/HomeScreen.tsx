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
import {listMovements} from '../../../api/movement';
import {Product} from '../../../types/product';
import {StockMovement} from '../../../types/movement';
import {useMovementUserNames} from '../../../hooks/useMovementUserNames';
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
    const [movements, setMovements] = useState<StockMovement[]>([]);
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
            const [productsRes, movementsRes] = await Promise.all([listProducts(), listMovements()]);
            setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
            setMovements(Array.isArray(movementsRes.data) ? movementsRes.data : []);
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

    const lastMovements = useMemo(() => {
        return [...movements]
            .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
            .slice(0, 5);
    }, [movements]);

    const {getUserName} = useMovementUserNames(lastMovements.map(m => m.user));

    const productNames = useMemo(() => {
        const map = new Map<number, string>();
        products.forEach(p => map.set(p.id, p.name));
        return map;
    }, [products]);

    const formatMovementDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
    };

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

                        <View style={styles.movementCard}>
                            <View style={styles.movementHeader}>
                                <Ionicons name="swap-horizontal" size={20} color="#1565c0"/>
                                <Text style={styles.movementTitle}>Derniers mouvements</Text>
                            </View>

                            {!listError && lastMovements.length === 0 && (
                                <View style={styles.movementEmpty}>
                                    <Ionicons name="infinite" size={20} color="#9e9e9e"/>
                                    <Text style={styles.movementEmptyText}>Aucun mouvement enregistré pour le moment.</Text>
                                </View>
                            )}

                            {!listError &&
                                lastMovements.map(movement => {
                                    const isIn = movement.kind === 'in';
                                    return (
                                        <View style={styles.movementRow} key={movement.id}>
                                            <View
                                                style={[styles.movementBadge, isIn ? styles.movementBadgeIn : styles.movementBadgeOut]}
                                            >
                                                <Ionicons
                                                    name={isIn ? 'arrow-down' : 'arrow-up'}
                                                    size={14}
                                                    color={isIn ? '#2e7d32' : '#c62828'}
                                                />
                                                <Text style={[styles.movementBadgeText, isIn ? styles.movementBadgeTextIn : styles.movementBadgeTextOut]}>
                                                    {isIn ? 'Entrée' : 'Sortie'} · {movement.quantity}
                                                </Text>
                                            </View>
                                            <View style={styles.movementInfo}>
                                                <Text style={styles.movementProduct} numberOfLines={1}>
                                                    {productNames.get(movement.product) ?? `Réf. ${movement.product}`}
                                                </Text>
                                                <Text style={styles.movementUser}>
                                                    <Ionicons name="person-outline" size={12} color="#757575"/>
                                                    {getUserName(movement.user)}
                                                </Text>
                                                <Text style={styles.movementDate}>{formatMovementDate(movement.created)}</Text>
                                            </View>
                                        </View>
                                    );
                                })}

                            <TouchableOpacity
                                style={styles.movementLink}
                                onPress={() => navigation.navigate('MovementsList')}
                                accessibilityRole="button"
                                accessibilityLabel="Voir tous les mouvements"
                            >
                                <Text style={styles.movementLinkText}>Voir tout</Text>
                                <Ionicons name="chevron-forward" size={16} color="#1565c0"/>
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

    movementCard: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#bbdefb',
        backgroundColor: '#f5faff',
    },
    movementHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
    movementTitle: {fontSize: 16, fontWeight: '600', color: '#1565c0'},

    movementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#d6e6fa',
    },
    movementBadge: {
        minWidth: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    movementBadgeIn: {backgroundColor: '#e8f5e9', borderColor: '#a5d6a7'},
    movementBadgeOut: {backgroundColor: '#ffebee', borderColor: '#ef9a9a'},
    movementBadgeText: {fontSize: 13, fontWeight: '700'},
    movementBadgeTextIn: {color: '#2e7d32'},
    movementBadgeTextOut: {color: '#c62828'},

    movementInfo: {flex: 1},
    movementProduct: {color: '#222', fontSize: 14, fontWeight: '600'},
    movementUser: {color: '#757575', fontSize: 12, marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 3},
    movementDate: {color: '#757575', fontSize: 12, marginTop: 2},
    movementEmpty: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8},
    movementEmptyText: {color: '#9e9e9e', fontSize: 13},

    movementLink: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10},
    movementLinkText: {color: '#1565c0', fontSize: 13, fontWeight: '600'},
});
