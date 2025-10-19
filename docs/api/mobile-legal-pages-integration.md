# Mobile App Legal Pages Integration Guide

**Last Updated**: October 19, 2025
**Status**: ✅ Ready for Implementation
**Priority**: 🔴 CRITICAL (Required for App Store Submission)

---

## Overview

This guide explains how to integrate all required legal pages into the TrendAnkara mobile app for compliance with Apple App Store and Google Play Store requirements.

---

## Required Legal Pages

### 1. Privacy Policy (Gizlilik Politikası)
**Status**: 📋 To be implemented
**Purpose**: Data collection and usage disclosure
**Required by**: Apple App Store ✅ | Google Play Store ✅

### 2. Terms & Conditions (Kullanım Koşulları)
**Status**: ✅ Ready to deploy
**Purpose**: User agreement and service terms
**Required by**: Apple App Store ✅ | Google Play Store ✅

### 3. Künye (Company Identity/Imprint)
**Status**: ✅ Ready to deploy
**Purpose**: Turkish radio broadcasting license requirement
**Required by**: Turkish Radio and Television Supreme Council (RTÜK) ✅

---

## Available Pages

| Page | Turkish | English | Status |
|------|---------|---------|--------|
| **Privacy Policy** | `gizlilik-politikasi.html` | `privacy-policy.html` | 📋 To be implemented |
| **Terms & Conditions** | ✅ `kullanim-kosullari.html` | ✅ `terms-and-conditions.html` | ✅ Ready |
| **Künye (Company Info)** | ✅ `kunye.html` | N/A (Turkish only) | ✅ Ready |

---

## URLs After Deployment

### Production URLs

```
Privacy Policy (Turkish):  https://trendankara.com/gizlilik-politikasi.html
Privacy Policy (English):  https://trendankara.com/privacy-policy.html

Terms & Conditions (Turkish):  https://trendankara.com/kullanim-kosullari.html
Terms & Conditions (English):  https://trendankara.com/terms-and-conditions.html

Künye (Turkish only):  https://trendankara.com/kunye.html
```

---

## Mobile App Implementation

### Step 1: Add Links to Settings Screen

Add a "Legal" or "Yasal" section in your app's Settings screen:

#### React Native Example

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface LegalLink {
  title: string;
  url: string;
  icon: string;
}

const LEGAL_LINKS: LegalLink[] = [
  {
    title: 'Gizlilik Politikası',
    url: 'https://trendankara.com/gizlilik-politikasi.html',
    icon: 'privacy-tip'
  },
  {
    title: 'Kullanım Koşulları',
    url: 'https://trendankara.com/kullanim-kosullari.html',
    icon: 'description'
  },
  {
    title: 'Künye',
    url: 'https://trendankara.com/kunye.html',
    icon: 'info'
  }
];

