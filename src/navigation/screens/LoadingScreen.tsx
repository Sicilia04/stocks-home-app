import React from "react";
import {ActivityIndicator, StyleSheet, useColorScheme, View} from "react-native";

export default function LoadingScreen() {
    const colorScheme = useColorScheme();
    const dark = colorScheme === 'dark';

    return (
        <View style={[styles.container, {backgroundColor: dark ? '#000' : '#fff'}]}>
            <ActivityIndicator size="large" color={dark ? '#fff' : '#111'}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
