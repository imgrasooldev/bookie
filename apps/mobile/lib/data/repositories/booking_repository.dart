import '../../core/network/api_client.dart';
import '../models/api_models.dart';

class BookingRepository {
  final ApiClient _api;
  BookingRepository(this._api);

  /// Create a booking and return the full ticket.
  Future<Ticket> create({
    required String tripId,
    String? originId,
    String? destinationId,
    String? date,
    List<String>? seats,
    int? quantity,
    required List<Passenger> passengers,
    required Map<String, dynamic> contact,
    required String paymentMethod,
  }) async {
    final res = await _api.dio.post('/bookings', data: {
      'tripId': tripId,
      if (originId != null) 'originId': originId,
      if (destinationId != null) 'destinationId': destinationId,
      if (date != null) 'date': date,
      if (seats != null) 'seats': seats,
      if (quantity != null) 'quantity': quantity,
      'passengers': passengers.map((p) => p.toJson()).toList(),
      'contact': contact,
      'paymentMethod': paymentMethod,
    });
    return get(res.data['id'] as String);
  }

  Future<List<Ticket>> mine() async {
    final res = await _api.dio.get('/bookings/mine');
    return (res.data as List).map((e) => Ticket.fromJson(e)).toList();
  }

  Future<Ticket> get(String id) async {
    final res = await _api.dio.get('/bookings/$id');
    return Ticket.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Ticket> cancel(String id) async {
    final res = await _api.dio.post('/bookings/$id/cancel');
    return Ticket.fromJson(res.data as Map<String, dynamic>);
  }
}
