import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { customerApi } from '../../api';
import { useAuthStore } from '../../store';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatDate } from '../../utils/formatDate';
import { fullName } from '../../utils/helpers';
import {
  checkForUpdate,
  getCurrentVersion,
  openUpdateDownload,
  UpdateInfo,
} from '../../utils/updateChecker';
import {
  COMPANY, DEVELOPER, COPYRIGHT,
} from '../../utils/constants';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Switch from '../../components/ui/Switch';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import type { CustomerProfile, CustomerPreferences } from '../../types';

const COMPANY_EMAIL = 'info@hdm.co.ke';

export default function Profile({ navigation }: any) {
  const { customer, logout, setCustomer } = useAuthStore();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [preference, setPreference] = useState<CustomerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    town: customer?.town || '',
  });

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [currentVersion, setCurrentVersion] = useState<string>('—');
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateInfo | null>(null);
  const [updateChecked, setUpdateChecked] = useState(false);

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await customerApi.profile();
      setProfile(data.profile || null);
      setPreference(data.preference || null);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    setCurrentVersion(getCurrentVersion());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const openEdit = () => {
    setEditForm({
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      phone: customer?.phone || '',
      town: customer?.town || '',
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated = await customerApi.updateProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        town: editForm.town,
      });
      setCustomer(updated);
      setEditOpen(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceToggle = async (
    group: 'notifications' | 'categories',
    key: string,
    value: boolean
  ) => {
    if (!preference) return;
    const next: CustomerPreferences =
      group === 'notifications'
        ? { ...preference, notifications: { ...preference.notifications, [key]: value } }
        : { ...preference, categories: { ...preference.categories, [key]: value } };
    setPreference(next);
    try {
      await customerApi.updatePreferences(next);
    } catch {
      setPreference(preference);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      setLogoutLoading(false);
      setLogoutOpen(false);
    }
  };

  const handleCheckUpdate = async () => {
    setUpdateChecking(true);
    setUpdateChecked(false);
    try {
      const info = await checkForUpdate(true);
      setUpdateResult(info);
      setUpdateChecked(true);
      if (info) setCurrentVersion(info.currentVersion);
    } catch {
      setUpdateResult(null);
      setUpdateChecked(true);
    } finally {
      setUpdateChecking(false);
    }
  };

  if (loading && !customer) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account details.</Text>
          </View>
          <Button title="Edit" size="sm" variant="ghost" onPress={openEdit} />
        </View>

        <View style={styles.identityCard}>
          <Avatar
            src={customer?.avatar}
            fallback={fullName(customer?.firstName, customer?.lastName)}
            size="lg"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName(customer?.firstName, customer?.lastName) || '—'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>{customer?.email}</Text>
            <Text style={styles.memberSince}>
              Member since {formatDate(customer?.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.shortcuts}>
          <Shortcut
            icon="calendar"
            label="My Bookings"
            description="Manage your stays"
            onPress={() => navigation.navigate('ActivityTab', { screen: 'Booking' })}
          />
          <Shortcut
            icon="wallet"
            label="Wallet"
            description="Check and top up"
            onPress={() => navigation.navigate('WalletTab')}
          />
          <Shortcut
            icon="heart"
            label="My Reviews"
            description="What you've shared"
            onPress={() => navigation.navigate('Reviews')}
          />
        </View>

        <Section title="DETAILS">
          <DetailRow icon="mail-outline" label="Email" value={customer?.email || '—'} />
          <DetailRow icon="call-outline" label="Phone" value={customer?.phone || '—'} />
          <DetailRow icon="location-outline" label="Town" value={customer?.town || '—'} />
          <DetailRow
            icon="person-outline"
            label="Referral code"
            value={customer?.referralCode || '—'}
            mono
          />
        </Section>

        {preference ? (
          <Section title="NOTIFICATIONS">
            <Text style={styles.subLabel}>CHANNELS</Text>
            <Switch
              checked={preference.notifications.email}
              onChange={(v) => handlePreferenceToggle('notifications', 'email', v)}
              label="Email"
            />
            <Switch
              checked={preference.notifications.sms}
              onChange={(v) => handlePreferenceToggle('notifications', 'sms', v)}
              label="SMS"
            />
            <Switch
              checked={preference.notifications.push}
              onChange={(v) => handlePreferenceToggle('notifications', 'push', v)}
              label="Push"
            />
            <Switch
              checked={preference.notifications.inApp}
              onChange={(v) => handlePreferenceToggle('notifications', 'inApp', v)}
              label="In-app"
            />

            <Text style={[styles.subLabel, { marginTop: spacing.md }]}>CATEGORIES</Text>
            <Switch
              checked={preference.categories.orderUpdates}
              onChange={(v) => handlePreferenceToggle('categories', 'orderUpdates', v)}
              label="Order updates"
            />
            <Switch
              checked={preference.categories.bookingUpdates}
              onChange={(v) => handlePreferenceToggle('categories', 'bookingUpdates', v)}
              label="Booking updates"
            />
            <Switch
              checked={preference.categories.tripUpdates}
              onChange={(v) => handlePreferenceToggle('categories', 'tripUpdates', v)}
              label="Trip updates"
            />
            <Switch
              checked={preference.categories.paymentUpdates}
              onChange={(v) => handlePreferenceToggle('categories', 'paymentUpdates', v)}
              label="Payment updates"
            />
            <Switch
              checked={preference.categories.promotions}
              onChange={(v) => handlePreferenceToggle('categories', 'promotions', v)}
              label="Promotions"
            />
            <Switch
              checked={preference.categories.newsletters}
              onChange={(v) => handlePreferenceToggle('categories', 'newsletters', v)}
              label="Newsletters"
            />
          </Section>
        ) : null}

        <Section title="UPDATES">
          <View style={styles.updateRow}>
            <View style={styles.updateIcon}>
              <Ionicons name="cloud-download-outline" size={18} color={colors.secondary[600]} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.updateLabel}>Current version</Text>
              <Text style={styles.updateValue}>v{currentVersion}</Text>
            </View>
            <Pressable
              onPress={handleCheckUpdate}
              disabled={updateChecking}
              style={styles.checkBtn}
            >
              {updateChecking ? (
                <ActivityIndicator size="small" color={colors.secondary[600]} />
              ) : (
                <Text style={styles.checkBtnText}>Check</Text>
              )}
            </Pressable>
          </View>

          {updateChecked && updateResult ? (
            updateResult.available ? (
              <View style={styles.updateAvailable}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="sparkles" size={14} color={colors.secondary[600]} />
                  <Text style={styles.updateAvailableTitle}>
                    v{updateResult.latestVersion} is available
                  </Text>
                </View>
                {updateResult.notes ? (
                  <Text style={styles.updateNotes} numberOfLines={4}>
                    {updateResult.notes.trim()}
                  </Text>
                ) : null}
                {updateResult.downloadUrl ? (
                  <Button
                    title="Download update"
                    size="sm"
                    fullWidth
                    onPress={() => openUpdateDownload(updateResult.downloadUrl!)}
                    leftIcon={<Ionicons name="download-outline" size={14} color={colors.white} />}
                    style={{ marginTop: spacing.sm }}
                  />
                ) : null}
              </View>
            ) : (
              <View style={styles.updateUpToDate}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.updateUpToDateText}>
                  You're on the latest version
                </Text>
              </View>
            )
          ) : null}

          {updateChecked && !updateResult ? (
            <View style={styles.updateError}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.updateErrorText}>
                Could not check for updates. Try again.
              </Text>
            </View>
          ) : null}
        </Section>

        <Section title="ABOUT">
          <Text style={styles.aboutBody}>
            DigitalSafaris is a travel companion for exploring Kenya — book verified
            stays, order from local kitchens, request rides, and manage payments in one place.
          </Text>

          <DetailRow icon="business-outline" label="Company" value={COMPANY} />

          <Pressable
            onPress={() => Linking.openURL(`mailto:${COMPANY_EMAIL}`).catch(() => {})}
            style={styles.emailRow}
          >
            <Ionicons name="mail-outline" size={16} color={colors.text.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Company email</Text>
              <Text style={[styles.detailValue, { color: colors.secondary[600] }]}>
                {COMPANY_EMAIL}
              </Text>
            </View>
            <Ionicons name="open-outline" size={12} color={colors.text.muted} />
          </Pressable>

          <DetailRow icon="code-slash-outline" label="Developer" value={DEVELOPER} />

          <View style={styles.versionRow}>
            <Text style={styles.detailLabel}>App version</Text>
            <Text style={styles.detailValue}>
              v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>

          <Text style={styles.copyright}>{COPYRIGHT}</Text>
        </Section>

        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Log out"
            variant="danger"
            leftIcon={<Ionicons name="log-out-outline" size={16} color={colors.white} />}
            onPress={() => setLogoutOpen(true)}
            fullWidth
          />
        </View>
      </ScrollView>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        footer={
          <>
            <Button title="Cancel" variant="ghost" onPress={() => setEditOpen(false)} disabled={saving} />
            <Button title="Save" onPress={saveEdit} loading={saving} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Input
            label="First name"
            value={editForm.firstName}
            onChangeText={(t) => setEditForm({ ...editForm, firstName: t })}
          />
          <Input
            label="Last name"
            value={editForm.lastName}
            onChangeText={(t) => setEditForm({ ...editForm, lastName: t })}
          />
          <Input
            label="Phone"
            keyboardType="phone-pad"
            value={editForm.phone}
            onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
          />
          <Input
            label="Town"
            value={editForm.town}
            onChangeText={(t) => setEditForm({ ...editForm, town: t })}
          />
        </View>
      </Modal>

      <ConfirmDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You will need to sign in again to access your account."
        confirmText="Log out"
        variant="danger"
        loading={logoutLoading}
      />
    </SafeAreaView>
  );
}

