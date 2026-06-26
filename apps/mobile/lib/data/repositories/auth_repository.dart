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

  Future<Profile> profile() async {
    final res = await _api.dio.get('/account');
    return Profile.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> logout() => _store.clear();

  Future<AuthUser> _persist(dynamic data) async {
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    await _store.save(data['token'] as String, user);
    return user;
  }
}
