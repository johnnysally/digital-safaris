import React, { useState } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { colors, font } from '../../theme';

type Size = 'sm' | 'md' | 'lg';

export interface LogoProps {
  size?: Size;
  showText?: boolean;
  text?: string;
  source?: any;
}

const SIZES: Record<Size, number> = { sm: 24, md: 32, lg: 48 };

export default function Logo({
  size = 'md',
  showText = true,
  text = 'DigitalSafaris',
  source,
}: LogoProps) {
  const [errored, setErrored] = useState(false);
  const dim = SIZES[size];
  const useImage = source && !errored;

  return (
    <View style={styles.row}>
      {useImage ? (
        <Image
          source={source}
          onError={() => setErrored(true)}
          style={{ width: dim, height: dim }}
          resizeMode="contain"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <Text style={{ color: colors.white, fontWeight: '700' }}>DS</Text>
        </View>
      )}
      {showText ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  placeholder: {
    backgroundColor: colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
});