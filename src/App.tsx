import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Assets as NavigationAssets} from '@react-navigation/elements';
import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {Asset} from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import {Navigation} from './navigation';
import {AuthProvider} from "./context/AuthContext";
import {ThemeProvider, useTheme} from "./context/ThemeContext";

Asset.loadAsync([
    ...NavigationAssets,
    require('./assets/newspaper.png'),
    require('./assets/bell.png'),
]);

SplashScreen.preventAutoHideAsync();

function AppInner() {
    const {colorScheme} = useTheme();

    const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <Navigation
                    theme={theme}
                    linking={{
                        enabled: true,
                        prefixes: [
                            // Change the scheme to match your app's scheme defined in app.json
                            'stockshome://',
                        ],
                    }}
                    onReady={() => {
                        SplashScreen.hideAsync();
                    }}
                />
            </AuthProvider>
        </SafeAreaProvider>
    );
}

export function App() {
    return (
        <ThemeProvider>
            <AppInner/>
        </ThemeProvider>
    );
}
