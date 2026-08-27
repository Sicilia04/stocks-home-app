import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../AuthNavigator';
import styles from "../../../assets/styles/WelcomeScreen.styles";

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({navigation}: Props) {


    return (
        <View style={styles.container}>
            <View style={styles.overlay}/>
            <View style={styles.topContent}>
                <Text style={styles.title}>Stocks Home</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Bienvenue</Text>
                <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.primaryText}>Se connecter</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}