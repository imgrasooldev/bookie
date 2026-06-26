// API DTOs that mirror the backend serializers (apps/api/src/lib/serialize.ts
// and the /account, /auth responses). Trip/City/Operator live in models.dart.

class AuthUser {
  final String id;
  final String name;
  final String phone;
  final String? email;
  const AuthUser({required this.id, required this.name, required this.phone, this.email});

  factory AuthUser.fromJson(Map<String, dynamic> j) =>
      AuthUser(id: j['id'] ?? '', name: j['name'] ?? '', phone: j['phone'] ?? '', email: j['email']);

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'phone': phone, 'email': email};
}

class Profile {
  final String name;
  final String phone;
  final String? email;
  final String? cnic;
  final String? city;
  final num walletBalance;
  final num rewardPoints;
  final String tier;
  final int upcomingTrips;
  const Profile({
    required this.name,
    required this.phone,
    this.email,
    this.cnic,
    this.city,
    required this.walletBalance,
    required this.rewardPoints,
    required this.tier,
    required this.upcomingTrips,
  });

  factory Profile.fromJson(Map<String, dynamic> j) => Profile(
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        email: j['email'],
        cnic: j['cnic'],
        city: j['city'],
        walletBalance: j['walletBalance'] ?? 0,
        rewardPoints: j['rewardPoints'] ?? 0,
        tier: j['tier'] ?? 'Member',
        upcomingTrips: j['upcomingTrips'] ?? 0,
      );
}

class Passenger {
  final String name;
  final String? gender; // M | F
  final String? seatLabel;
  const Passenger({required this.name, this.gender, this.seatLabel});

  factory Passenger.fromJson(Map<String, dynamic> j) =>
      Passenger(name: j['name'] ?? '', gender: j['gender'], seatLabel: j['seatLabel']);

  Map<String, dynamic> toJson() => {'name': name, if (gender != null) 'gender': gender, if (seatLabel != null) 'seatLabel': seatLabel};
}

class Ticket {
  final String id;
  final String ref;
  final String status;
  final String serviceType;
  final String title;
  final String? departAt;
  final String operator;
  final String operatorColor;
  final String? vehicle;
  final List<String> seats;
  final List<Passenger> passengers;
  final num total;

  const Ticket({
    required this.id,
    required this.ref,
    required this.status,
    required this.serviceType,
    required this.title,
    this.departAt,
    required this.operator,
    required this.operatorColor,
    this.vehicle,
    required this.seats,
    required this.passengers,
    required this.total,
  });

  bool get isCancelled => status == 'CANCELLED';

  factory Ticket.fromJson(Map<String, dynamic> j) => Ticket(
        id: j['id'] ?? '',
        ref: j['ref'] ?? '',
        status: j['status'] ?? '',
        serviceType: j['serviceType'] ?? '',
        title: j['title'] ?? '',
        departAt: j['departAt'],
        operator: j['operator'] ?? '',
        operatorColor: j['operatorColor'] ?? '#1d4ed8',
        vehicle: j['vehicle'],
        seats: (j['seats'] as List?)?.cast<String>() ?? const [],
        passengers: (j['passengers'] as List?)?.map((e) => Passenger.fromJson(e)).toList() ?? const [],
        total: (j['fare']?['total']) ?? 0,
      );
}
