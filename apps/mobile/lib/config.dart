import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Set this to your computer's LAN IP when running on a PHYSICAL device
/// (phone and PC must be on the same Wi-Fi). Find it with `ipconfig`
/// (Windows) / `ifconfig` (mac/Linux). Set to null to use emulator defaults.
const String? lanHost = '192.168.1.4';

const int apiPort = 4000;

/// Base URL of the Bookie API (apps/api).
/// - Physical device  -> http://<lanHost>:4000
/// - Android emulator -> http://10.0.2.2:4000 (host loopback alias)
/// - iOS simulator / web -> http://localhost:4000
String get apiBaseUrl {
  if (lanHost != null) return 'http://$lanHost:$apiPort';
  if (kIsWeb) return 'http://localhost:$apiPort';
  if (Platform.isAndroid) return 'http://10.0.2.2:$apiPort';
  return 'http://localhost:$apiPort';
}
