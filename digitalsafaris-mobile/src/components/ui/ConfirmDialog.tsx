import React from 'react';
import Modal from './Modal';
import Button from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onPress={onClose} disabled={loading} title={cancelText} />
          <Button variant={variant} onPress={onConfirm} loading={loading} title={confirmText} />
        </>
      }
    >
      {description ? <ModalBody text={description} /> : null}
    </Modal>
  );
}

function ModalBody({ text }: { text: string }) {
  const { Text } = require('react-native');
  const { colors, font } = require('../../theme');
  return <Text style={{ fontSize: font.sm, color: colors.text.secondary }}>{text}</Text>;
}