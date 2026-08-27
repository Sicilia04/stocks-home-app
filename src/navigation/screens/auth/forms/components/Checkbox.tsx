// forms/components/Checkbox.tsx
import React, {memo} from 'react';
import {Pressable, View, Text} from 'react-native';

export type CheckboxProps = {
    checked: boolean;
    onChange: (next: boolean) => void;
    label?: string;
    error?: string;
    disabled?: boolean;
    size?: number;        // taille du carré
};

export const Checkbox = memo(function Checkbox({
                                                   checked,
                                                   onChange,
                                                   label,
                                                   error,
                                                   disabled = false,
                                                   size = 20,
                                               }: CheckboxProps) {
    const borderColor = error ? '#dc2626' : '#666';
    const bgColor = checked ? (disabled ? '#999' : '#111') : 'transparent';
    const textColor = disabled ? '#999' : '#111';

    const toggle = () => {
        if (disabled) return;
        onChange(!checked);
    };

    return (
        <Pressable
            onPress={toggle}
            style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 8}}
            accessibilityRole="checkbox"
            accessibilityState={{checked, disabled}}
        >
            <View
                style={{
                    width: size,
                    height: size,
                    borderWidth: 1,
                    borderColor,
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    marginRight: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Optionnel: petit tick visuel */}
                {checked ? (
                    <View
                        style={{
                            width: size * 0.6,
                            height: size * 0.6,
                            borderRadius: 2,
                            backgroundColor: 'white',
                            opacity: 0.0, // mettre 0.0 si on veut un carré plein; sinon implémenter une icône/tick si besoin
                        }}
                    />
                ) : null}
            </View>

            {label ? <Text style={{color: textColor, flexShrink: 1}}>{label}</Text> : null}

            {error ? <Text style={{color: '#dc2626', fontSize: 12, marginLeft: 8}}>{error}</Text> : null}
        </Pressable>
    );
});
