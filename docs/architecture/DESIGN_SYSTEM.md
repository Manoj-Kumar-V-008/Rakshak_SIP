# Rakshak AI - Enterprise Design System Manual
**Design System Version**: 1.0.0
**Target Platform**: Android (Tailored for Accessibility and High Trust)

This manual outlines the complete, production-ready Design System specifications for **Rakshak AI (Your Intelligent Guardian Against Digital Fraud)**. It provides the guidelines, specifications, and layout rules for developers and designers to build a high-trust, accessible, and banking-grade security application.

---

## 1. Brand Foundation

### Brand Personality
Rakshak AI's brand personality represents the **"Intelligent Sentinel"**. It is:
* **Empathetic yet Authoritative**: Reassuring in moments of stress, firm and decisive in detecting and neutralizing hazards.
* **Calm & Measured**: Avoids flashing alarms, scary fonts, or red neon colors. It aims to reduce panic rather than cause it.
* **Transparent & Honest**: Communicates openly about on-device parsing to respect privacy.

### Brand Values & Psychological Alignment
1. **Trust (Viswas)**: Built through clear, simple layouts, structured alignment, and predictable interactions. Visual styling mimics banking interfaces to reassure users.
2. **Protection (Rakshak)**: Represented by rounded, solid card designs, deep protective colors (shield navy), and icons highlighting safety status.
3. **Privacy (Gopniyata)**: Emphasized through explicit visual labels marking local, off-device calculations, helping users feel secure about their data.
4. **Simplicity (Saralta)**: Tailored for non-technical users, especially senior citizens, with large tap zones, clean screens, and simple wording.
5. **Reliability (Dridhata)**: Established via consistent warning alerts and fast interface feedback, giving users clear, immediate information about security threats.

---

## 2. Color System

Colors are derived from HSL values to maintain visual contrast (WCAG AA compliant) in both dark and light modes. The palette uses deep blues to represent security, clean emerald greens for safety, and clear warm oranges/reds for alert statuses.

| Token Name | Hex Code | Visual Tone | Usage Guideline | Psychological Alignment |
| :--- | :--- | :--- | :--- | :--- |
| **Primary (Shield Navy)** | `#0D1B2A` | Light Mode base / Dark theme text | Primary brand background; represents structural authority and security. | Evokes stability, banking-grade safety, and institutional trust. |
| **Secondary (Guard Blue)** | `#1B4965` | Main theme primary button | Secondary actions, branding cards, headers. | Reassuringly calm; communicates vigilance and active protection. |
| **Accent (Electric Cobalt)** | `#3A86C8` | Visual highlights / Active icons | Dynamic UI states, active tab indicators, buttons. | Communicates intelligent technology, precision, and modern protection. |
| **Success (Emerald Green)** | `#10B981` | Safe states / Clean scans | Validated status badges, safe scam-score meters. | Universal color for safety, permission, and verified trust. |
| **Warning (Amber Orange)** | `#F59E0B` | Medium risk warning | Warning banners, suspicious message flags, caution scores. | Draws focused attention without causing immediate panic. |
| **Danger (Coral Red)** | `#EF4444` | High threat / Emergency | High-risk scams, emergency alerts, SOS widgets. | Demands immediate action; represents a stop gate for threats. |
| **Neutral Dark (Slate Grey)** | `#1E293B` | Base dark text / Backgrounds | Core typography, body copy, borders. | High-readability shade; neutral and easy on the eyes. |
| **Neutral Light (Ice Silver)** | `#F8FAFC` | Light Mode backgrounds | Canvas background, card containers. | Clean, structured, and free of clutter. |
| **Surface Dark** | `#0F172A` | Dark Mode card surface | Elevated panels, dialog screens. | Distinguishes content panels from the background canvas. |
| **Surface Light** | `#FFFFFF` | Light Mode card surface | Standard background for content cards. | Clean canvas to display threat scores and metrics. |
| **Border Dark** | `#334155` | Dark mode dividers | Card edges, text input lines. | Subtly groups layout blocks together. |
| **Border Light** | `#E2E8F0` | Light mode dividers | Input fields, card outlines. | Clean separations without adding visual clutter. |

---

## 3. Typography System

The typography uses the **Outfit** or **Inter** font family (imported from Google Fonts). These modern sans-serif typefaces are highly legible even at small sizes, making them suitable for elderly users.

| Typography Token | Weight | Font Size (pt) | Line Height (pt) | Usability Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Display Text** | Bold (700) | `32` | `40` | Big threat status callouts on the dashboard. |
| **Heading 1** | SemiBold (600) | `24` | `32` | Top level pages, screen names. |
| **Heading 2** | SemiBold (600) | `20` | `26` | Card title tags, major sections. |
| **Heading 3** | Medium (500) | `18` | `24` | Subsection titles, alert headers. |
| **Body Large** | Regular (400) | `16` | `22` | Key warning details, highly legible description text. |
| **Body Medium** | Regular (400) | `14` | `20` | Default body copy, descriptive lists. |
| **Body Small** | Regular (400) | `12` | `16` | Microcopy, permission notices, details. |
| **Caption** | Medium (500) | `10` | `14` | On-device calculation tags, timestamps. |
| **Button Text** | Bold (700) | `16` | `20` | Touch triggers. Bold to make choices clear. |

