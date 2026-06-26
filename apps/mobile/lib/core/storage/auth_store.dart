import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/api_models.dart';

/// Persists the JWT + the logged-in user across app launches.
class AuthStore {
  static const _kToken = 'bookie_token';
  static const _kUser = 'bookie_user';

  final SharedPreferences _prefs;
  AuthStore(this._prefs);

  String? get token => _prefs.getString(_kToken);
  bool get isLoggedIn => token != null;

  AuthUser? get user {
    final raw = _prefs.getString(_kUser);
    if (raw == null) return null;
    return AuthUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> save(String token, AuthUser user) async {
    await _prefs.setString(_kToken, token);
    await _prefs.setString(_kUser, jsonEncode(user.toJson()));
  }

  Future<void> clear() async {
    await _prefs.remove(_kToken);
    await _prefs.remove(_kUser);
  }
}
