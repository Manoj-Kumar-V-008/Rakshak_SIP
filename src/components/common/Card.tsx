import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  elevation?: number;
  marginTop?: number;
  marginBottom?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 16,
  backgroundColor,
  borderColor,
  borderWidth = 1,
  radius = 16,
  elevation,
  marginTop,
  marginBottom,
}) => {
  const theme = useTheme() as AppTheme;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor || theme.colors.surface,
          borderColor: borderColor || theme.colors.outline,
          borderWidth,
          borderRadius: radius,
          padding,
          marginTop,
          marginBottom,
          ...(elevation
            ? {
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {},
});
