import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import Colors from '../theme/colors';

export const AddLoanScreen = () => {
  const navigation = useNavigation();

  // Helper for default due date (1 week from today)
  const getDefaultDueDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref lock to guarantee single submission even if rapid clicks occur
  const isSubmittingRef = useRef(false);

  const validate = (): boolean => {
    if (!friendName.trim()) {
      setErrorMessage('Please enter a friend name.');
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return false;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dueDate.trim())) {
      setErrorMessage('Due date must be in YYYY-MM-DD format.');
      return false;
    }

    const testDate = new Date(dueDate.trim());
    if (isNaN(testDate.getTime())) {
      setErrorMessage('Due date is not a valid date.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleSaveLoan = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.createLoan({
        friendName: friendName.trim(),
        amount: parseFloat(amount),
        dueDate: dueDate.trim(),
      });

      // On success, close form and return to dashboard
      navigation.goBack();
    } catch (err: any) {
      // Do not close form on failure; display error message
      setErrorMessage(err.message || 'Failed to save loan. Please try again.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Add Loan</Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Friend Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Friend Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul"
              placeholderTextColor={Colors.textMuted}
              value={friendName}
              onChangeText={(text) => {
                setFriendName(text);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!isSubmitting}
              autoFocus
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!isSubmitting}
            />
          </View>

          {/* Due Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              value={dueDate}
              onChangeText={(text) => {
                setDueDate(text);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!isSubmitting}
            />
          </View>

          {/* Buttons: Save Loan & Cancel */}
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSaveLoan}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.textLight} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Loan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