function Shortcut({
  icon, label, description, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.shortcut}>
      <View style={styles.shortcutIcon}>
        <Ionicons name={icon} size={18} color={colors.secondary[600]} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.shortcutLabel}>{label}</Text>
        <Text style={styles.shortcutDesc} numberOfLines={1}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );
}

function DetailRow({
  icon, label, value, mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={colors.text.muted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, mono && { fontFamily: 'monospace' }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted, marginTop: 2 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  name: { fontSize: font.lg, fontWeight: '700', color: colors.text.primary },
  email: { fontSize: font.sm, color: colors.text.muted, marginTop: 2 },
  memberSince: { fontSize: 11, color: colors.text.muted, marginTop: 4 },
  shortcuts: { gap: spacing.sm, marginTop: spacing.lg },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  shortcutDesc: { fontSize: font.xs, color: colors.text.muted, marginTop: 2 },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailLabel: { fontSize: 11, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  detailValue: { fontSize: font.sm, color: colors.text.primary, marginTop: 2 },

  aboutBody: {
    fontSize: font.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  copyright: {
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  updateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateLabel: { fontSize: 11, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  updateValue: { fontSize: font.md, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  checkBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 72,
    alignItems: 'center',
  },
  checkBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  updateAvailable: {
    backgroundColor: colors.secondary[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    padding: spacing.md,
    marginTop: spacing.md,
  },
  updateAvailableTitle: { fontSize: font.sm, fontWeight: '700', color: colors.secondary[700] },
  updateNotes: { fontSize: font.xs, color: colors.text.secondary, marginTop: spacing.sm, lineHeight: 16 },
  updateUpToDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  updateUpToDateText: { fontSize: font.sm, color: colors.success, fontWeight: '600' },
  updateError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  updateErrorText: { fontSize: font.sm, color: colors.danger },
});