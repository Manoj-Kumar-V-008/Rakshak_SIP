import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'emerald' | 'amber' | 'coral' | 'info';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'info',
  style,
  textStyle,
}) => {
  const theme = useTheme() as AppTheme;

  const getBadgeColors = () => {
    switch (variant) {
      case 'emerald':
        return {
          backgroundColor: theme.colors.safeContainer,
          textColor: theme.colors.safe,
        };
      case 'amber':
        return {
          backgroundColor: theme.colors.warningContainer,
          textColor: theme.colors.warning,
        };
      case 'coral':
        return {
          backgroundColor: theme.colors.dangerContainer,
          textColor: theme.colors.danger,
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.colors.primaryContainer,
          textColor: theme.colors.primary,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.backgroundColor, borderRadius: theme.borderRadius.small },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          theme.fonts.labelSmall,
          { color: colors.textColor },
          textStyle,
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    letterSpacing: 1,
    fontWeight: '700',
  },
});
