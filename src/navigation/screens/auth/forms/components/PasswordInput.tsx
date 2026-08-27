// components/form/PasswordInput.tsx
import React, {useState, memo} from 'react';
import {View, TextInput, Text, Pressable} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

export type PasswordInputProps = {
    value?: string;
    onChangeText: (v: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    label?: string;
    testID?: string;
};

export const PasswordInput = memo(function PasswordInput({
                                                             value,
                                                             onChangeText,
                                                             onBlur,
                                                             placeholder = 'Password',
                                                             error,
                                                             disabled = false,
                                                             label,
                                                             testID,
                                                         }: PasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={{gap: 6}}>
            {label ? <Text style={{color: '#111', fontWeight: '500'}}>{label}</Text> : null}

            <View
                style={{
                    borderWidth: 1,
                    borderColor: error ? '#dc2626' : '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <TextInput
                    testID={testID}
                    style={{flex: 1, paddingVertical: 10}}
                    placeholder={placeholder}
                    value={value ?? ''}
                    onChangeText={onChangeText}
                    onBlur={onBlur}
                    secureTextEntry={!visible}
                    editable={!disabled}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                />

                <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} style={{padding: 4}}>
                    <MaterialCommunityIcons
                        name={visible ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#444"
                    />
                </Pressable>
            </View>

            {error ? <Text style={{color: '#dc2626', fontSize: 12}}>{error}</Text> : null}
        </View>
    );
});
