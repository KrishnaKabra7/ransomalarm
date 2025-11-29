# Social Alarm 🔔

A React Native/Expo app that makes waking up social! This alarm app requires a code from a friend to dismiss the alarm, ensuring you actually wake up.

## Features

### 🔐 Firebase Authentication
- Secure email/password login and registration
- Persistent authentication state

### 📱 Social TOTP (Time-based One-Time Password)
- **Generate QR Code**: Create a unique QR code that your friend can scan
- **Scan Friend's QR**: Link with your friends by scanning their QR codes
- **Rotating 6-digit Code**: Codes refresh every 30 seconds (using `otpauth`)

### ⏰ The Lock
- When your alarm rings, the screen locks
- Back button and gesture navigation are disabled
- Alarm audio loops continuously until dismissed

### ✅ Dismiss Mechanism
- To dismiss the alarm, you MUST enter the current code from your linked friend's phone
- Wrong code? The alarm keeps ringing!
- This forces you to actually wake up and communicate with someone

### 🛡️ Anti-Cheat Protection
- Alarm state is persisted in AsyncStorage
- Even if you force-close the app, the alarm will re-trigger when you open it again
- No cheating your way out of waking up!

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator / Physical device with Expo Go

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KrishnaKabra7/ransomalarm.git
cd ransomalarm
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Email/Password authentication
   - Create a `.env` file (or set environment variables) with your Firebase config:
   
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm start
```

5. Run on your device:
   - Press `a` for Android
   - Press `i` for iOS
   - Scan the QR code with Expo Go app

## Project Structure

```
├── App.tsx                 # Main app with navigation
├── src/
│   ├── config/
│   │   └── firebase.ts     # Firebase configuration
│   ├── context/
│   │   ├── AuthContext.tsx # Authentication state management
│   │   └── AlarmContext.tsx # Alarm state management
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Login/Sign up screen
│   │   ├── HomeScreen.tsx       # Main dashboard
│   │   ├── CreateAlarmScreen.tsx # Create new alarm
│   │   ├── AlarmRingingScreen.tsx # Lock screen when alarm triggers
│   │   ├── GenerateQRScreen.tsx   # Generate QR for friends
│   │   ├── ScanQRScreen.tsx       # Scan friend's QR code
│   │   └── FriendCodeScreen.tsx   # Show friend's rotating code
│   ├── services/
│   │   ├── totp.ts          # TOTP generation/validation
│   │   └── storage.ts       # AsyncStorage operations
│   └── types/
│       └── index.ts         # TypeScript types
├── package.json
└── app.json                 # Expo configuration
```

## How It Works

1. **Setup Phase**:
   - User A creates an account and generates a QR code
   - Friend B scans User A's QR code (linking them)
   - Now Friend B's app shows a rotating 6-digit code synced to User A

2. **Alarm Phase**:
   - User A sets an alarm linked to Friend B
   - When the alarm rings, the screen locks with a code entry field
   - User A must call/text Friend B to get the current code
   - Only the correct code dismisses the alarm

3. **Anti-Cheat**:
   - If User A force-closes the app, the alarm state persists
   - Reopening the app immediately shows the lock screen
   - There's no escape without the correct code!

## Technologies Used

- **React Native** with **Expo** (SDK 54)
- **TypeScript** for type safety
- **Firebase Authentication** for user management
- **otpauth** for TOTP generation/validation
- **AsyncStorage** for persistent state
- **expo-camera** for QR code scanning
- **react-native-qrcode-svg** for QR code generation
- **expo-av** for alarm audio
- **React Navigation** for screen management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Expo team for making React Native development easier
- Inspired by the need for a more effective wake-up solution 😄