import { StyleSheet, Platform } from "react-native";
import { COLORS, SIZES } from "./variables";
import globalStyle from "./global"; // si besoin

export default StyleSheet.create({
    ...globalStyle,
    container: {
        ...globalStyle.container,
        padding: 0,
        backgroundColor: "black",
    },
    topContent: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 150,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 50,
    },
    title: {
        fontSize: 40,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 24,
    },
});