*Note: All fonts must scale automatically with the Android system font size settings. We use system density-independent pixels (`dp` / `sp`) instead of hardcoded point sizes.*

---

## 4. Spacing System

The system uses a **4px-base Grid System** (all sizing, padding, and margins are multiples of 4: `4, 8, 12, 16, 24, 32, 48, 64`).

```text
Spacing Scale:
├── xxs: 4px     --> Border padding, minor alignment tweaks
├── xs:  8px     --> Badge inner paddings, list item gaps
├── sm:  12px    --> Card component groupings, inner form gaps
├── md:  16px    --> Default outer screen padding, card internal margins
├── lg:  24px    --> Section separations, text block dividers
├── xl:  32px    --> Major headers separation, splash alignments
└── xxl: 48px+   --> Floating button offsets from bottom layout
```

### Screen Layout Rules
* **Canvas Margin**: Minimum of `16px` lateral margins on all screens. For tablets or landscape views, scale margins to `24px` or `32px`.
* **Alignment**: Left-aligned layouts are preferred for ease of reading, especially for non-native English readers and senior citizens.

---

## 5. Button System

Buttons use large, easily readable shapes with a minimum height of **48px** (supporting touch target guidelines) and rounded edges for a friendly appearance.

### Button Variants
1. **Primary Button**: Solid fill (`Guard Blue`), white text. Used for main actions (e.g., "Analyze Message", "Next Step").
2. **Secondary Button**: Tinted fill, darker text. Used for secondary actions (e.g., "Skip Tutorial", "View Details").
3. **Outline Button**: Transparent background, bordered outline. Used for low-priority actions (e.g., "Cancel", "Back").
4. **Danger Button**: Solid fill (`Coral Red`), white text. Used for warning options (e.g., "Decline Permission", "Report Scam").
5. **Success Button**: Solid fill (`Emerald Green`), white text. Used for successful paths (e.g., "Approve Safe Sender", "Resolve Incident").
6. **Icon Button**: Minimal circular icon container. Used for standard navigation actions (e.g., "Back arrow", "Settings gear").

### Visual Specifications
```text
Height:          Min 48px, Max 56px (High usability)
Border Radius:   8px (Aligns with professional fintech layouts)
Text Style:      Button Text Token (Bold 16px, center aligned)
States:
 ├── Default:    Solid semantic color
 ├── Focused:    Outline border ring around button
 ├── Pressed:    Color opacity shifts darker by 12%
 ├── Disabled:   Grey fill (#CBD5E1), white/grey text, opacity 0.5
 └── Loading:    Original color, text hidden, spinner indicator centered
```

---

## 6. Card System

Cards group related items together, helping users scan information easily and dividing complex layouts into manageable sections.

### Card Types
1. **Dashboard Card**: Clean container with a white or dark surface background. Used for metrics and security checks.
2. **Alert Card**: Highlights warnings with left-hand border colors matching danger levels (e.g., red for high risk, orange for warning).
3. **Risk Score Card**: Visual indicator with a progress ring or dial that clearly shows risk levels.
4. **Scam Category Card**: Visual grid cells with descriptive icons. Used to navigate through different scam types.
5. **Statistics Card**: Summarizes active metrics, such as blocked numbers or scanned texts.

### Card Styling Specifications
```text
Elevation (Shadow): Android: elevation 2 | iOS: shadowColor: #000, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: {y: 2}
Border Radius:      12px (Smooth, approachable look)
Padding:            16px (Consistent spacing around card contents)
Border Stroke:      1px thin border (Light: #E2E8F0, Dark: #334155) to keep items legible in dark mode.
```

---

## 7. Alert System

Alerts prioritize scam threats based on risk level. They are styled to draw attention immediately without overwhelming the user.

```text
Alert Priorities:
┌───────────────────────────────┐
│ [Critical Scam Alert]        │ --> Danger Red, Solid background, Flash alert icon
├───────────────────────────────┤
│ [Suspicious Warning Alert]   │ --> Warning Orange, Tinted background, Caution icon
├───────────────────────────────┤
│ [Information Alert]           │ --> Accent Blue, Tinted background, Info icon
└───────────────────────────────┘
```

### Alert Specifications
* **Critical Scam Alert (Level 1 - Red)**: Used for active threats (e.g., "Fake Investment Scheme detected!"). Features solid Red backgrounds, White text, and high-visibility alert icons.
* **Warning Alert (Level 2 - Orange)**: Used for suspicious activity (e.g., "Unknown sender sharing short link"). Features tinted orange backgrounds with dark orange borders and text.
* **Informational Alert (Level 3 - Blue)**: Used for educational or status notices (e.g., "Database updated successfully"). Features a muted blue layout.
* **Success Alert (Level 4 - Green)**: Used to confirm safe states (e.g., "Device Scan Clean"). Features a soft green layout.

