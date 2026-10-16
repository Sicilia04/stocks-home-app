import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {listMovements} from '../../../api/movement';
import {listProducts} from '../../../api/product';
import {Product} from '../../../types/product';
import {StockMovement} from '../../../types/movement';
import {useMovementUserNames} from '../../../hooks/useMovementUserNames';

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

export function MovementsListScreen() {
    const isFocused = useIsFocused();

    const [movements, setMovements] = useState<StockMovement[]>([]);
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
            const [movementsRes, productsRes] = await Promise.all([listMovements(), listProducts()]);
            setMovements(Array.isArray(movementsRes.data) ? movementsRes.data : []);
            setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
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

    const sortedMovements = useMemo(() => {
        return [...movements].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }, [movements]);

    const productNames = useMemo(() => {
        const map = new Map<number, string>();
        products.forEach(p => map.set(p.id, p.name));
        return map;
    }, [products]);

    const {getUserName} = useMovementUserNames(sortedMovements.map(m => m.user));

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor="#1565c0"/>
            }
        >
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1565c0"/>
                </View>
            ) : (
                <>
                    {listError && (
                        <View style={styles.errorBox}>
                            <Ionicons name="close-circle" size={16} color="#ff6b6b"/>
                            <Text style={styles.errorText}>{listError}</Text>
                        </View>
                    )}

                    {!listError && sortedMovements.length === 0 && (
                        <View style={styles.empty}>
                            <Ionicons name="infinite" size={28} color="#9e9e9e"/>
                            <Text style={styles.emptyText}>Aucun mouvement enregistré pour le moment.</Text>
                        </View>
                    )}

                    {!listError &&
                        sortedMovements.map(movement => {
                            const isIn = movement.kind === 'in';
                            return (
                                <View style={styles.row} key={movement.id}>
                                    <View style={[styles.badge, isIn ? styles.badgeIn : styles.badgeOut]}>
                                        <Ionicons
                                            name={isIn ? 'arrow-down' : 'arrow-up'}
                                            size={14}
                                            color={isIn ? '#2e7d32' : '#c62828'}
                                        />
                                        <Text
                                            style={[styles.badgeText, isIn ? styles.badgeTextIn : styles.badgeTextOut]}
                                        >
                                            {isIn ? 'Entrée' : 'Sortie'} · {movement.quantity}
                                        </Text>
                                    </View>
                                    <View style={styles.info}>
                                        <Text style={styles.product} numberOfLines={1}>
                                            {productNames.get(movement.product) ?? `Réf. ${movement.product}`}
                                        </Text>
                                        <Text style={styles.user}>
                                            <Ionicons name="person-outline" size={12} color="#757575"/>
                                            {getUserName(movement.user)}
                                        </Text>
                                        <Text style={styles.date}>{formatDate(movement.created)}</Text>
                                    </View>
                                </View>
                            );
                        })}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {flex: 1, backgroundColor: '#fff'},
    scrollContent: {padding: 16, paddingTop: 8, paddingBottom: 32},
    center: {alignItems: 'center', justifyContent: 'center', paddingVertical: 48},

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    badge: {
        minWidth: 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    badgeIn: {backgroundColor: '#e8f5e9', borderColor: '#a5d6a7'},
    badgeOut: {backgroundColor: '#ffebee', borderColor: '#ef9a9a'},
    badgeText: {fontSize: 13, fontWeight: '700'},
    badgeTextIn: {color: '#2e7d32'},
    badgeTextOut: {color: '#c62828'},

    info: {flex: 1},
    product: {color: '#222', fontSize: 15, fontWeight: '600'},
    user: {color: '#757575', fontSize: 12, marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 3},
    date: {color: '#757575', fontSize: 12, marginTop: 2},

    empty: {alignItems: 'center', paddingVertical: 48, gap: 8},
    emptyText: {color: '#9e9e9e', fontSize: 13},

    errorBox: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12},
    errorText: {color: '#ff6b6b', fontSize: 13, flex: 1},
});
