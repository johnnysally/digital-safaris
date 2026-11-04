import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Modal from './Modal';
import Button from './Button';
import { colors, font, spacing } from '../../theme';
import { UpdateInfo, openUpdateDownload } from '../../utils/updateChecker';

interface UpdatePromptProps {
  visible: boolean;
  info: UpdateInfo | null;
  onDismiss: () => void;
}

export default function UpdatePrompt({ visible, info, onDismiss }: UpdatePromptProps) {
  if (!info) return null;

  return (
    <Modal
      isOpen={visible}
      onClose={onDismiss}
      title="Update available"
      size="sm"
      footer={
        <>
          <Button title="Later" variant="ghost" onPress={onDismiss} />
          <Button
            title="Download"
            onPress={() => {
              if (info.downloadUrl) openUpdateDownload(info.downloadUrl);
              onDismiss();
            }}
          />
        </>
      }
    >
      <View style={{ gap: spacing.sm }}>
        <Text style={styles.body}>
          DigitalSafaris <Text style={styles.version}>{info.latestVersion}</Text> is available.
          You're on <Text style={styles.version}>{info.currentVersion}</Text>.
        </Text>

        {info.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>WHAT'S NEW</Text>
            <Text style={styles.notesText}>{info.notes.trim()}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: font.sm, color: colors.text.secondary, lineHeight: 20 },
  version: { fontWeight: '700', color: colors.text.primary },
  notesBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text.muted,
    marginBottom: 6,
  },
  notesText: { fontSize: font.xs, color: colors.text.secondary, lineHeight: 17 },
});