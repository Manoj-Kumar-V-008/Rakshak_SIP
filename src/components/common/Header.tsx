import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTheme } from '../../theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightAction }) => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
          borderBottomWidth: StyleSheet.hairlineWidth,
          paddingTop: insets.top,
          height: (Platform.OS === 'ios' ? 52 : 56) + insets.top,
        },
      ]}
    >
      {showBack && navigation.canGoBack() ? (
        <>
          {/* Back Button Layout */}
          <View style={styles.leftSection}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.titleSectionCentered}>
            <Text numberOfLines={1} style={[styles.title, theme.fonts.titleMedium, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* Brand Logo + Title Row on Left */}
          <View style={styles.brandRow}>
            <Image
              source={{ uri: 'https://img.icons8.com/fluency/96/shield.png' }}
              style={styles.logoImage}
            />
            <View style={styles.brandTextGroup}>
              <Text numberOfLines={1} style={[styles.brandTitle, theme.fonts.titleMedium, { color: theme.colors.textPrimary }]}>
                {title}
              </Text>
              <View style={styles.liveIndicatorRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.colors.safe }]} />
                <Text style={[styles.liveText, theme.fonts.labelSmall, { color: theme.colors.safe }]}>
                  ON-DEVICE AI
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Right Section */}
      <View style={styles.rightSection}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleSectionCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 10,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
    fontSize: 16,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rightSection: {
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default Header;
