import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../theme/colors';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  disabled?: boolean;
}

export const formatReadableDate = (isoDateStr: string): string => {
  if (!isoDateStr) return 'Select Due Date';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
  } catch (_) {}
  return isoDateStr;
};

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const readable = formatReadableDate(value);

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      if (inputRef.current && typeof (inputRef.current as any).showPicker === 'function') {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current?.focus();
        inputRef.current?.click();
      }
    } catch (_) {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Tap-able Select Due Date button */}
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.disabled]}
        onPress={handleOpenPicker}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.readableText}>📅 {readable || 'Select Due Date'}</Text>
        <Text style={styles.actionText}>Change Date</Text>
      </TouchableOpacity>

      {/* Hidden/Native Web HTML5 Date Picker for browser compatibility */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e: any) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          bottom: 0,
          left: 0,
          width: '1px',
          height: '1px',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  pickerButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readableText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  actionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default DatePicker;
