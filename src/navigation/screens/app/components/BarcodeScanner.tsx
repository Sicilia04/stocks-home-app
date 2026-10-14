import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {CameraView, useCameraPermissions} from 'expo-camera';

export type ScannerFeedback = {kind: 'success' | 'error'; text: string} | null;

const SAME_CODE_COOLDOWN_MS = 3000;
const DIFF_CODE_COOLDOWN_MS = 500;

export default function BarcodeScanner({
    onScanned,
    onCancel,
    continuous = false,
    feedback = null,
}: {
    onScanned: (ean: string) => void;
    onCancel?: () => void;
    continuous?: boolean;
    feedback?: ScannerFeedback;
}) {
    const [permission, requestPermission] = useCameraPermissions();
    const captured = useRef(false);
    const lastScanAt = useRef(0);
    const lastCode = useRef<string | null>(null);
    const [cooldownLeftMs, setCooldownLeftMs] = useState(0);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (cooldownLeftMs <= 0) return undefined;
        const id = setTimeout(() => setCooldownLeftMs(ms => Math.max(0, ms - 100)), 100);
        return () => clearTimeout(id);
    }, [cooldownLeftMs]);

    if (!permission) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#03A9F4"/>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Ionicons name="camera-outline" size={48} color="#757575"/>
                <Text style={styles.permissionText}>
                    L'accès à la caméra est nécessaire pour scanner un code-barres.
                </Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
                </TouchableOpacity>
                {onCancel && (
                    <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
                        <Text style={styles.closeText}>Fermer</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                active={!captured.current}
                onCameraReady={() => setReady(true)}
                onMountError={() => setReady(false)}
                onBarcodeScanned={result => {
                    const data = (result?.data ?? '').trim();
                    if (!data) return;
                    if (captured.current) return;
                    const now = Date.now();
                    if (continuous) {
                        // Anti-répétition : scanner le même code à répétition est inutile.
                        const cooldown = lastCode.current === data ? SAME_CODE_COOLDOWN_MS : DIFF_CODE_COOLDOWN_MS;
                        const elapsed = now - lastScanAt.current;
                        if (elapsed < cooldown) {
                            setCooldownLeftMs(Math.max(cooldown - elapsed, 100));
                            return;
                        }
                    }
                    setCooldownLeftMs(0);
                    captured.current = true;
                    lastScanAt.current = now;
                    lastCode.current = data;
                    setTimeout(() => {
                        onScanned(data);
                        if (continuous) captured.current = false;
                    }, 250);
                }}
            />
            {!ready && (
                <View style={styles.readyOverlay}>
                    <ActivityIndicator size="large" color="#fff"/>
                    <Text style={styles.readyText}>Démarrage de la caméra…</Text>
                </View>
            )}
            <View style={styles.viewfinderWrap} pointerEvents="none">
                <View style={styles.viewfinderBox}/>
                <Text style={styles.hint}>Pointez la camera sur le code-barres</Text>
                {continuous && cooldownLeftMs > 0 ? (
                    <Text style={styles.cooldownText}>
                        Re-scannable dans {Math.ceil(cooldownLeftMs / 1000)} s
                    </Text>
                ) : null}
            </View>
            {feedback ? (
                <View style={[styles.feedbackBanner, feedback.kind === 'success' ? styles.feedbackBannerSuccess : styles.feedbackBannerError]}>
                    <Ionicons
                        name={feedback.kind === 'success' ? 'checkmark-circle' : 'close-circle'}
                        size={22}
                        color={feedback.kind === 'success' ? '#2e7d32' : '#c62828'}
                    />
                    <Text style={[styles.feedbackText, feedback.kind === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError]}>
                        {feedback.text}
                    </Text>
                </View>
            ) : null}
            <TouchableOpacity style={styles.closeBtnAbs} onPress={onCancel} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={26} color="#fff"/>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#000'},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff', gap: 16},
    permissionText: {color: '#757575', fontSize: 15, textAlign: 'center'},
    permissionBtn: {backgroundColor: '#03A9F4', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center'},
    permissionBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
    viewfinderWrap: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewfinderBox: {width: 260, height: 160, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 14},
    hint: {color: '#fff', fontSize: 13, marginTop: 24, opacity: 0.95},
    cooldownText: {color: '#ffca28', fontSize: 13, marginTop: 8, fontWeight: '600'},
    readyOverlay: {flex: 1, position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 12},
    readyText: {color: '#fff', fontSize: 15},
    closeBtnAbs: {position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
    feedbackBanner: {position: 'absolute', left: 16, right: 16, bottom: 80, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1},
    feedbackBannerSuccess: {backgroundColor: 'rgba(232,245,233,0.97)', borderColor: '#a5d6a7'},
    feedbackBannerError: {backgroundColor: 'rgba(255,235,238,0.97)', borderColor: '#ef9a9a'},
    feedbackText: {flex: 1, fontSize: 15, fontWeight: '600'},
    feedbackTextSuccess: {color: '#1b5e20'},
    feedbackTextError: {color: '#c62828'},
    closeBtn: {marginTop: 8, paddingVertical: 8, paddingHorizontal: 16},
    closeText: {color: '#757575', fontSize: 14},
});
