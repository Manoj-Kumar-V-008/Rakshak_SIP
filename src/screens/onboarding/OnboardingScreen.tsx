import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { AppTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useConfigStore } from '../../store/useConfigStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LanguageType = 'en' | 'hi' | 'ta' | 'te' | 'kn';

interface LanguageOption {
  label: string;
  nativeLabel: string;
  code: LanguageType;
}

export const OnboardingScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const completeOnboarding = useConfigStore((state) => state.completeOnboarding);
  const updateProfile = useConfigStore((state) => state.updateProfile);

  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Form State
  const [name, setName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>('en');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userCategory, setUserCategory] = useState('Working Professional');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Permission State
  const [smsGranted, setSmsGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const languages: LanguageOption[] = [
    { label: 'English', nativeLabel: 'English', code: 'en' },
    { label: 'Hindi', nativeLabel: 'हिन्दी', code: 'hi' },
    { label: 'Tamil', nativeLabel: 'தமிழ்', code: 'ta' },
    { label: 'Telugu', nativeLabel: 'ತೆಲುಗು', code: 'te' },
    { label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', code: 'kn' },
  ];

  // Scroll handler to track the page dots dynamically
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const scrollToPage = (pageIndex: number) => {
    scrollRef.current?.scrollTo({
      x: pageIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPage(pageIndex);
  };

  const requestSmsPermission = () => {
    Alert.alert(
      'SMS Protection',
      'Rakshak AI requires SMS access to read incoming texts and alert you of OTP scam indicators. No data leaves your device.',
      [
        { text: 'Deny', style: 'cancel' },
        {
          text: 'Allow',
          onPress: () => {
            setSmsGranted(true);
            updateProfile({ smsTrackingAllowed: true });
          },
        },
      ]
    );
  };

  const requestNotificationPermission = () => {
    Alert.alert(
      'Notification Alerts',
      'Rakshak AI requires notification access to immediately warn you if a suspicious message arrives.',
      [
        { text: 'Deny', style: 'cancel' },
        {
          text: 'Allow',
          onPress: () => setNotificationGranted(true),
        },
      ]
    );
  };

  const handleComplete = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedEmergName = emergencyName.trim();
    const trimmedEmergPhone = emergencyPhone.trim();
    
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter your first name (minimum 2 characters).');
      return;
    }

    if (trimmedPhone.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (trimmedEmergName.length < 2) {
      Alert.alert('Invalid Emergency Contact Name', 'Please enter the name of your emergency contact.');
      return;
    }

    if (trimmedEmergPhone.length !== 10) {
      Alert.alert('Invalid Emergency Number', 'Please enter a valid 10-digit emergency contact phone number.');
      return;
    }

    completeOnboarding(trimmedName, selectedLanguage, trimmedPhone, userCategory, trimmedEmergName, trimmedEmergPhone);

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'App' }],
      })
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Header */}
      <View style={styles.topHeader} />

      {/* Horizontal Page Slider */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* PAGE 1: WELCOME */}
        <View style={styles.slide}>
          <View style={styles.welcomeHeader}>
            <Image
              source={{ uri: 'https://img.icons8.com/fluency/96/shield.png' }}
              style={styles.welcomeLogo}
            />
            <Text style={[styles.welcomeTitleText, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
              RAKSHAK AI
            </Text>
          </View>
          <View style={styles.graphicContainer}>
            <View style={[styles.imageWrapper, { borderColor: theme.colors.outline }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80' }}
                style={styles.slideImage}
              />
              <View style={[styles.imageOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.6)' }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={48} color={theme.colors.safe} />
                <Text style={[styles.imageOverlayText, theme.fonts.labelLarge, { color: '#FFFFFF', marginTop: 8 }]}>
                  ON-DEVICE AI SHIELD ACTIVE
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, theme.fonts.h1, { color: theme.colors.textPrimary }]}>
              Guard Against Digital Fraud
            </Text>
            <Text style={[styles.description, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>
              Protect yourself and your loved ones from OTP frauds, digital arrest scams, phishing, and fake investment traps.
            </Text>
          </View>
          <View style={styles.actionSection}>
            <CustomButton
              title="Get Started"
              onPress={() => scrollToPage(1)}
              variant="primary"
              style={styles.ctaButton}
            />
          </View>
        </View>

        {/* PAGE 2: PERMISSIONS */}
        <View style={styles.slide}>
          <View style={styles.slideHeader}>
            <Text style={[styles.title, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
              Device Security Setup
            </Text>
          </View>
          
          <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false}>
            {/* Banner Image */}
            <View style={[styles.setupBannerContainer, { borderColor: theme.colors.outline }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&auto=format&fit=crop&q=80' }}
                style={styles.setupBannerImage}
              />
              <View style={[styles.setupBannerOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.5)' }]}>
                <Text style={[styles.setupBannerTitle, theme.fonts.labelLarge, { color: '#FFFFFF' }]}>
                  SYSTEM AUDIT & PROTECTION
                </Text>
              </View>
            </View>

            {/* SMS Access */}
            <TouchableOpacity
              onPress={requestSmsPermission}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: smsGranted ? theme.colors.safe : theme.colors.outline,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={24}
                  color={smsGranted ? theme.colors.safe : theme.colors.primary}
                />
                <Text style={[styles.cardTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
                  SMS Scam Shield
                </Text>
                <MaterialCommunityIcons
                  name={smsGranted ? 'checkbox-marked-circle' : 'circle-outline'}
                  size={20}
                  color={smsGranted ? theme.colors.safe : theme.colors.textMuted}
                />
              </View>
              <Text style={[styles.cardText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
                Scans incoming SMS texts in real-time to alert you of UPI, OTP, and lottery fraud messages.
              </Text>
            </TouchableOpacity>

            {/* Notification Access */}
            <TouchableOpacity
              onPress={requestNotificationPermission}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: notificationGranted ? theme.colors.safe : theme.colors.outline,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={24}
                  color={notificationGranted ? theme.colors.safe : theme.colors.primary}
                />
                <Text style={[styles.cardTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
                  Real-Time Alert Center
                </Text>
                <MaterialCommunityIcons
                  name={notificationGranted ? 'checkbox-marked-circle' : 'circle-outline'}
                  size={20}
                  color={notificationGranted ? theme.colors.safe : theme.colors.textMuted}
                />
              </View>
              <Text style={[styles.cardText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
                Monitors warnings to stop active scam attempts (such as financial fraud and blackmail threats).
              </Text>
            </TouchableOpacity>

            {/* Privacy Box */}
            <View style={[styles.privacyBox, { backgroundColor: theme.colors.surfaceContainer }]}>
              <MaterialCommunityIcons name="shield-key" size={24} color={theme.colors.safe} />
              <View style={styles.privacyTextGroup}>
                <Text style={[styles.privacyTitle, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>
                  Privacy Shield Active
                </Text>
                <Text style={[styles.privacyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
                  All scans happen locally on-device. Your text messages never leave your phone.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionSection}>
            <CustomButton
              title={smsGranted && notificationGranted ? 'Continue' : 'Grant Permissions'}
              onPress={smsGranted && notificationGranted ? () => scrollToPage(2) : () => {
                if (!smsGranted) requestSmsPermission();
                else if (!notificationGranted) requestNotificationPermission();
              }}
              variant="primary"
              style={styles.ctaButton}
            />
          </View>
        </View>

        {/* PAGE 3: PROFILE SETUP */}
        <View style={styles.slide}>
          <View style={styles.slideHeader}>
            <Text style={[styles.title, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
              Personalize Shield
            </Text>
          </View>

          <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Setup Banner */}
            <View style={[styles.setupBannerContainer, { borderColor: theme.colors.outline, marginBottom: 16 }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' }}
                style={styles.setupBannerImage}
              />
              <View style={[styles.setupBannerOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.6)' }]}>
                <Text style={[styles.setupBannerTitle, theme.fonts.labelLarge, { color: '#FFFFFF' }]}>
                  GUARDIAN ENGINE LOCAL CONFIG
                </Text>
              </View>
            </View>

            {/* English Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Your First Name (English)
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Manoj"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    borderColor: name.trim().length >= 2 ? theme.colors.safe : theme.colors.outline,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.medium,
                  },
                ]}
                maxLength={20}
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Mobile Phone Number
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="e.g. 9876543210"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  {
                    borderColor: phoneNumber.trim().length === 10 ? theme.colors.safe : theme.colors.outline,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.medium,
                  },
                ]}
                maxLength={10}
              />
            </View>

            {/* User Risk Profile Category Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                User Risk Profile Category
              </Text>
              <View style={styles.categoryGrid}>
                {['Senior Citizen', 'Working Professional', 'Student'].map((cat) => {
                  const isSelected = userCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setUserCategory(cat)}
                      style={[
                        styles.catTile,
                        {
                          backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                        },
                      ]}
                    >
                      <Text style={[styles.catText, theme.fonts.bodySmall, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Emergency Contact Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Emergency Contact Person Name
              </Text>
              <TextInput
                value={emergencyName}
                onChangeText={setEmergencyName}
                placeholder="e.g. Rajan (Father / Brother)"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    borderColor: emergencyName.trim().length >= 2 ? theme.colors.safe : theme.colors.outline,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.medium,
                  },
                ]}
                maxLength={30}
              />
            </View>

            {/* Emergency Contact Phone */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Emergency Contact Number
              </Text>
              <TextInput
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                placeholder="e.g. 9988776655"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  {
                    borderColor: emergencyPhone.trim().length === 10 ? theme.colors.safe : theme.colors.outline,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.medium,
                  },
                ]}
                maxLength={10}
              />
            </View>

            {/* Language Selection Grid */}
            <View style={styles.languageSection}>
              <Text style={[styles.label, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Preferred Language
              </Text>
              <View style={styles.languageGrid}>
                {languages.map((item) => {
                  const isSelected = selectedLanguage === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => setSelectedLanguage(item.code)}
                      style={[
                        styles.langTile,
                        {
                          backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                          borderRadius: theme.borderRadius.medium,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.langLabel,
                          theme.fonts.bodyLarge,
                          { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                        ]}
                      >
                        {item.nativeLabel}
                      </Text>
                      <Text
                        style={[
                          styles.langSubLabel,
                          theme.fonts.caption,
                          { color: isSelected ? theme.colors.primary : theme.colors.textSecondary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionSection}>
            <CustomButton
              title="Complete Setup & Activate"
              onPress={handleComplete}
              variant="primary"
              style={styles.ctaButton}
            />
          </View>
        </View>
      </ScrollView>

      {/* Dynamic Slide Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <TouchableOpacity key={i} onPress={() => scrollToPage(i)}>
            <View
              style={[
                styles.dot,
                currentPage === i
                  ? [styles.activeDot, { backgroundColor: theme.colors.primary }]
                  : { backgroundColor: theme.colors.outline },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    height: Platform.OS === 'ios' ? 44 : 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginTop: Platform.OS === 'ios' ? 12 : 6,
  },
  skipText: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  slideHeader: {
    height: 60,
    justifyContent: 'center',
  },
  slideScroll: {
    flex: 1,
  },
  graphicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 260,
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageOverlayText: {
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  setupBannerContainer: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  setupBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  setupBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupBannerTitle: {
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 12,
  },
  textContainer: {
    paddingVertical: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
  },
  actionSection: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
  cardText: {
    lineHeight: 18,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
  },
  privacyTextGroup: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  privacyText: {
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  languageSection: {
    marginBottom: 20,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  langTile: {
    width: '48%',
    height: 60,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  langLabel: {
    fontWeight: '700',
  },
  langSubLabel: {
    marginTop: 2,
  },
  dotsContainer: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  activeDot: {
    width: 24,
  },
  welcomeHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  welcomeLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  welcomeTitleText: {
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  catTile: {
    width: '31%',
    height: 44,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catText: {
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 10,
  },
});
export default OnboardingScreen;
