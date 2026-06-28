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
  final String? dob;
  final String? gender;
  final String? city;
  final String? avatar;
  final String? referralCode;
  final num walletBalance;
  final num rewardPoints;
  final String tier;
  final int memberSince;
  final int upcomingTrips;
  const Profile({
    required this.name,
    required this.phone,
    this.email,
    this.cnic,
    this.dob,
    this.gender,
    this.city,
    this.avatar,
    this.referralCode,
    required this.walletBalance,
    required this.rewardPoints,
    required this.tier,
    required this.memberSince,
    required this.upcomingTrips,
  });

  factory Profile.fromJson(Map<String, dynamic> j) => Profile(
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        email: j['email'],
        cnic: j['cnic'],
        dob: j['dob'],
        gender: j['gender'],
        city: j['city'],
        avatar: j['avatar'],
        referralCode: j['referralCode'],
        walletBalance: j['walletBalance'] ?? 0,
        rewardPoints: j['rewardPoints'] ?? 0,
        tier: j['tier'] ?? 'Member',
        memberSince: (j['memberSince'] ?? DateTime.now().year) as int,
        upcomingTrips: j['upcomingTrips'] ?? 0,
      );
}

class WalletTx {
  final String desc;
  final num amount;
  final String kind; // credit | debit
  final String date;
  const WalletTx({required this.desc, required this.amount, required this.kind, required this.date});

  factory WalletTx.fromJson(Map<String, dynamic> j) => WalletTx(
        desc: j['desc'] ?? '',
        amount: j['amount'] ?? 0,
        kind: j['kind'] ?? 'credit',
        date: j['date']?.toString() ?? '',
      );
}

class Wallet {
  final num balance;
  final List<WalletTx> transactions;
  const Wallet({required this.balance, required this.transactions});

  factory Wallet.fromJson(Map<String, dynamic> j) => Wallet(
        balance: j['balance'] ?? 0,
        transactions: (j['transactions'] as List?)?.map((e) => WalletTx.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
      );
}

class Traveller {
  final String name;
  final String relation;
  final String cnic;
  final String gender;
  const Traveller({required this.name, required this.relation, required this.cnic, required this.gender});

  factory Traveller.fromJson(Map<String, dynamic> j) => Traveller(
        name: j['name'] ?? '',
        relation: j['relation'] ?? 'Family',
        cnic: j['cnic'] ?? '—',
        gender: j['gender'] ?? 'Male',
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
  final String? originTerminal;
  final String? destinationTerminal;
  final String? departAt;
  final String operator;
  final String operatorColor;
  final String? vehicle;
  final List<String> seats;
  final List<Passenger> passengers;
  final num total;
  final String? contactName;
  final String? contactPhone;

  const Ticket({
    required this.id,
    required this.ref,
    required this.status,
    required this.serviceType,
    required this.title,
    this.originTerminal,
    this.destinationTerminal,
    this.departAt,
    required this.operator,
    required this.operatorColor,
    this.vehicle,
    required this.seats,
    required this.passengers,
    required this.total,
    this.contactName,
    this.contactPhone,
  });

  bool get isCancelled => status == 'CANCELLED';

  factory Ticket.fromJson(Map<String, dynamic> j) => Ticket(
        id: j['id'] ?? '',
        ref: j['ref'] ?? '',
        status: j['status'] ?? '',
        serviceType: j['serviceType'] ?? '',
        title: j['title'] ?? '',
        originTerminal: j['originTerminal'],
        destinationTerminal: j['destinationTerminal'],
        departAt: j['departAt'],
        operator: j['operator'] ?? '',
        operatorColor: j['operatorColor'] ?? '#1d4ed8',
        vehicle: j['vehicle'],
        seats: (j['seats'] as List?)?.cast<String>() ?? const [],
        passengers: (j['passengers'] as List?)?.map((e) => Passenger.fromJson(e)).toList() ?? const [],
        total: (j['fare']?['total']) ?? 0,
        contactName: j['contact']?['name'],
        contactPhone: j['contact']?['phone'],
      );
}

class Review {
  final int rating;
  final String comment;
  final String authorName;

  const Review({required this.rating, required this.comment, required this.authorName});

  factory Review.fromJson(Map<String, dynamic> j) => Review(
        rating: (j['rating'] ?? 0) as int,
        comment: j['comment'] ?? '',
        authorName: j['authorName'] ?? 'Traveller',
      );
}
