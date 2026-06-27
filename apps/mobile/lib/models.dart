// Domain models — mirror apps/web/src/lib/types.ts and the API JSON shapes.

class Vertical {
  final String type; // BUS | CAR | PICNIC | CORPORATE
  final String label;
  final String tagline;
  final String icon; // emoji
  final String flavor; // SCHEDULED_SEAT | ON_DEMAND_RIDE | CHARTER

  const Vertical({
    required this.type,
    required this.label,
    required this.tagline,
    required this.icon,
    required this.flavor,
  });

  factory Vertical.fromJson(Map<String, dynamic> j) => Vertical(
        type: j['type'],
        label: j['label'],
        tagline: j['tagline'],
        icon: j['icon'],
        flavor: j['flavor'],
      );
}

class City {
  final String id;
  final String name;
  const City({required this.id, required this.name});

  factory City.fromJson(Map<String, dynamic> j) =>
      City(id: j['id'], name: j['name']);
}

class Operator {
  final String id;
  final String name;
  final double rating;
  final String logoColor;
  const Operator({
    required this.id,
    required this.name,
    required this.rating,
    required this.logoColor,
  });

  factory Operator.fromJson(Map<String, dynamic> j) => Operator(
        id: j['id'],
        name: j['name'],
        rating: (j['rating'] as num).toDouble(),
        logoColor: j['logoColor'],
      );
}

class Trip {
  final String id;
  final String serviceType;
  final Operator operator;
  final String title;
  final String? originTerminal; // boarding point name
  final String? destinationTerminal; // drop-off point name
  final String? departAt;
  final String? arriveAt;
  final int? durationMin;
  final num price;
  final String priceUnit; // per_seat | fixed | from
  final int? seatsAvailable;
  final String? vehicle;
  final List<String> amenities;
  final List<String> bookedSeats; // populated by GET /trips/:id
  final List<TripMedia> media; // operator's vehicle photos/videos
  final num? rating; // display rating (review average once reviewed)
  final int ratingCount; // number of customer reviews
  final List<String> businessSeats; // seat labels in business/executive class
  final num businessSurcharge; // extra PKR per business seat

  const Trip({
    required this.id,
    required this.serviceType,
    required this.operator,
    required this.title,
    this.originTerminal,
    this.destinationTerminal,
    this.departAt,
    this.arriveAt,
    this.durationMin,
    required this.price,
    required this.priceUnit,
    this.seatsAvailable,
    this.vehicle,
    required this.amenities,
    this.bookedSeats = const [],
    this.media = const [],
    this.rating,
    this.ratingCount = 0,
    this.businessSeats = const [],
    this.businessSurcharge = 0,
  });

  bool get isQuote => price == 0;

  factory Trip.fromJson(Map<String, dynamic> j) => Trip(
        id: j['id'],
        serviceType: j['serviceType'],
        operator: Operator.fromJson(j['operator']),
        title: j['title'],
        originTerminal: j['originTerminal'],
        destinationTerminal: j['destinationTerminal'],
        departAt: j['departAt'],
        arriveAt: j['arriveAt'],
        durationMin: j['durationMin'],
        price: j['price'] ?? 0,
        priceUnit: j['priceUnit'] ?? 'from',
        seatsAvailable: j['seatsAvailable'],
        vehicle: j['vehicle'],
        amenities: (j['amenities'] as List?)?.cast<String>() ?? const [],
        bookedSeats: (j['bookedSeats'] as List?)?.cast<String>() ?? const [],
        media: (j['media'] as List?)?.map((e) => TripMedia.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
        rating: j['rating'] as num?,
        ratingCount: (j['ratingCount'] ?? 0) as int,
        businessSeats: (j['businessSeats'] as List?)?.cast<String>() ?? const [],
        businessSurcharge: (j['businessSurcharge'] ?? 0) as num,
      );
}

class TripMedia {
  final String kind; // image | video
  final String url; // relative, e.g. /uploads/xxx.png
  const TripMedia({required this.kind, required this.url});

  bool get isVideo => kind == 'video';

  factory TripMedia.fromJson(Map<String, dynamic> j) =>
      TripMedia(kind: j['kind'] ?? 'image', url: j['url'] ?? '');
}

class PopularRoute {
  final String originId;
  final String destinationId;
  final String originName;
  final String destinationName;
  final int count;
  const PopularRoute({
    required this.originId,
    required this.destinationId,
    required this.originName,
    required this.destinationName,
    required this.count,
  });

  factory PopularRoute.fromJson(Map<String, dynamic> j) => PopularRoute(
        originId: j['originId'] ?? '',
        destinationId: j['destinationId'] ?? '',
        originName: j['originName'] ?? '',
        destinationName: j['destinationName'] ?? '',
        count: j['count'] ?? 0,
      );
}
