// components/form/DateField.tsx
import React, { useState, memo } from 'react';
import { View, Pressable, Text } from 'react-native';
import DatePicker from 'react-native-date-picker';

export type DateFieldProps = {
  value?: string;                // stored as 'YYYY-MM-DD'
  onChange: (v: string) => void; // expects 'YYYY-MM-DD'
  placeholder?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
};

function toYYYYMMDD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYYYYMMDD(value?: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

export const DateField = memo(function DateField({
  value,
  onChange,
  placeholder = 'Birthdate (YYYY-MM-DD)',
  error,
  minDate,
  maxDate,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseYYYYMMDD(value) ?? new Date();

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: error ? '#dc2626' : '#ddd',
          borderRadius: 8,
          padding: 12,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: value ? '#111' : '#999' }}>
          {value || placeholder}
        </Text>
      </Pressable>

      <DatePicker
        modal
        mode="date"
        open={open}
        date={selected}
        minimumDate={minDate}
        maximumDate={maxDate}
        onConfirm={(date) => {
          setOpen(false);
          onChange(toYYYYMMDD(date));
        }}
        onCancel={() => setOpen(false)}
      />

      {error ? <Text style={{ color: '#dc2626', fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
});
