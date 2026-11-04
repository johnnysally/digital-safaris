import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { aiConciergeApi } from '../../api';
import { useAuthStore } from '../../store';
import { colors, font, spacing, radius } from '../../theme';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'What restaurants are in Nairobi?',
  'Where can I stay in Naivasha?',
  'How do I order food?',
  'Recommend a weekend trip',
];

export default function AiConcierge() {
  const customer = useAuthStore((s) => s.customer);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Jambo${customer ? `, ${customer.firstName}` : ''}! I'm your Digital Safaris concierge. How can I help you plan your journey today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, sending]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;

    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text: clean };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await aiConciergeApi.chat({ message: clean });
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: res.reply || "I'm not sure how to answer that. Try asking differently.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: 'bot',
          text: 'Sorry, I could not reach the concierge right now. Please try again shortly.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="compass" size={18} color={colors.secondary[600]} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerTitle}>Digital Safaris Concierge</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              Ask about stays, food, transport, or anything travel-related.
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[styles.msgRow, m.sender === 'user' && { justifyContent: 'flex-end' }]}
            >
              {m.sender === 'bot' && (
                <View style={styles.botIcon}>
                  <Ionicons name="sparkles" size={14} color={colors.secondary[600]} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  m.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    m.sender === 'user' && { color: colors.white },
                  ]}
                >
                  {m.text}
                </Text>
              </View>
            </View>
          ))}

          {sending && (
            <View style={styles.msgRow}>
              <View style={styles.botIcon}>
                <Ionicons name="sparkles" size={14} color={colors.secondary[600]} />
              </View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                <Text style={{ fontSize: 14, color: colors.text.muted }}>●●●</Text>
              </View>
            </View>
          )}

          {messages.length <= 1 && !sending && (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Text style={styles.suggestionsLabel}>TRY ASKING</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} style={styles.suggestionChip}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask the concierge..."
            placeholderTextColor={colors.text.muted}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || sending}
            style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={16} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  headerSub: { fontSize: font.xs, color: colors.text.muted, marginTop: 2 },
  messages: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['2xl'] },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: { maxWidth: '82%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bubbleUser: { backgroundColor: colors.secondary[500], borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: font.sm, color: colors.text.primary, lineHeight: 20 },
  suggestionsLabel: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1 },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
  },
  suggestionText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: font.sm,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});