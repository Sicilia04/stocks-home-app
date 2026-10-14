import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
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
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {getCategory, createCategory, updateCategory, deleteCategory} from '../../../api/category';
import type {AppStackParamList} from '../../../navigation';

const schema = z.object({
    name: z.string().trim().min(1, {message: 'Le nom de la catégorie est requis.'}),
});

type FormValues = z.infer<typeof schema>;

export type CategoryFormRouteProps = {
    categoryId?: number;
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

export function CategoryFormScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'CategoryForm'>>();
    const route = useRoute();
    const categoryId = (route.params as CategoryFormRouteProps | undefined)?.categoryId;
    const isEdit = categoryId != null;

    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [existingName, setExistingName] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: {errors, isSubmitting},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {name: ''},
    });

    useEffect(() => {
        if (!isEdit) return;
        let cancelled = false;
        (async () => {
            try {
                const {data} = await getCategory(categoryId);
                if (cancelled) return;
                setExistingName(data.name);
                reset({name: data.name});
            } catch (err) {
                if (!cancelled) setLoadError(getErrorMessage(err));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isEdit, categoryId, reset]);

    const title = useMemo(
        () => (isEdit ? (existingName ?? `Catégorie #${categoryId}`) : 'Nouvelle catégorie'),
        [isEdit, existingName, categoryId],
    );

    const onSubmit = async (values: FormValues) => {
        setDeleteError(null);
        if (isEdit) {
            await updateCategory(categoryId, {name: values.name});
        } else {
            await createCategory({name: values.name});
        }
        navigation.goBack();
    };

    const confirmDelete = () => {
        if (categoryId == null) return;
        Alert.alert('Supprimer la catégorie', `Supprimer « ${title} » ? Cette action est irréversible.`, [
            {text: 'Annuler', style: 'cancel'},
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    setBusy(true);
                    try {
                        await deleteCategory(categoryId);
                        navigation.goBack();
                    } catch (err) {
                        setDeleteError(getErrorMessage(err));
                    } finally {
                        setBusy(false);
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
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
                                autoFocus={!isEdit}
                                placeholder="Ex. Fruits"
                                placeholderTextColor="#9e9e9e"
                                autoCapitalize="words"
                                autoCorrect={false}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                style={styles.input}
                                onSubmitEditing={() => handleSubmit(onSubmit)()}
                            />
                        )}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>

                {loadError && <Text style={styles.errorText}>{loadError}</Text>}
                {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}

                <View style={styles.modalActions}>
                    {isEdit && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={confirmDelete}
                            disabled={busy}
                            accessibilityRole="button"
                            accessibilityLabel="Supprimer cette catégorie"
                        >
                            {busy ? (
                                <ActivityIndicator size="small" color="#ff6b6b"/>
                            ) : (
                                <Ionicons name="trash-outline" size={20} color="#ff6b6b"/>
                            )}
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => navigation.goBack()}
                        disabled={isSubmitting || busy}
                        accessibilityRole="button"
                    >
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting || busy}
                        accessibilityRole="button"
                    >
                        {isSubmitting || busy ? (
                            <ActivityIndicator color="#fff"/>
                        ) : (
                            <Text style={styles.saveText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    content: {padding: 16, paddingBottom: 32},
    field: {marginBottom: 16, gap: 8},
    label: {color: '#666', fontSize: 14},
    input: {backgroundColor: '#f5f5f5', color: '#212121', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.select({ios: 12, android: 10}) as number, borderWidth: 1, borderColor: '#e0e0e0'},
    errorText: {color: '#ff6b6b', marginTop: 4, fontSize: 13},
    modalActions: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 12},
    deleteBtn: {padding: 10, marginRight: 'auto'},
    cancelBtn: {paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)'},
    cancelText: {color: '#757575', fontSize: 15, fontWeight: '600'},
    saveBtn: {backgroundColor: '#03A9F4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    saveText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});
