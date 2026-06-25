import 'dart:convert';
import 'package:http/http.dart' as http;

import 'config.dart';
import 'models.dart';
import 'mock_data.dart' as mock;

/// Data access seam — serves bundled mock data or the real API depending on
/// [useMock] in config.dart. Return shapes are identical either way.
class Api {
  static Future<List<Vertical>> verticals() async {
    if (useMock) return mock.verticals;
    final j = await _getList('/verticals');
    return j.map((e) => Vertical.fromJson(e)).toList();
  }

  static Future<List<City>> cities() async {
    if (useMock) return mock.cities;
    final j = await _getList('/cities');
    return j.map((e) => City.fromJson(e)).toList();
  }

  static Future<List<Trip>> searchTrips({
    required String serviceType,
    String? originId,
    String? destinationId,
  }) async {
    if (useMock) {
      return mock.trips.where((t) {
        if (t.serviceType != serviceType) return false;
        return true;
      }).toList();
    }
    final params = <String, String>{'serviceType': serviceType};
    if (originId != null) params['originId'] = originId;
    if (destinationId != null) params['destinationId'] = destinationId;
    final uri = Uri.parse('$apiBaseUrl/trips').replace(queryParameters: params);
    final res = await http.get(uri);
    return (jsonDecode(res.body) as List)
        .map((e) => Trip.fromJson(e))
        .toList();
  }

  static Future<Trip?> getTrip(String id) async {
    if (useMock) {
      for (final t in mock.trips) {
        if (t.id == id) return t;
      }
      return null;
    }
    final res = await http.get(Uri.parse('$apiBaseUrl/trips/$id'));
    if (res.statusCode != 200) return null;
    return Trip.fromJson(jsonDecode(res.body));
  }

  static Future<List<dynamic>> _getList(String path) async {
    final res = await http.get(Uri.parse('$apiBaseUrl$path'));
    return jsonDecode(res.body) as List;
  }
}
