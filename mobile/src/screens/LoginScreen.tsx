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

  // API URL config modal/toggle
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
      const response = await api.sendOtp(trimmedPhone);
      setOtpSent(true);
      setSuccessMessage(
        response.message || 'OTP sent! Please check your backend terminal console for the 6-digit code.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setErrorMessage('Please enter the 6-digit OTP code.');
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
      setSuccessMessage(`API URL updated to: ${apiUrl}`);
      setShowConfig(false);
    } catch (err: any) {
      setErrorMessage('Failed to save API URL.');
    }
  };

  const handleUsePhysicalIp = async () => {
    const newUrl = `http://${DEFAULT_PHYSICAL_IP}:${DEFAULT_PORT}/api`;
    setApiUrlState(newUrl);
    await setApiBaseUrl(newUrl);
    setSuccessMessage(`Switched to Physical Phone IP: ${newUrl}`);
  };

  const handleResetApiUrl = async () => {
    const defaultUrl = await resetApiBaseUrl();
    setApiUrlState(defaultUrl);
    setSuccessMessage(`Reset to default Emulator URL: ${defaultUrl}`);
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
        {/* App Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>ML</Text>
          </View>
          <Text style={styles.appTitle}>MiniLedger</Text>
          <Text style={styles.appSubtitle}>Track money lent to friends with ease</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {otpSent ? 'Verify OTP Code' : 'Sign In with Phone'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {otpSent
              ? `Enter the 6-digit code sent for ${phone}`
              : 'Enter your phone number to receive a one-time passcode.'}
          </Text>

          {/* Error Message Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Success Message Banner */}
          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Developer Notice for mock OTP */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoTitle}>💡 Mock OTP Flow</Text>
            <Text style={styles.infoText}>
              In this development environment, the 6-digit OTP code is printed directly in your{' '}
              <Text style={styles.boldText}>backend terminal</Text>.
            </Text>
          </View>

          {!otpSent ? (
            // Phone Input Section
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210 or +919876543210"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                editable={!loading}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textLight} />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // OTP Input Section
            <View style={styles.formGroup}>
              <Text style={styles.label}>6-Digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
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

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textLight} />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                  setErrorMessage(null);
                }}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>← Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* API Host Configuration Toggle */}
        <View style={styles.configContainer}>
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Text style={styles.configToggleText}>
              ⚙️ API Base URL: <Text style={styles.boldText}>{apiUrl || 'Loading...'}</Text>{' '}
              {showConfig ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>Configure API Endpoint:</Text>
              <TextInput
                style={styles.configInput}
                value={apiUrl}
                onChangeText={setApiUrlState}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.configActions}>
                <TouchableOpacity
                  style={styles.configSaveBtn}
                  onPress={handleSaveApiUrl}
                >
                  <Text style={styles.configSaveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.configPresetBtn}
                  onPress={handleUsePhysicalIp}
                >
                  <Text style={styles.configPresetBtnText}>Use Wi-Fi IP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.configPresetBtn}
                  onPress={handleResetApiUrl}
                >
                  <Text style={styles.configPresetBtnText}>Emulator Default</Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoBadgeText: {
    color: Colors.textLight,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 20,
  },
  formGroup: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  successBanner: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  infoBanner: {
    backgroundColor: Colors.infoBg,
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoTitle: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: '#0C4A6E',
    fontSize: 13,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  configContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  configToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  configToggleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  configBox: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  configInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  configActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  configSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  configSaveBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  configPresetBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  configPresetBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
