import '../../core/network/api_client.dart';
import '../../core/storage/auth_store.dart';
import '../models/api_models.dart';

class AuthRepository {
  final ApiClient _api;
  final AuthStore _store;
  AuthRepository(this._api, this._store);

  AuthUser? get currentUser => _store.user;
  bool get isLoggedIn => _store.isLoggedIn;

  Future<AuthUser> login({required String identifier, required String password}) async {
    final res = await _api.dio.post('/auth/login', data: {'identifier': identifier, 'password': password});
    return _persist(res.data);
  }

  Future<AuthUser> register({
    required String name,
    required String phone,
    String? email,
    required String password,
  }) async {
    final res = await _api.dio.post('/auth/register', data: {
      'name': name,
      'phone': phone,
      if (email != null && email.isNotEmpty) 'email': email,
      'password': password,
    });
    return _persist(res.data);
  }

  /// Ask the server to SMS a login code. Returns the dev-mode code when no SMS
  /// provider is configured (so QA can complete the flow); null in production.
  Future<String?> requestOtp(String phone) async {
    final res = await _api.dio.post('/auth/otp/request', data: {'phone': phone});
    return (res.data as Map)['devCode'] as String?;
  }

  /// Verify the SMS code and sign in (creating the account on first use).
  Future<AuthUser> verifyOtp({required String phone, required String code, String? name}) async {
    final res = await _api.dio.post('/auth/otp/verify', data: {
      'phone': phone,
      'code': code,
      if (name != null && name.trim().isNotEmpty) 'name': name.trim(),
    });
    return _persist(res.data);
  }

  Future<Profile> profile() async {
    final res = await _api.dio.get('/account');
    return Profile.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Wallet> wallet() async {
    final res = await _api.dio.get('/account/wallet');
    return Wallet.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Traveller>> travellers() async {
    final res = await _api.dio.get('/account/travellers');
    return (res.data as List).map((e) => Traveller.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> logout() => _store.clear();

  Future<AuthUser> _persist(dynamic data) async {
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    await _store.save(data['token'] as String, user);
    return user;
  }
}