export function LegalSection() {
  const openLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', `${title} açılamadı.`);
      }
    } catch (error) {
      console.error('Error opening legal page:', error);
      Alert.alert('Hata', 'Sayfa açılırken bir hata oluştu.');
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Yasal</Text>

      {LEGAL_LINKS.map((link, index) => (
        <TouchableOpacity
          key={index}
          style={styles.linkButton}
          onPress={() => openLink(link.url, link.title)}
          accessibilityRole="button"
          accessibilityLabel={`${link.title} sayfasını aç`}
        >
          <View style={styles.linkContent}>
            <Icon name={link.icon} size={24} color="#E31E24" style={styles.icon} />
            <Text style={styles.linkText}>{link.title}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#E31E24',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
  },
});
```

---

### Step 2: Add In-App Browser (Recommended)

Instead of opening in external browser, use an in-app browser for better UX:

#### Using React Native WebView

```bash
npm install react-native-webview
```

```typescript
import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface LegalPageProps {
  route: {
    params: {
      url: string;
      title: string;
    };
  };
  navigation: any;
}

export function LegalPageScreen({ route, navigation }: LegalPageProps) {
  const { url, title } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E31E24" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  webview: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});
```

#### Navigation Setup

```typescript
// In your navigation stack
import { LegalPageScreen } from './screens/LegalPageScreen';

<Stack.Screen
  name="LegalPage"
  component={LegalPageScreen}
  options={{
    headerShown: false,
    presentation: 'modal',
  }}
/>

// When opening from Settings
navigation.navigate('LegalPage', {
  url: 'https://trendankara.com/kullanim-kosullari.html',
  title: 'Kullanım Koşulları'
});
```

---

### Step 3: First-Run Flow (Optional but Recommended)

Show Terms & Conditions on first app launch:

```typescript
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TERMS_ACCEPTED_KEY = '@trendankara:terms_accepted';

export function FirstRunScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
      navigation.replace('Main');
    } catch (error) {
      console.error('Error saving acceptance:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Hoş Geldiniz!</Text>
        <Text style={styles.description}>
          TrendAnkara uygulamasını kullanmadan önce lütfen kullanım koşullarımızı ve
          gizlilik politikamızı okuyun.
        </Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('LegalPage', {
            url: 'https://trendankara.com/kullanim-kosullari.html',
            title: 'Kullanım Koşulları'
          })}
        >
          <Text style={styles.linkText}>Kullanım Koşullarını Oku</Text>
          <Icon name="open-in-new" size={20} color="#E31E24" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('LegalPage', {
            url: 'https://trendankara.com/gizlilik-politikasi.html',
            title: 'Gizlilik Politikası'
          })}
        >
          <Text style={styles.linkText}>Gizlilik Politikasını Oku</Text>
          <Icon name="open-in-new" size={20} color="#E31E24" />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkbox, accepted && styles.checkboxChecked]}
          onPress={() => setAccepted(!accepted)}
        >
          {accepted && <Icon name="check" size={20} color="#fff" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          Kullanım koşullarını ve gizlilik politikasını okudum, kabul ediyorum
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
        onPress={handleAccept}
        disabled={!accepted}
      >
        <Text style={styles.acceptButtonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## App Store Submission

### Apple App Store Connect

1. **App Information**:
   - Privacy Policy URL: `https://trendankara.com/gizlilik-politikasi.html`
   - Terms & Conditions: Include link in app description or Settings

2. **App Review Information**:
   - Notes: "Privacy Policy, Terms & Conditions, and Company Info (Künye) are accessible from Settings screen"

### Google Play Console

1. **Store Listing → Privacy Policy**:
   - URL: `https://trendankara.com/gizlilik-politikasi.html`

2. **Store Listing → App Content**:
   - Provide links to all legal pages when prompted

---

## Testing Checklist

Before submitting to app stores:

### Accessibility Tests
- [ ] All legal page links open successfully
- [ ] Pages load in < 3 seconds on mobile network
- [ ] Pages are readable on smallest supported device (iPhone SE, small Android)
- [ ] All links within pages work (email, website)
- [ ] Turkish characters display correctly (ş, ğ, ı, ö, ü, ç)

### Functional Tests
- [ ] Links open in-app browser (if implemented)
- [ ] Back navigation works correctly
- [ ] External browser fallback works (if implemented)
- [ ] First-run acceptance flow works (if implemented)
- [ ] Settings screen displays all legal links

### Platform Tests
- [ ] iOS: Privacy Policy link in App Store Connect
- [ ] Android: Privacy Policy link in Play Console
- [ ] Both platforms: Links accessible from Settings

---

## Screenshots for App Stores

Recommended to include a screenshot showing:
- Settings screen with legal links clearly visible
- Or a dedicated "About" screen showing company info

---

## Page Descriptions for App Team

### Gizlilik Politikası (Privacy Policy)
**Purpose**: Explains what data the app collects and how it's used
**Language**: Turkish (primary), English (optional)
**Required**: YES - by both app stores
**Content**: Data collection, usage, storage, user rights

### Kullanım Koşulları (Terms & Conditions)
**Purpose**: Legal agreement between user and company
**Language**: Turkish (primary), English (optional)
**Required**: YES - by both app stores
**Content**: Service terms, user obligations, limitations, governing law

### Künye (Company Identity/Imprint)
**Purpose**: Turkish radio broadcasting license requirement
**Language**: Turkish only (legal requirement)
**Required**: YES - by Turkish law for radio broadcasters
**Content**: Company info, license details, contact information, responsible persons

---

## URL Constants for Code

Create a constants file for easy management:

```typescript
// constants/legalUrls.ts
export const LEGAL_URLS = {
  privacyPolicy: {
    tr: 'https://trendankara.com/gizlilik-politikasi.html',
    en: 'https://trendankara.com/privacy-policy.html'
  },
  termsAndConditions: {
    tr: 'https://trendankara.com/kullanim-kosullari.html',
    en: 'https://trendankara.com/terms-and-conditions.html'
  },
  kunye: 'https://trendankara.com/kunye.html'
} as const;

export const LEGAL_PAGES = [
  {
    title: 'Gizlilik Politikası',
    titleEn: 'Privacy Policy',
    url: LEGAL_URLS.privacyPolicy.tr,
    icon: 'privacy-tip'
  },
  {
    title: 'Kullanım Koşulları',
    titleEn: 'Terms & Conditions',
    url: LEGAL_URLS.termsAndConditions.tr,
    icon: 'description'
  },
  {
    title: 'Künye',
    titleEn: 'Company Info',
    url: LEGAL_URLS.kunye,
    icon: 'info'
  }
] as const;
```

---

## Frequently Asked Questions

### Q: Do all three pages need to be in the app?

**A**: YES.
- Privacy Policy: Required by Apple & Google
- Terms & Conditions: Required by Apple & Google
- Künye: Required by Turkish law for radio broadcasters

### Q: Can I only show Turkish versions?

**A**: YES. Since TrendAnkara targets Turkish users, Turkish-only is acceptable. English versions are available as bonus.

### Q: Should I use in-app browser or external browser?

**A**: **In-app browser recommended** for better user experience. Users can read terms without leaving the app.

### Q: Do I need to show these on first run?

**A**: Not mandatory, but **highly recommended**. Many apps show Terms & Privacy on first launch with an acceptance checkbox.

### Q: Can I cache these pages locally?

**A**: **Not recommended**. Legal pages may update, and you want users to always see the latest version. Load from web.

### Q: What if the page doesn't load?

**A**: Handle gracefully:
```typescript
<WebView
  source={{ uri: url }}
  onError={(error) => {
    Alert.alert(
      'Bağlantı Hatası',
      'Sayfa yüklenemedi. Lütfen internet bağlantınızı kontrol edin.',
      [
        { text: 'Tekrar Dene', onPress: () => reload() },
        { text: 'Kapat', onPress: () => navigation.goBack() }
      ]
    );
  }}
/>
```

---

## Support

For questions about legal page integration:

- **Technical Issues**: Check API response and WebView logs
- **Content Questions**: Contact backend/legal team
- **Store Submission**: Review App Store Connect / Play Console guidelines

---

## Change Log

### October 19, 2025
- Initial documentation
- Added all three required pages
- Included React Native code examples
- Added testing checklist

---

**Implementation Priority**: 🔴 CRITICAL
**Estimated Time**: 2-4 hours
**Difficulty**: Easy

**Happy Integrating! 📱⚖️**
