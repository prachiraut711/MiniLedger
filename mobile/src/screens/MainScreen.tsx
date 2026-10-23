import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Loan, Summary, RootStackParamList } from '../types';
import Colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const MainScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalLent: 0,
    totalRepaid: 0,
    overdueAmount: 0,
    outstandingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repayingId, setRepayingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch summary and loans list
  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [summaryRes, loansRes] = await Promise.all([
        api.getSummary(),
        api.getLoans(),
      ]);
      setSummary(summaryRes);
      setLoans(loansRes.loans || []);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to load data. Please ensure the backend is running.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload data when screen gains focus (e.g. after adding a loan)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRepay = async (loan: Loan) => {
    Alert.alert(
      'Confirm Repayment',
      `Mark loan of ₹${loan.amount.toLocaleString()} from ${loan.friendName} as fully repaid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Repaid',
          style: 'default',
          onPress: async () => {
            try {
              setRepayingId(loan.id);
              await api.repayLoan(loan.id);
              // Refresh both summary and loan list
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to mark loan as repaid.');
            } finally {
              setRepayingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of MiniLedger?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  // Helper to determine if an unpaid loan is overdue
  const isOverdue = (dueDateStr: string, isRepaid: boolean) => {
    if (isRepaid) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDateStr < today;
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Render top summary card
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar with user info and Logout */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcomeLabel}>Signed in as</Text>
          <Text style={styles.phoneText}>📱 {user?.phone || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Error alert banner */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Summary Card with 4 metrics */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Portfolio Summary</Text>
        <View style={styles.metricsGrid}>
          {/* Total Lent */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Lent</Text>
            <Text style={[styles.metricValue, styles.totalLentText]}>
              {formatCurrency(summary.totalLent)}
            </Text>
          </View>

          {/* Total Repaid */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Repaid</Text>
            <Text style={[styles.metricValue, styles.totalRepaidText]}>
              {formatCurrency(summary.totalRepaid)}
            </Text>
          </View>

          {/* Outstanding Amount */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={[styles.metricValue, styles.outstandingText]}>
              {formatCurrency(summary.outstandingAmount)}
            </Text>
          </View>

          {/* Overdue Amount (Highlighted in Red) */}
          <View style={[styles.metricBox, summary.overdueAmount > 0 && styles.overdueBoxHighlight]}>
            <Text style={styles.metricLabel}>Overdue</Text>
            <Text style={[styles.metricValue, styles.overdueText]}>
              {formatCurrency(summary.overdueAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Section Header & Add Loan Button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Loan Records ({loans.length})
        </Text>
        <TouchableOpacity
          style={styles.addLoanButton}
          onPress={() => navigation.navigate('AddLoan')}
          activeOpacity={0.8}
        >
          <Text style={styles.addLoanButtonText}>+ Add Loan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render individual loan card
  const renderLoanItem = ({ item }: { item: Loan }) => {
    const overdue = isOverdue(item.dueDate, item.isRepaid);
    const isRepayingThis = repayingId === item.id;

    return (
      <View
        style={[
          styles.loanCard,
          overdue && styles.loanCardOverdue,
          item.isRepaid && styles.loanCardRepaid,
        ]}
      >
        <View style={styles.loanCardHeader}>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.friendName}</Text>
            <Text style={styles.dueDateText}>
              📅 Due: {item.dueDate}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              item.isRepaid
                ? styles.badgeRepaid
                : overdue
                ? styles.badgeOverdue
                : styles.badgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.isRepaid
                  ? styles.badgeRepaidText
                  : overdue
                  ? styles.badgeOverdueText
                  : styles.badgePendingText,
              ]}
            >
              {item.isRepaid ? '✓ Repaid' : overdue ? '⚠️ Overdue' : '⏳ Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.loanCardFooter}>
          <View>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
          </View>

          {/* Repay Action Button */}
          {!item.isRepaid && (
            <TouchableOpacity
              style={[styles.repayButton, isRepayingThis && styles.buttonDisabled]}
              onPress={() => handleRepay(item)}
              disabled={isRepayingThis}
              activeOpacity={0.8}
            >
              {isRepayingThis ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={styles.repayButtonText}>Mark as Repaid</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>🤝</Text>
        </View>
        <Text style={styles.emptyTitle}>No Loan Entries Yet</Text>
        <Text style={styles.emptySubtitle}>
          Keep track of money lent to friends. Tap the "+ Add Loan" button above to record your first loan.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading loans and summary...</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLoanItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  headerContainer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  logoutBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  retryBtn: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overdueBoxHighlight: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalLentText: {
    color: Colors.primary,
  },
  totalRepaidText: {
    color: Colors.success,
  },
  outstandingText: {
    color: '#0F172A',
  },
  overdueText: {
    color: Colors.danger,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addLoanButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addLoanButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 14,
  },
  loanCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  loanCardOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1.5,
  },
  loanCardRepaid: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC',
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeRepaid: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  badgeRepaidText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeOverdue: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  badgeOverdueText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  badgePendingText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeText: {},
  loanCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  repayButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  repayButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
