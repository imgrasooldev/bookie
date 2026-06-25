import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Toggle to hit the real backend instead of bundled mock data.
/// When true, the app uses [apiBaseUrl] below.
const bool useMock = true;

/// Base URL of the Bookie API (apps/api).
/// Android emulator reaches the host machine via 10.0.2.2.
String get apiBaseUrl {
  if (kIsWeb) return 'http://localhost:4000';
  if (Platform.isAndroid) return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}
