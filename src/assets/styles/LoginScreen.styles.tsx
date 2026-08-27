import { StyleSheet, Platform } from "react-native";
import { COLORS, SIZES } from "./variables";
import globalStyle from "./global"; // si besoin

export default StyleSheet.create({
    ...globalStyle,
    field: {marginBottom: 16},
    label: {color: COLORS.textPrimary, marginBottom: 8},
    input: {
        backgroundColor: COLORS.secondary,
        color: COLORS.textPrimary,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: Platform.select({ios: 14, android: 10}),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    placeholder: {color: COLORS.mutedBlack},
    error: {color: '#ff6b6b', marginTop: 6},

});