import React, {createContext, useState, useContext, ReactNode, useEffect, useCallback} from 'react';
import {useColorScheme} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'preferredTheme';

export type PreferredScheme = 'system' | 'light' | 'dark';

interface ThemeContextType {
    preferred: PreferredScheme;
    /** Effective value after resolving the system scheme ('light' | 'dark') */
    colorScheme: 'light' | 'dark';
    isDark: boolean;
    setPreferred: (value: PreferredScheme) => void;
    /** Toggles dark/light (forces a value, no longer follows the system) */
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({children}: {children: ReactNode}) {
    const systemScheme = useColorScheme();
    const [preferred, setPreferredState] = useState<PreferredScheme>('system');

    // Restore the stored preference on startup
    useEffect(() => {
        SecureStore.getItemAsync(THEME_KEY).then(stored => {
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                setPreferredState(stored);
            }
        }).catch(() => {});
    }, []);

    const setPreferred = useCallback((value: PreferredScheme) => {
        setPreferredState(value);
        SecureStore.setItemAsync(THEME_KEY, value).catch(() => {});
    }, []);

    const colorScheme: 'light' | 'dark' =
        preferred === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preferred;

    const toggle = useCallback(() => {
        const next = colorScheme === 'dark' ? 'light' : 'dark';
        setPreferred(next);
    }, [colorScheme, setPreferred]);

    return (
        <ThemeContext.Provider value={{
            preferred,
            colorScheme,
            isDark: colorScheme === 'dark',
            setPreferred,
            toggle,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
