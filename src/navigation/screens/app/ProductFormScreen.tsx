import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {getProduct, createProduct, updateProduct, deleteProduct} from '../../../api/product';
import {listCategories} from '../../../api/category';
import {Category} from '../../../types/category';
import type {AppStackParamList} from '../../../navigation';
import BarcodeScanner from './components/BarcodeScanner';

export type ProductFormRouteProps = {
    productId?: number;
};

const schema = z.object({
    name: z.string().trim().min(1, {message: 'Le nom du produit est requis.'}),
    barcode: z
        .string()
        .trim()
        .regex(/^(?:\d{8}|\d{13})$/, {message: 'Code-barres invalide (EAN-8 ou EAN-13).'}),
    category: z.number().int().positive({message: 'Choisissez une catégorie.'}),
    min_quantity: z.string().regex(/^\d+$/, {message: 'Seuil minimum invalide.'}),
    is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
    name: '',
    barcode: '',
    category: 0,
    min_quantity: '',
    is_active: true,
};

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

const EAN_REGEX = /^(?:\d{8}|\d{13})$/;

export function ProductFormScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'ProductForm'>>();
    const route = useRoute();
    const productId = (route.params as ProductFormRouteProps | undefined)?.productId;
    const isEdit = productId != null;
    const insets = useSafeAreaInsets();

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showCamera, setShowCamera] = useState(false);
    const [cameraSession, setCameraSession] = useState(0);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const nameRef = useRef<TextInput | null>(null);
    const barcodeRef = useRef<TextInput | null>(null);
    const minQuantityRef = useRef<TextInput | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: {errors, isSubmitting},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: DEFAULT_VALUES,
    });

    const selectedCategoryId = watch('category');
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    const loadCategories = useCallback(async () => {
        setCategoryLoadError(null);
        try {
            const {data} = await listCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            setCategoryLoadError(getErrorMessage(err));
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        if (!isEdit) return;
        let cancelled = false;
        (async () => {
            try {
                const {data} = await getProduct(productId);
                if (cancelled) return;
                reset({
                    name: data.name,
                    barcode: data.barcode,
                    category: data.category,
                    min_quantity: String(data.min_quantity),
                    is_active: data.is_active,
                });
            } catch (err) {
                if (!cancelled) setLoadError(getErrorMessage(err));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isEdit, productId, reset]);

    const focusField = (ref: React.RefObject<TextInput | null>, delay = 120) => {
        setTimeout(() => {
            ref.current?.focus();
        }, delay);
    };

    const openCategoryPickerOnEnter = () => {
        setShowCategoryPicker(true);
    };

    const openCamera = () => {
        setCameraSession(s => s + 1);
        setShowCamera(true);
    };

    const handleCameraScan = (value: string) => {
        const clean = value.trim();
        if (!EAN_REGEX.test(clean)) return;
        setValue('barcode', clean, {shouldValidate: true});
        setShowCamera(false);
        focusField(barcodeRef, 160);
    };

    const onSubmit = async (values: FormValues) => {
        setSubmitError(null);
        const payload = {
            name: values.name,
            barcode: values.barcode,
            // L'API attend "category_id" en entree (voir types/product.ts).
            category_id: values.category,
            min_quantity: parseInt(values.min_quantity, 10),
            is_active: values.is_active,
        };
        try {
            if (isEdit) {
                await updateProduct(productId, payload);
            } else {
                await createProduct(payload);
            }
            navigation.goBack();
        } catch (err) {
            setSubmitError(getErrorMessage(err));
        }
    };

    const confirmDelete = () => {
        if (productId == null) return;
        Alert.alert('Supprimer un produit', 'Ce produit sera définitivement supprimé avec son historique de mouvements.', [
            {text: 'Annuler', style: 'cancel'},
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    setDeleting(true);
                    try {
                        await deleteProduct(productId);
                        navigation.goBack();
                    } catch (err) {
                        setDeleteError(getErrorMessage(err));
                    } finally {
                        setDeleting(false);
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View style={styles.field}>
                    <Text style={styles.label}>Nom</Text>
                    <Controller
                        control={control}
                        name="name"
                        render={({field: {onChange, onBlur, value}}) => (
                            <TextInput
                                ref={nameRef}
                                placeholder="Ex. Café en grains"
                                placeholderTextColor="#9e9e9e"
                                autoCapitalize="words"
                                autoCorrect={false}
                                submitBehavior="blurAndSubmit"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                onSubmitEditing={() => focusField(barcodeRef)}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Code-barres (EAN-8 ou EAN-13)</Text>
                    <Controller
                        control={control}
                        name="barcode"
                        render={({field: {onChange, onBlur, value}}) => (
                            <TextInput
                                ref={barcodeRef}
                                placeholder="Ex. 1234567890123"
                                placeholderTextColor="#9e9e9e"
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={13}
                                submitBehavior="blurAndSubmit"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                onSubmitEditing={openCategoryPickerOnEnter}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.barcode && <Text style={styles.errorText}>{errors.barcode.message}</Text>}
                    <TouchableOpacity
                        style={styles.scanBtn}
                        onPress={openCamera}
                        accessibilityRole="button"
                        accessibilityLabel="Scanner avec la caméra"
                    >
                        <Ionicons name="barcode-outline" size={18} color="#03A9F4"/>
                        <Text style={styles.scanBtnText}>Scanner avec la caméra</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Catégorie</Text>
                    {categoryLoadError && (
                        <Text style={styles.errorText}>{categoryLoadError} — créez d'abord une catégorie.</Text>
                    )}
                    <TouchableOpacity
                        style={styles.picker}
                        onPress={() => setShowCategoryPicker(true)}
                        disabled={categories.length === 0}
                    >
                        <Text style={[styles.pickerText, !selectedCategory && styles.pickerTextMuted]}>
                            {selectedCategory?.name ?? (categories.length === 0 ? 'Aucune catégorie' : 'Choisir…')}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#9e9e9e"/>
                    </TouchableOpacity>
                    {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Seuil minimum d'alerte</Text>
                    <Controller
                        control={control}
                        name="min_quantity"
                        render={({field: {onChange, onBlur, value}}) => (
                            <TextInput
                                ref={minQuantityRef}
                                placeholder="0"
                                placeholderTextColor="#9e9e9e"
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                                submitBehavior="submit"
                                blurOnSubmit={false}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.min_quantity && <Text style={styles.errorText}>{errors.min_quantity.message}</Text>}
                </View>

                <View style={styles.fieldRow}>
                    <Text style={styles.label}>Produit actif</Text>
                    <Controller
                        control={control}
                        name="is_active"
                        render={({field: {value, onChange}}) => (
                            <Switch
                                value={value}
                                onValueChange={onChange}
                                trackColor={{true: '#03A9F4', false: '#d3d3d3'}}
                                thumbColor="#fff"
                            />
                        )}
                    />
                </View>

                {loadError && <Text style={styles.errorText}>{loadError}</Text>}
                {submitError && <Text style={styles.errorText}>{submitError}</Text>}
                {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}

                <View style={styles.modalActions}>
                    {isEdit && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={confirmDelete}
                            disabled={deleting || isSubmitting}
                            accessibilityRole="button"
                            accessibilityLabel="Supprimer ce produit"
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#ff6b6b"/>
                            ) : (
                                <Ionicons name="trash-outline" size={20} color="#ff6b6b"/>
                            )}
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => navigation.goBack()}
                        disabled={isSubmitting || deleting}
                        accessibilityRole="button"
                    >
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting || deleting}
                        accessibilityRole="button"
                    >
                        {isSubmitting || deleting ? (
                            <ActivityIndicator color="#fff"/>
                        ) : (
                            <Text style={styles.saveText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={showCamera}
                animationType="slide"
                onRequestClose={() => setShowCamera(false)}
            >
                <BarcodeScanner key={cameraSession} onScanned={handleCameraScan} onCancel={() => setShowCamera(false)}/>
            </Modal>

            <Modal
                visible={showCategoryPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerCard}>
                        <Text style={styles.pickerTitle}>Choisir une catégorie</Text>
                        <ScrollView style={styles.pickerList}>
                            {categories.map(category => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[styles.pickerRow, category.id === selectedCategoryId && styles.pickerRowSelected]}
                                    onPress={() => {
                                        setValue('category', category.id, {shouldValidate: true});
                                        setShowCategoryPicker(false);
                                        focusField(minQuantityRef, 160);
                                    }}
                                >
                                    <Text style={styles.pickerRowText}>{category.name}</Text>
                                    {category.id === selectedCategoryId && (
                                        <Ionicons name="checkmark" size={18} color="#03A9F4"/>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    content: {padding: 16, paddingBottom: 32},
    field: {marginBottom: 16, gap: 8},
    fieldRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
    label: {color: '#666', fontSize: 14},
    input: {backgroundColor: '#f5f5f5', color: '#212121', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.select({ios: 12, android: 10}) as number, borderWidth: 1, borderColor: '#e0e0e0'},
    scanBtn: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#03A9F4', backgroundColor: '#e3f2fd'},
    scanBtnText: {color: '#0277bd', fontSize: 14, fontWeight: '600'},
    picker: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.select({ios: 12, android: 10}) as number, borderWidth: 1, borderColor: '#e0e0e0'},
    pickerText: {color: '#212121', fontSize: 15},
    pickerTextMuted: {color: '#9e9e9e'},
    errorText: {color: '#ff6b6b', marginTop: 4, marginBottom: 12, fontSize: 13},
    modalActions: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 12},
    deleteBtn: {padding: 10, marginRight: 'auto'},
    cancelBtn: {paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)'},
    cancelText: {color: '#757575', fontSize: 15, fontWeight: '600'},
    saveBtn: {backgroundColor: '#03A9F4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    saveText: {color: '#fff', fontSize: 15, fontWeight: '600'},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    pickerCard: {backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20},
    pickerTitle: {fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 12},
    pickerList: {maxHeight: '50%'},
    pickerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0'},
    pickerRowSelected: {backgroundColor: '#e3f2fd'},
    pickerRowText: {color: '#212121', fontSize: 15},
});
