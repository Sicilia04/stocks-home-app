import React, {useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {CameraView, useCameraPermissions} from 'expo-camera';

export default function BarcodeScanner({
    onScanned,
    onCancel,
}: {
    onScanned: (ean: string) => void;
    onCancel?: () => void;
}) {
    const [permission, requestPermission] = useCameraPermissions();
    const captured = useRef(false);
    const [ready, setReady] = useState(false);

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
                    if (captured.current) return;
                    const data = (result?.data ?? '').trim();
                    if (!data) return;
                    captured.current = true;
                    setTimeout(() => onScanned(data), 250);
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
            </View>
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
    readyOverlay: {flex: 1, position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 12},
    readyText: {color: '#fff', fontSize: 15},
    closeBtnAbs: {position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
    closeBtn: {marginTop: 8, paddingVertical: 8, paddingHorizontal: 16},
    closeText: {color: '#757575', fontSize: 14},
});
