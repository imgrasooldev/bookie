import 'package:dio/dio.dart';
import '../../config.dart';
import '../storage/auth_store.dart';

/// Thin Dio wrapper. Injects the bearer token on every request and normalises
/// backend errors ({ "error": "..." }) into readable messages.
class ApiClient {
  final Dio dio;

  ApiClient(AuthStore store)
      : dio = Dio(BaseOptions(
          baseUrl: apiBaseUrl,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'content-type': 'application/json'},
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = store.token;
        if (token != null) options.headers['authorization'] = 'Bearer $token';
        handler.next(options);
      },
    ));
  }
}

/// Turn a DioException into a user-facing message.
String apiError(Object e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map && data['error'] is String) return data['error'] as String;
    if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
      return 'Could not reach the server. Check your connection.';
    }
    return 'Something went wrong (${e.response?.statusCode ?? 'network'}).';
  }
  return 'Something went wrong.';
}
