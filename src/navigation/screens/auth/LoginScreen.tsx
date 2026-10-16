import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from "../../../context/AuthContext";
import {User} from "../../../types/user";
import {getToken} from "../../../api/auth";
import {getMe} from "../../../api/user";
import styles from "../../../assets/styles/LoginScreen.styles";

const schema = z.object({
    username: z.string({message: "Nom d'utilisateur invalide"}),
    password: z.string().min(6, {message: 'Au moins 6 caractères'}),
});

export default function LoginScreen() {
    const navigation = useNavigation();
    const {control, handleSubmit, formState: {errors}} = useForm({
        resolver: zodResolver(schema),
        defaultValues: {username: '', password: ''},
    });
    const {login, applyToken, authError, clearError} = useAuth();
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();


    // As soon as an error appears in the context, surface it in an Alert
    useEffect(() => {
        if (authError) {
            Alert.alert('Erreur', authError, [
                {text: 'OK', onPress: () => clearError()}
            ]);
        }
    }, [authError]);

    const onSubmit = async (form: { username: string, password: string }) => {
        try {
            setLoading(true);
            // Call the Django backend API to obtain the JWT token
            const {data} = await getToken(form.username, form.password)
            // Persist the token BEFORE the authenticated call below (the interceptor reads it from SecureStore)
            await applyToken(String(data.access), data.refresh);
            // Call the API to fetch the user information
            const response = await getMe();

            if (!response.data) {
                Alert.alert(response.statusText || 'Erreur inconnue');
            }
            const user: User = response.data;

            login(String(data.access), user);
            Alert.alert('Succès', 'Connexion réussie');

        } catch  {
            Alert.alert('Erreur de connexion', 'Impossible de se connecter');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.container, {paddingTop: insets.top}]}>
                <Text style={styles.title}>Connexion</Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Username</Text>
                    <Controller
                        control={control}
                        name="username"
                        render={({field: {onChange, onBlur, value}}) => (
                            <TextInput
                                placeholder="nom"
                                placeholderTextColor={styles.placeholder.color}
                                autoCapitalize="none"
                                 keyboardType="default"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <Controller
                        control={control}
                        name="password"
                        render={({field: {onChange, onBlur, value}}) => (
                            <TextInput
                                placeholder="Votre mot de passe"
                                placeholderTextColor={styles.placeholder.color}
                                secureTextEntry
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit(onSubmit)} disabled={loading}>
                    {loading ? <ActivityIndicator color="#111"/> : <Text style={styles.primaryText}>Se connecter</Text>}
                </TouchableOpacity>

            </View>
        </KeyboardAvoidingView>
    );
}