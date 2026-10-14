import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import type {AppStackParamList} from '../../../navigation';
import {MovementKind} from '../../../types/movement';

export function MovementScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const insets = useSafeAreaInsets();

    const openForm = (kind: MovementKind) => {
        navigation.navigate('MovementForm', {kind});
    };

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <View style={styles.header}>
                <Ionicons name="swap-horizontal" size={40} color="#03A9F4"/>
                <Text style={styles.title}>Mouvement de stock</Text>
                <Text style={styles.subtitle}>Ajoutez ou prélevez du stock en scannant un code-barres.</Text>
            </View>

            <View style={styles.actionCard}>
                <TouchableOpacity
                    style={[styles.bigBtn, styles.bigBtnIn]}
                    onPress={() => openForm('in')}
                    accessibilityRole="button"
                    accessibilityLabel="Ajouter du stock (entrée)"
                >
                    <Ionicons name="add-circle" size={32} color="#fff"/>
                    <View style={styles.bigBtnTextWrap}>
                        <Text style={styles.bigBtnTitle}>Ajouter (Entrée)</Text>
                        <Text style={styles.bigBtnSub}>Réceptionner du stock</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)"/>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.bigBtn, styles.bigBtnOut]}
                    onPress={() => openForm('out')}
                    accessibilityRole="button"
                    accessibilityLabel="Prélever du stock (sortie)"
                >
                    <Ionicons name="remove-circle" size={32} color="#fff"/>
                    <View style={styles.bigBtnTextWrap}>
                        <Text style={styles.bigBtnTitle}>Prélever (Sortie)</Text>
                        <Text style={styles.bigBtnSub}>Sortir du stock</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)"/>
                </TouchableOpacity>
            </View>

            <View style={styles.hintCard}>
                <Ionicons name="barcode-outline" size={18} color="#1565c0"/>
                <Text style={styles.hintText}>
                    Astuce : scannez le code-barres avec la caméra ou avec un lecteur USB branché sur l'appareil.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff', padding: 16, gap: 16},
    header: {alignItems: 'center', paddingTop: 8, gap: 4},
    title: {fontSize: 22, fontWeight: 'bold', color: '#212121'},
    subtitle: {color: '#757575', fontSize: 14, textAlign: 'center'},
    actionCard: {padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 12},
    bigBtn: {flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 14, gap: 12},
    bigBtnIn: {backgroundColor: '#43a047'},
    bigBtnOut: {backgroundColor: '#e53935'},
    bigBtnTextWrap: {flex: 1, gap: 2},
    bigBtnTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
    bigBtnSub: {color: 'rgba(255,255,255,0.85)', fontSize: 13},
    hintCard: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#e3f2fd', borderRadius: 12},
    hintText: {color: '#1565c0', fontSize: 13, flex: 1},
});
