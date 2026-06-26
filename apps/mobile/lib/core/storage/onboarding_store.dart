import 'package:shared_preferences/shared_preferences.dart';

/// Remembers whether the first-run walkthrough has been shown.
class OnboardingStore {
  static const _key = 'onboarding_seen_v1';
  final SharedPreferences _prefs;
  OnboardingStore(this._prefs);

  bool get seen => _prefs.getBool(_key) ?? false;
  Future<void> markSeen() => _prefs.setBool(_key, true);
}
