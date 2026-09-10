# 🛡️ Rakshak AI (रक्षक AI)
> **Your Intelligent Guardian Against Digital Fraud**

[![React Native](https://img.shields.io/badge/React_Native-0.81-blue.svg?style=flat&logo=react)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK_54-black.svg?style=flat&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Academic_Research-green.svg)](#)

**Rakshak AI** is a privacy-first, on-device mobile security system designed to protect citizens, vulnerable demographics (such as senior citizens), and mobile users from social engineering attacks, digital arrest scams, OTP theft, fake utility disconnection threats, and financial cyber frauds.

---

## 📌 Problem Statement
With the rapid acceleration of digital transactions and UPI in India, cyber criminals deploy sophisticated social engineering tactics:
- **Digital Arrest Scams**: Threatening calls/messages impersonating CBI, Police, or Customs demanding instant compliance.
- **Utility Bill Fraud**: Fake SMS alerts threatening power or electricity disconnection within hours.
- **Banking KYC / OTP Phishing**: Urgency-driven links mimicking official portals to steal credentials.
- **Part-Time Job / Lottery Scams**: Advance-fee fraud promising lucrative tasks or lucky draw rewards.

**Rakshak AI** addresses this challenge through automated pattern analysis, risk scoring, threat heuristics, and local database transparency—without sending sensitive private user SMS to external cloud servers.

---

## ✨ Key Features

- 🔒 **Privacy-First On-Device Processing**: Analyzes message structures locally on the device CPU without cloud data exfiltration.
- ⚡ **Real-Time Threat Classifier**: Rapid heuristics and semantic vector checks evaluating urgency, fear coercion, impersonation, and unverified callback sources.
- 📊 **Dynamic Risk Scoring**: Categorizes messages into Safe, Caution, or High Danger tiers with explicit remediation advice.
- 🗄️ **Local SQLite Database Inspector**: An interactive Developer Tools console enabling full inspection of schema, profile configurations, and scanned threat history records.
- 🚨 **Emergency SOS Protection**: Immediate one-tap dialing for the National Cyber Crime Helpline (**1930**) and bank card blocking protocols.
- 🌐 **Multilingual Support**: Tailored for regional languages (English, Hindi, Tamil, Telugu, Kannada).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Framework** | React Native (Expo SDK 54) |
| **Language** | TypeScript |
| **State Management** | Zustand (with persistent AsyncStorage storage) |
| **Design System** | React Native Paper (MD3), React Native Reanimated |
| **Navigation** | React Navigation (Stack + Bottom Tabs) |
| **Build & Distribution** | EAS Build (Android Standalone APK) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on an Android device or Android Emulator

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Manoj-Kumar-V-008/Rakshak_SIP.git
   cd Rakshak_SIP
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the local development server**:
   ```bash
   npx expo start --tunnel -c
   ```

4. **Run on Mobile Device**:
   Scan the generated QR code in your terminal using the **Expo Go** app on your Android device.

---

## 🎯 Academic Project Objectives (SIP)

1. **Dataset Collection & Preparation**: Curating annotated fraud and genuine text messages representing Indian cyber fraud scenarios.
2. **NLP Preprocessing**: Tokenization, semantic pattern extraction, and threat indicator analysis.
3. **Machine Learning Model Development**: Building predictive classifiers (e.g., Naive Bayes, Logistic Regression, SVM) to distinguish fraudulent communications.
4. **Risk Indicator Identification**: Isolating coercion vectors including urgency, financial solicitation, impersonation, and shortened links.
5. **Real-time Mobile Prototype**: Developing an accessible, understandable mobile defense tool for everyday citizens.
6. **Empirical Evaluation**: Validating classification accuracy, usability, and robustness across varied test cases.

---

## 👥 Authors & Academic Context
* **Project**: Rakshak AI - Summer Internship Project (SIP)
* **Author**: Manoj Kumar V ([@Manoj-Kumar-V-008](https://github.com/Manoj-Kumar-V-008))
* **Repository**: [https://github.com/Manoj-Kumar-V-008/Rakshak_SIP](https://github.com/Manoj-Kumar-V-008/Rakshak_SIP)
