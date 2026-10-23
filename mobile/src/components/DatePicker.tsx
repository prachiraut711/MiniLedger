import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

const parseDateString = (isoStr: string): Date => {
  if (!isoStr) return new Date();
  const parts = isoStr.split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);
  const readable = formatReadableDate(value);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.disabled]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.readableText}>📅 {readable || 'Select Due Date'}</Text>
        <Text style={styles.actionText}>Select Date</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={parseDateString(value)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
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
