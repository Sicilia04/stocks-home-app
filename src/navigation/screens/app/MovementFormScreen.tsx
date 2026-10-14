import React, {useCallback, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {listProducts} from '../../../api/product';
import {createMovement} from '../../../api/movement';
import {Product} from '../../../types/product';
import {MovementKind} from '../../../types/movement';
import type {AppStackParamList} from '../../index';
import BarcodeScanner from './components/BarcodeScanner';
import {playBeep} from '../../../utils/beep';

export type MovementFormRouteProps = {
    kind: MovementKind;
};

const EAN_REGEX = /^(?:\d{8}|\d{13})$/;

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

export function MovementFormScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'MovementForm'>>();
    const route = useRoute();
    const kind = (route.params as MovementFormRouteProps | undefined)?.kind ?? 'in';

    const [ean, setEan] = useState('');
    const [qty, setQty] = useState('1');
    const [looked, setLooked] = useState<Product | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{productName: string; quantity: number} | null>(null);
    const [saving, setSaving] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [showCamera, setShowCamera] = useState(false);
    const [cameraSession, setCameraSession] = useState(0);

    const [outStatus, setOutStatus] = useState<{kind: 'success' | 'error'; message: string} | null>(null);
    const [outBusy, setOutBusy] = useState(false);

    const loadProducts = useCallback(async () => {
        setLoadingProducts(true);
        setProductsError(null);
        try {
            const {data} = await listProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            setProductsError(getErrorMessage(err));
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const lookup = useCallback(
        (value: string) => {
            if (!EAN_REGEX.test(value)) {
                setLooked(null);
                setLookupError('Code-barres invalide (EAN-8 ou EAN-13).');
                return;
            }
            if (productsError) {
                setLooked(null);
                setLookupError(`Impossible de vérifier ce code : ${productsError}`);
                return;
            }
            const found = products.find(p => p.barcode === value);
            if (!found) {
                setLooked(null);
                setLookupError('Aucun produit ne correspond à ce code-barres.');
            } else {
                setLooked(found);
            }
        },
        [products, productsError],
    );

    const handleEanChange = (text: string) => {
        const digits = text.replace(/\D/g, '');
        setEan(digits);
        setLookupError(null);
        setSubmitError(null);
        if (EAN_REGEX.test(digits)) {
            lookup(digits);
        } else if (looked && looked.barcode !== digits) {
            setLooked(null);
        }
    };

    const openCamera = () => {
        setCameraSession(s => s + 1);
        if (kind === 'out') setOutStatus(null);
        setShowCamera(true);
    };

    const handleCameraScan = (value: string) => {
        const clean = value.trim();
        if (kind === 'out') {
            handleOutScan(clean);
            return;
        }
        setShowCamera(false);
        if (!EAN_REGEX.test(clean)) {
            setEan(clean);
            setLooked(null);
            setLookupError("Ce code n'est pas un EAN-8/EAN-13 reconnu.");
            return;
        }
        handleEanChange(clean);
    };

    const handleOutScan = (code: string) => {
        if (!EAN_REGEX.test(code)) {
            setOutStatus({kind: 'error', message: 'Code-barres non reconnu (EAN-8 ou EAN-13).'});
            return;
        }
        if (outBusy) return;
        const found = products.find(p => p.barcode === code);
        if (!found) {
            setOutStatus({kind: 'error', message: `Aucun produit ne correspond au code ${code}.`});
            return;
        }
        if (found.quantity < 1) {
            setOutStatus({kind: 'error', message: `Stock insuffisant : 0 en stock pour ${found.name}.`});
            return;
        }
        setOutBusy(true);
        setOutStatus({kind: 'success', message: `${found.name} · retrait en cours…`});
        createMovement({product_id: found.id, kind: 'out', quantity: 1})
            .then(() => {
                setProducts(prev =>
                    prev.map(p => (p.id === found.id ? {...p, quantity: p.quantity - 1} : p)),
                );
                setOutStatus({kind: 'success', message: `${found.name} · retiré, restant : ${found.quantity - 1}`});
                playBeep();
            })
            .catch(err => {
                setOutStatus({kind: 'error', message: getErrorMessage(err)});
            })
            .finally(() => {
                setOutBusy(false);
            });
    };

    const confirm = async () => {
        if (saving) return;
        if (!looked) {
            setSubmitError("Identifiez d'abord un produit avec son code-barres.");
            return;
        }
        const quantity = parseInt(qty, 10);
        if (!Number.isFinite(quantity) || quantity < 1) {
            setSubmitError('La quantité doit être un entier positif (>= 1).');
            return;
        }
        if (kind === 'out' && looked.quantity < quantity) {
            setSubmitError(`Stock insuffisant : ${looked.quantity} en stock.`);
            return;
        }
        setSaving(true);
        setSubmitError(null);
        try {
            const before = looked;
            await createMovement({product_id: before.id, kind, quantity});
            const newQuantity = kind === 'in' ? before.quantity + quantity : before.quantity - quantity;
            setLooked({...before, quantity: newQuantity});
            setSuccessInfo({productName: before.name, quantity});
        } catch (err) {
            setSubmitError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const isInput = kind === 'in';

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {successInfo ? (
                    <View style={styles.successBlock}>
                        <View style={styles.successIconWrap}>
                            <Ionicons name="checkmark" size={28} color="#fff"/>
                        </View>
                        <Text style={styles.successTitle}>Mouvement enregistré</Text>
                        <Text style={styles.successProduct}>{successInfo.productName}</Text>
                        <Text style={isInput ? styles.deltaIn : styles.deltaOut}>
                            {isInput ? '+' : '−'}
                            {successInfo.quantity} {successInfo.quantity > 1 ? 'pièces' : 'pièce'}
                        </Text>
                        {looked && (
                            <View style={styles.successCard}>
                                <Text style={styles.successCardLabel}>Nouveau stock</Text>
                                <Text style={styles.successCardQty}>{looked.quantity}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.finishBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
                            <Text style={styles.finishBtnText}>Terminer</Text>
                        </TouchableOpacity>
                    </View>
                ) : kind === 'out' ? (
                    <View style={styles.outBlock}>
                        <View style={styles.outHeader}>
                            <Ionicons name="trending-down" size={22} color="#e53935"/>
                            <Text style={styles.outTitle}>Sortie de stock</Text>
                            <Text style={styles.outSub}>
                                Chaque scan retire 1 pièce du produit scanné.
                            </Text>
                        </View>

                        {loadingProducts && (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#e53935"/>
                                <Text style={styles.loadingText}>Chargement des produits…</Text>
                            </View>
                        )}
                        {productsError && <Text style={styles.errorText}>{productsError}</Text>}

                        <TouchableOpacity
                            style={[styles.outRetireBtn, outBusy && styles.outRetireBtnBusy]}
                            onPress={openCamera}
                            disabled={outBusy}
                            accessibilityRole="button"
                            accessibilityLabel="Ouvrir la caméra pour retirer une pièce"
                        >
                            <Ionicons name="barcode-outline" size={28} color="#fff"/>
                            {outBusy ? (
                                <Text style={styles.outRetireBtnText}>Retrait en cours…</Text>
                            ) : (
                                <Text style={styles.outRetireBtnText}>Retirer</Text>
                            )}
                        </TouchableOpacity>

                        {outStatus && (
                            <View style={[styles.outStatusCard, outStatus.kind === 'error' ? styles.outStatusError : styles.outStatusSuccess]}>
                                <Ionicons
                                    name={outStatus.kind === 'error' ? 'close-circle' : 'checkmark-circle'}
                                    size={20}
                                    color={outStatus.kind === 'error' ? '#c62828' : '#2e7d32'}
                                />
                                <Text
                                    style={[
                                        styles.outStatusText,
                                        outStatus.kind === 'error' ? styles.outStatusTextError : styles.outStatusTextSuccess,
                                    ]}
                                >
                                    {outStatus.message}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.outHint}>
                            Astuce : en mode sortie, la caméra reste ouverte après chaque scan pour continuer à retirer.
                        </Text>

                        <TouchableOpacity
                            style={styles.outCloseBtn}
                            onPress={() => navigation.goBack()}
                            accessibilityRole="button"
                        >
                            <Text style={styles.outCloseBtnText}>Terminer</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.field}>
                            <Text style={styles.label}>Code-barres (EAN-8 ou EAN-13)</Text>
                            {loadingProducts && (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator size="small" color="#03A9F4"/>
                                    <Text style={styles.loadingText}>Chargement des produits…</Text>
                                </View>
                            )}
                            <TextInput
                                autoFocus
                                style={styles.input}
                                placeholder="Scanner ou saisir le code"
                                placeholderTextColor="#9e9e9e"
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={13}
                                value={ean}
                                onChangeText={handleEanChange}
                                onSubmitEditing={() => lookup(ean)}
                            />
                            <TouchableOpacity
                                style={styles.scanBtn}
                                onPress={openCamera}
                                accessibilityRole="button"
                                accessibilityLabel="Scanner avec la caméra"
                            >
                                <Ionicons name="barcode-outline" size={18} color="#03A9F4"/>
                                <Text style={styles.scanBtnText}>Scanner avec la caméra</Text>
                            </TouchableOpacity>
                            {lookupError && <Text style={styles.errorText}>{lookupError}</Text>}
                        </View>

                        {looked && (
                            <View style={[styles.previewCard, !looked.is_active && styles.previewCardInactive]}>
                                <View style={styles.previewTop}>
                                    <Text style={styles.previewName} numberOfLines={1}>
                                        {looked.name}
                                    </Text>
                                    <View style={styles.previewStockWrap}>
                                        <Text style={styles.previewStockQty}>{looked.quantity}</Text>
                                        <Text style={styles.previewStockLabel}>en stock</Text>
                                    </View>
                                </View>
                                <Text style={styles.previewMeta}>
                                    {looked.category_name} · EAN {looked.barcode}
                                    {!looked.is_active ? ' · Inactif' : ''}
                                </Text>
                            </View>
                        )}

                        <View style={styles.field}>
                            <Text style={styles.label}>Quantité {isInput ? 'à ajouter' : 'à sortir'}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1"
                                placeholderTextColor="#9e9e9e"
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={qty}
                                onChangeText={text => setQty(text.replace(/\D/g, '').slice(0, 6))}
                            />
                        </View>

                        {submitError && <Text style={styles.errorText}>{submitError}</Text>}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => navigation.goBack()}
                                disabled={saving}
                                accessibilityRole="button"
                            >
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={confirm}
                                disabled={saving || !looked}
                                accessibilityRole="button"
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff"/>
                                ) : (
                                    <Text style={styles.saveText}>Valider</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            <Modal
                visible={showCamera}
                animationType="slide"
                onRequestClose={() => setShowCamera(false)}
            >
                <BarcodeScanner
                    key={cameraSession}
                    continuous={kind === 'out'}
                    feedback={kind === 'out' && outStatus ? {kind: outStatus.kind, text: outStatus.message} : null}
                    onScanned={handleCameraScan}
                    onCancel={() => setShowCamera(false)}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    content: {padding: 16, paddingBottom: 32},
    successBlock: {alignItems: 'center', gap: 10, paddingTop: 24},
    successIconWrap: {width: 56, height: 56, borderRadius: 28, backgroundColor: '#43a047', alignItems: 'center', justifyContent: 'center'},
    successTitle: {fontSize: 18, fontWeight: '700', color: '#212121'},
    successProduct: {color: '#616161', fontSize: 15},
    deltaIn: {color: '#2e7d32', fontSize: 16, fontWeight: '700'},
    deltaOut: {color: '#c62828', fontSize: 16, fontWeight: '700'},
    successCard: {flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#e8f5e9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignSelf: 'stretch', justifyContent: 'space-between', marginTop: 8},
    successCardLabel: {color: '#2e7d32', fontSize: 14},
    successCardQty: {color: '#1b5e20', fontSize: 24, fontWeight: '800'},
    finishBtn: {backgroundColor: '#03A9F4', paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 16},
    finishBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
    field: {marginBottom: 16, gap: 8},
    label: {color: '#666', fontSize: 14},
    input: {backgroundColor: '#f5f5f5', color: '#212121', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.select({ios: 12, android: 10}) as number, borderWidth: 1, borderColor: '#e0e0e0'},
    loadingRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    loadingText: {color: '#757575', fontSize: 13},
    scanBtn: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#03A9F4', backgroundColor: '#e3f2fd'},
    scanBtnText: {color: '#0277bd', fontSize: 14, fontWeight: '600'},
    previewCard: {backgroundColor: '#f1f8e9', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#c5e1a5'},
    previewCardInactive: {opacity: 0.7},
    previewTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8},
    previewName: {flex: 1, color: '#212121', fontSize: 15, fontWeight: '700'},
    previewStockWrap: {alignItems: 'flex-end'},
    previewStockQty: {color: '#2e7d32', fontSize: 18, fontWeight: '700'},
    previewStockLabel: {color: '#757575', fontSize: 11},
    previewMeta: {color: '#757575', fontSize: 12, marginTop: 6},
    errorText: {color: '#ff6b6b', marginTop: 4, fontSize: 13},
    modalActions: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12},
    cancelBtn: {paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)'},
    cancelText: {color: '#757575', fontSize: 15, fontWeight: '600'},
    saveBtn: {backgroundColor: '#03A9F4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    saveText: {color: '#fff', fontSize: 15, fontWeight: '600'},

    outBlock: {gap: 14, alignItems: 'stretch'},
    outHeader: {gap: 6, marginBottom: 4},
    outTitle: {fontSize: 20, fontWeight: '800', color: '#212121'},
    outSub: {color: '#757575', fontSize: 14, textAlign: 'center'},
    outRetireBtn: {backgroundColor: '#e53935', paddingVertical: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12},
    outRetireBtnBusy: {opacity: 0.65},
    outRetireBtnText: {color: '#fff', fontSize: 18, fontWeight: '700'},
    outStatusCard: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14},
    outStatusSuccess: {backgroundColor: '#e8f5e9', borderColor: '#a5d6a7', borderWidth: 1},
    outStatusError: {backgroundColor: '#ffebee', borderColor: '#ef9a9a', borderWidth: 1},
    outStatusText: {flex: 1, fontSize: 14},
    outStatusTextSuccess: {color: '#1b5e20'},
    outStatusTextError: {color: '#c62828'},
    outHint: {color: '#616161', fontSize: 13, textAlign: 'center', marginTop: 4},
    outCloseBtn: {backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8},
    outCloseBtnText: {color: '#757575', fontSize: 15, fontWeight: '600'},
});
