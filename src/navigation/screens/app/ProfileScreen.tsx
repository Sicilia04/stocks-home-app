import {Text} from '@react-navigation/elements';
import {StyleSheet, View, Alert, TouchableOpacity, ScrollView, Switch} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from "../../../context/AuthContext";
import {useTheme} from "../../../context/ThemeContext";
import React from "react";

const formatDate = (iso: string | null) => {
    if (!iso) return 'Jamais';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
};

const getInitials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join('');

export default function ProfileScreen() {
    const {user, logout} = useAuth();
    const {isDark, toggle} = useTheme();
    const insets = useSafeAreaInsets();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

    if (!user) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center', paddingTop: insets.top}]}>
                <Text style={styles.infoLabel}>Aucun utilisateur connecté</Text>
            </View>
        );
    }

    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email || `Utilisateur #${user.id}`;
    const initials = getInitials(fullName);

    const handleLogout = async () => {
        try {
            await logout();
            Alert.alert('Déconnexion', 'Vous avez été déconnecté avec succès.');
        } catch (e) {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Avatar et infos */}
            <View style={[styles.avatarContainer, {paddingTop: insets.top + 16}]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.name}>{fullName}</Text>
                <Text style={styles.memberSince}>Membre depuis le {new Date(user.date_joined).toLocaleDateString('fr-FR')}</Text>
            </View>

            {/* Infos personnelles */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations personnelles</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Adresse e-mail</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dernière connexion</Text>
                    <Text style={styles.infoValue}>{formatDate(user.last_login)}</Text>
                </View>
            </View>

            {/* Préférences */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Préférences</Text>
                <View style={styles.preferenceRow}>
                    <Text style={styles.prefLabel}>Notifications</Text>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                </View>
                <View style={styles.preferenceRow}>
                    <Text style={styles.prefLabel}>Themes</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggle}
                    />
                </View>
            </View>

            {/* Paramètres */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paramètres</Text>
                <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
                    <Text style={styles.settingText}>Déconnexion</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    avatarContainer: {alignItems: 'center', paddingVertical: 24, backgroundColor: '#03A9F4'},
    avatar: {width: 96, height: 96, borderRadius: 48, marginBottom: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center'},
    avatarText: {color: '#fff', fontSize: 36, fontWeight: '700'},
    name: {fontSize: 22, fontWeight: '700', color: '#222'},
    memberSince: {color: '#888', marginTop: 2, marginBottom: 8, fontSize: 14},
    section: {marginHorizontal: 24, marginVertical: 12},
    sectionTitle: {fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 10,},
    infoRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
    infoLabel: {color: '#666'},
    infoValue: {color: '#222'},
    preferenceRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6},
    prefLabel: {color: '#666'},
    prefValue: {color: '#222'},
    settingRow: {paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee'},
    settingText: {color: '#222', fontWeight: '500', fontSize: 15},
});
