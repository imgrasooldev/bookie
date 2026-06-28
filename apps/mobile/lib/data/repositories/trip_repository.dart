import '../../core/network/api_client.dart';
import '../../models.dart';

class TripRepository {
  final ApiClient _api;
  TripRepository(this._api);

  Future<List<City>> cities() async {
    final res = await _api.dio.get('/cities');
    return (res.data as List).map((e) => City.fromJson(e)).toList();
  }

  Future<List<PopularRoute>> popularRoutes() async {
    final res = await _api.dio.get('/routes/popular', queryParameters: {'serviceType': 'BUS', 'limit': 5});
    return (res.data as List).map((e) => PopularRoute.fromJson(e)).toList();
  }

  /// The vertical types the admin has switched on (e.g. ['BUS','CAR']).
  Future<List<String>> enabledVerticals() async {
    final res = await _api.dio.get('/verticals');
    return (res.data as List).map((e) => (e['type'] ?? '').toString()).where((t) => t.isNotEmpty).toList();
  }

  Future<List<Trip>> search({
    required String serviceType,
    String? originId,
    String? destinationId,
    String? date,
  }) async {
    final res = await _api.dio.get('/trips', queryParameters: {
      'serviceType': serviceType,
      if (originId != null) 'originId': originId,
      if (destinationId != null) 'destinationId': destinationId,
      if (date != null) 'date': date,
    });
    return (res.data as List).map((e) => Trip.fromJson(e)).toList();
  }

  Future<Trip> trip(String id, {String? date}) async {
    final res = await _api.dio.get('/trips/$id', queryParameters: {if (date != null) 'date': date});
    return Trip.fromJson(res.data as Map<String, dynamic>);
  }
}
