import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useTheme() as AppTheme;

  // Resolve backgrounds and text colors based on variant and dark/light settings
  const getButtonStyles = (): { button: ViewStyle; text: TextStyle } => {
    const isDark = theme.dark;
    
    let backgroundColor: string = theme.colors.primary;
    let textColor: string = isDark ? theme.colors.background : '#FFFFFF';
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'secondary':
        backgroundColor = theme.colors.secondary;
        textColor = '#FFFFFF';
        break;
      case 'outline':
        backgroundColor = 'transparent';
        textColor = theme.colors.textPrimary;
        borderColor = theme.colors.outline;
        borderWidth = 1.5;
        break;
      case 'danger':
        backgroundColor = theme.colors.error;
        textColor = '#FFFFFF';
        break;
      case 'success':
        backgroundColor = theme.colors.safe;
        textColor = '#FFFFFF';
        break;
      case 'primary':
      default:
        backgroundColor = theme.colors.primary;
        textColor = isDark ? '#0B0F19' : '#FFFFFF'; // High-contrast text on primary
        break;
    }

    if (disabled) {
      backgroundColor = isDark ? '#1E293B' : '#E2E8F0';
      textColor = isDark ? '#64748B' : '#94A3B8';
      borderColor = 'transparent';
      borderWidth = 0;
    }

    return {
      button: {
        backgroundColor,
        borderColor,
        borderWidth,
      },
      text: {
        color: textColor,
      },
    };
  };

  const dynamicStyles = getButtonStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        { borderRadius: theme.borderRadius.medium },
        dynamicStyles.button,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={dynamicStyles.text.color} />
      ) : (
        <Text
          style={[
            styles.baseText,
            theme.fonts.labelLarge,
            dynamicStyles.text,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 50, // Standard touch target size (Accessibility compliant)
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
    flexDirection: 'row',
  },
  baseText: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
