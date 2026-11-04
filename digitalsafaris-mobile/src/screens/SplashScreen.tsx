import React from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[800]} />
      <Image
        source={require('../../assets/splash-square.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});