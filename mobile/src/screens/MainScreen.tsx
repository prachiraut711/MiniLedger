import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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

  // Prevent opening AddLoan screen multiple times on rapid clicks
  const isNavigatingRef = useRef(false);

  // Fetch summary and loans list from backend
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
      console.error('Error fetching dashboard data:', err);
      setErrorMessage(
        err.message || 'Failed to load data. Please ensure the backend is running.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload data whenever screen regains focus (e.g. after adding a loan)
  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAddLoan = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigation.navigate('AddLoan');
  };

  const handleRepay = async (loanId: number) => {
    if (repayingId !== null) return;

    try {
      setRepayingId(loanId);
      setErrorMessage(null);
      await api.repayLoan(loanId);
      // Immediately refresh both summary and loan list from backend
      await loadData();
    } catch (err: any) {
      console.error('Repay error:', err);
      setErrorMessage(err.message || 'Failed to mark loan as repaid.');
    } finally {
      setRepayingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isOverdue = (dueDateStr: string, isRepaid: boolean) => {
    if (isRepaid) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDateStr < today;
  };

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar with title, user, and action buttons */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appHeading}>MiniLedger</Text>
          <Text style={styles.userSubtitle}>
            {user?.phone ? `Logged in: ${user.phone}` : 'Dashboard'}
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.addLoanHeaderBtn}
            onPress={handleOpenAddLoan}
            activeOpacity={0.8}
          >
            <Text style={styles.addLoanHeaderBtnText}>+ Add Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutHeaderBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutHeaderBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Summary Card (4 values) */}
      <View style={styles.summaryCard}>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Lent</Text>
            <Text style={[styles.metricValue, { color: Colors.primary }]}>
              {formatCurrency(summary.totalLent)}
            </Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Repaid</Text>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              {formatCurrency(summary.totalRepaid)}
            </Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={[styles.metricValue, { color: Colors.textPrimary }]}>
              {formatCurrency(summary.outstandingAmount)}
            </Text>
          </View>

          <View
            style={[
              styles.metricBox,
              summary.overdueAmount > 0 && styles.overdueHighlightBox,
            ]}
          >
            <Text style={styles.metricLabel}>Overdue</Text>
            <Text style={[styles.metricValue, { color: Colors.danger }]}>
              {formatCurrency(summary.overdueAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Loans Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Loans ({loans.length})</Text>
      </View>
    </View>
  );

  const renderLoanItem = ({ item }: { item: Loan }) => {
    const overdue = isOverdue(item.dueDate, item.isRepaid);
    const isRepaying = repayingId === item.id;

    return (
      <View
        style={[
          styles.loanCard,
          item.isRepaid && styles.loanCardRepaid,
          overdue && styles.loanCardOverdue,
        ]}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardDetails}>
            <Text style={styles.friendName}>{item.friendName}</Text>
            <Text style={styles.loanAmount}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.dueDateText}>Due: {item.dueDate}</Text>
          </View>

          <View style={styles.cardStatusArea}>
            {/* Status indicator */}
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
                  styles.statusText,
                  item.isRepaid
                    ? styles.statusTextRepaid
                    : overdue
                    ? styles.statusTextOverdue
                    : styles.statusTextPending,
                ]}
              >
                {item.isRepaid ? 'Repaid' : overdue ? 'Overdue' : 'Pending'}
              </Text>
            </View>

            {/* Mark as Repaid Button */}
            {!item.isRepaid && (
              <TouchableOpacity
                style={[
                  styles.repayButton,
                  (isRepaying || repayingId !== null) && styles.buttonDisabled,
                ]}
                onPress={() => handleRepay(item.id)}
                disabled={isRepaying || repayingId !== null}
                activeOpacity={0.8}
              >
                {isRepaying ? (
                  <ActivityIndicator size="small" color={Colors.textLight} />
                ) : (
                  <Text style={styles.repayButtonText}>Mark as Repaid</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No loans yet. Click '+ Add Loan' to create one.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
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
    padding: 16,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  headerContainer: {
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  appHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addLoanHeaderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addLoanHeaderBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 13,
  },
  logoutHeaderBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutHeaderBtnText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryBtnText: {
    color: Colors.textLight,
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overdueHighlightBox: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  loanCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loanCardRepaid: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  loanCardOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  loanAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardStatusArea: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeRepaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  badgeOverdue: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextRepaid: {
    color: Colors.success,
  },
  statusTextOverdue: {
    color: Colors.danger,
  },
  statusTextPending: {
    color: Colors.warning,
  },
  repayButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  repayButtonText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