---

## 8. Input System

Inputs are optimized for mobile touch targets, with clear borders to avoid confusion.

### Input Types
* **Text Input**: Basic text entry with clear label layouts.
* **Search Input**: Text field with a search magnifying glass icon on the left.
* **Message Analysis Input**: Multi-line text area (minimum height: `120px`) for copy-pasting suspicious messages.
* **Dropdown**: Select menu with a dropdown arrow icon.

### Input States
```text
Height:          Min 52px (Easy to tap on small screens)
Label:           Positioned above the input container
States:
 ├── Default:    Solid background, thin border outline (#E2E8F0)
 ├── Focus:      Active accent border (#3A86C8), width increased to 2px
 ├── Error:      Red border (#EF4444) with error text below the input field
 ├── Success:    Green border (#10B981) indicating a valid entry
 └── Disabled:   Light grey fill (#F1F5F9), text disabled, touch disabled
```

---

## 9. Iconography

Iconography is designed using clear, outline styles to maintain legibility. We recommend using **`Feather`** or **`MaterialCommunityIcons`** for their clean, modern shapes.

### Standard Icon Sizes
* **Navigation / Tab Icons**: `24px`
* **Card Accents**: `20px`
* **Form Indicators**: `18px`
* **Large Status Icons (e.g., Dashboard)**: `48px` to `64px`

### Icon Rules
1. **Security**: Shield shapes (`shield`, `shield-check`, `lock`).
2. **Risk**: Alert and warning symbols (`alert-triangle`, `alert-circle`, `eye-off`).
3. **Protection**: Sentinel or bell items (`bell`, `activity`, `heart`).
4. **Education**: Book and path items (`book-open`, `mortar-board`, `help-circle`).
5. **Profile**: User metadata elements (`user`, `settings`, `file-text`).

---

## 10. Bottom Navigation Bar

The bottom navigation bar is designed to be accessible, with clear icons and text labels to help users navigate easily.

```text
Navigation Layout:
┌────────────────────────────────────────────────────────┐
│   [Home]     [Scan]      [Learn]     [Alerts]  [Profile]│
│    (🏠)       (🔍)        (📖)        (🔔)       (👤)   │
└────────────────────────────────────────────────────────┘
```

### Visual Specifications
* **Active State**: Highlighted with `Accent Blue` for both the icon and label text.
* **Inactive State**: Gray color (`Slate Grey`) to keep the interface clean and reduce distractions.
* **Label Rules**: Text labels are always shown below the icons. Labels should not hide or scale on tap, as this can confuse elderly or non-technical users.

---

## 11. Dark Mode System

Dark mode is essential for security apps because it reduces eye strain during night use and helps conserve battery. The dark mode theme uses high-contrast colors to keep text readable.

### Contrast Rules
* Avoid pure black backgrounds (`#000000`) for content containers to prevent text ghosting. Use deep slate values (`#0B0F19`) instead.
* White text should use a light slate color (`#F8FAFC`) to reduce eye strain, while maintaining a contrast ratio of **4.5:1** or higher.

### Dark Mode Colors
```typescript
{
  background: '#0B0F19', // Deep night canvas background
  surface: '#151D30',    // Elevated card containers
  textPrimary: '#F8FAFC',// Crisp white body text
  textSecondary: '#94A3B8', // High-contrast grey subheaders
  border: '#2E3D5C'      // Dark layout separations
}
```

---

## 12. Accessibility System (WCAG 2.1 Compliant)

Rakshak AI prioritizes accessibility to support senior citizens and users with low digital literacy.

1. **Touch Targets**: All interactive elements (buttons, inputs, menu links) must have a touch target area of at least **48dp x 48dp** to prevent accidental clicks.
2. **Contrast Ratio**: Normal text must maintain a contrast ratio of at least **4.5:1** against the background. Large text (18pt and above) must maintain a contrast ratio of at least **3:1**.
3. **Typography Scaling**: Font sizes must use relative units (`sp` / `rem`) rather than fixed sizes, allowing the text to adjust to system accessibility settings.
4. **Clear Action Paths**: Form inputs must display clear error messages beneath them, rather than relying only on color indicators.

---

## 13. Future Scalability Plan

The design system is structured to support future expansion:
1. **AI Analysis UI**: The colors and layout rules accommodate cards with Gemini/OpenAI analysis tags, using custom icons (e.g., spark elements).
2. **Voice Protection Screen**: Includes layout rules for voice input screens, featuring audio waveform animations and large mic status buttons.
3. **Notification Monitors**: Designed with clear toggle list styles to let users configure accessibility permissions for message scanning.
4. **Multi-Language Support**: Spacing rules allow text to wrap cleanly to accommodate longer translations in regional languages (e.g., Hindi, Tamil, Telugu).
5. **Admin Portal**: Layout elements support analytical data tables and threat management lists.
