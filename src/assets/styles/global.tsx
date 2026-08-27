import {StyleSheet} from "react-native";
import {COLORS, SIZES} from "./variables";

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: SIZES.paddingVertical,
        paddingHorizontal: SIZES.paddingHorizontal,
        // backgroundColor: COLORS.text,
    },
    title: {
        color: COLORS.primary,
        fontSize: SIZES.title,
        fontWeight: "700",
        marginBottom: 24,
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.35)', // sombre pour le contraste
    },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryBtn: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    link: {color: COLORS.textSecondary, marginTop: 18, fontWeight: '600'},
    linkMuted: {color: COLORS.mutedBlack, marginTop: 8},
    // Ajoute ici tous les styles communs à plusieurs écrans
});
