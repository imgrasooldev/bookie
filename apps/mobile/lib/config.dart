import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Deployed (production) API on Fly.io. When set, it overrides every dev/LAN
/// default below — this is what release / store builds hit. Set to null to fall
/// back to local development (LAN IP / emulator).
const String? prodApiUrl = 'https://bookie-api.fly.dev';

/// Set this to your computer's LAN IP when running on a PHYSICAL device in DEV
/// (phone and PC on the same Wi-Fi). Find it with `ipconfig` (Windows) /
/// `ifconfig` (mac/Linux). Ignored when prodApiUrl is set.
const String? lanHost = '192.168.0.111';

const int apiPort = 4000;

/// Base URL of the Bookie API.
/// - Production       -> prodApiUrl (https://bookie-api.fly.dev)
/// - Physical device  -> http://<lanHost>:4000
/// - Android emulator -> http://10.0.2.2:4000 (host loopback alias)
/// - iOS simulator / web -> http://localhost:4000
String get apiBaseUrl {
  if (prodApiUrl != null) return prodApiUrl!;
  if (lanHost != null) return 'http://$lanHost:$apiPort';
  if (kIsWeb) return 'http://localhost:$apiPort';
  if (Platform.isAndroid) return 'http://10.0.2.2:$apiPort';
  return 'http://localhost:$apiPort';
}
