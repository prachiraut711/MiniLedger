import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, DEFAULT_PHYSICAL_IP, DEFAULT_PORT } from '../api/config';
import Colors from '../theme/colors';

export const LoginScreen = () => {
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Subtle API URL config
  const [apiUrl, setApiUrlState] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setApiUrlState);
  }, []);

  const handleSendOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMessage('Please enter your phone number.');
      return;
    }

    if (trimmedPhone.length < 7) {
      setErrorMessage('Phone number must have at least 7 digits.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await api.sendOtp(trimmedPhone);
      setOtpSent(true);
      setSuccessMessage('OTP sent. Check the backend terminal for your OTP.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setErrorMessage('Please enter the OTP code.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await api.verifyOtp(phone.trim(), trimmedOtp);
      await login(response.token, response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = async () => {
    try {
      await setApiBaseUrl(apiUrl);
      setShowConfig(false);
    } catch (err: any) {
      setErrorMessage('Failed to save API URL.');
    }
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
          <Text style={styles.appTitle}>MiniLedger</Text>
          <Text style={styles.appSubtitle}>Track money lent to friends.</Text>

          {/* Status Messages */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Phone Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!loading && !otpSent}
              autoFocus={!otpSent}
            />
          </View>

          {/* Send OTP button (hidden once OTP requested) */}
          {!otpSent ? (
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textLight} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          ) : (
            /* OTP Field and Verify Button (Shown only after OTP requested) */
            <View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="6-digit OTP"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!loading}
                  autoFocus
                />
                <Text style={styles.helperText}>
                  Check the backend terminal for your OTP.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textLight} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changePhoneButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                disabled={loading}
              >
                <Text style={styles.changePhoneText}>Change phone number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Subtle API URL Toggle for development */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Text style={styles.configToggleText}>
              API: {apiUrl || 'loading...'} {showConfig ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBox}>
              <TextInput
                style={styles.configInput}
                value={apiUrl}
                onChangeText={setApiUrlState}
                autoCapitalize="none"
              />
              <View style={styles.configActions}>
                <TouchableOpacity
                  style={styles.configBtn}
                  onPress={handleSaveApiUrl}
                >
                  <Text style={styles.configBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.configBtn}
                  onPress={async () => {
                    const defaultUrl = await resetApiBaseUrl();
                    setApiUrlState(defaultUrl);
                  }}
                >
                  <Text style={styles.configBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.configBtn}
                  onPress={async () => {
                    const wifiUrl = `http://${DEFAULT_PHYSICAL_IP}:${DEFAULT_PORT}/api`;
                    setApiUrlState(wifiUrl);
                    await setApiBaseUrl(wifiUrl);
                  }}
                >
                  <Text style={styles.configBtnText}>Wi-Fi IP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
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
  otpInput: {
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  changePhoneButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 4,
  },
  changePhoneText: {
    color: Colors.primary,
    fontSize: 13,
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
  successBox: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
  },
  configToggle: {
    marginTop: 20,
    alignItems: 'center',
  },
  configToggleText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  configBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 6,
  },
  configInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginBottom: 8,
  },
  configActions: {
    flexDirection: 'row',
    gap: 8,
  },
  configBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  configBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
