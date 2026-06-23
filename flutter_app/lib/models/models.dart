class User {
  final String id;
  final String firstName;
  final String lastName;
  final String hotelName;
  final String email;
  final String? createdAt;

  const User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.hotelName,
    required this.email,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id']?.toString() ?? '',
    firstName: j['firstName'] ?? '',
    lastName: j['lastName'] ?? '',
    hotelName: j['hotelName'] ?? '',
    email: j['email'] ?? '',
    createdAt: j['createdAt'],
  );

  String get initials => (firstName.isNotEmpty ? firstName[0] : 'H').toUpperCase();
  String get fullName => '$firstName $lastName'.trim();
}

class HotelProfile {
  final String hotelName;
  final String location;
  final int stars;
  final int totalRooms;

  const HotelProfile({
    required this.hotelName,
    required this.location,
    required this.stars,
    required this.totalRooms,
  });

  factory HotelProfile.fromJson(Map<String, dynamic> j) => HotelProfile(
    hotelName: j['hotelName'] ?? '',
    location: j['location'] ?? '',
    stars: (j['stars'] as num?)?.toInt() ?? 4,
    totalRooms: (j['totalRooms'] as num?)?.toInt() ?? 100,
  );

  Map<String, dynamic> toJson() => {
    'hotelName': hotelName,
    'location': location,
    'stars': stars,
    'totalRooms': totalRooms,
  };
}

class HotelMetrics {
  final double? occupancy;
  final double? adr;
  final double? revpar;
  final double? trevpar;
  final double? goppar;
  final double? revenueMtd;
  final double? roomRevenueMtd;
  final double? fbRevenueMtd;
  final double? profitMtd;
  final String? updatedAt;

  const HotelMetrics({
    this.occupancy,
    this.adr,
    this.revpar,
    this.trevpar,
    this.goppar,
    this.revenueMtd,
    this.roomRevenueMtd,
    this.fbRevenueMtd,
    this.profitMtd,
    this.updatedAt,
  });

  bool get hasData => updatedAt != null;

  factory HotelMetrics.fromJson(Map<String, dynamic> j) => HotelMetrics(
    occupancy: (j['occupancy'] as num?)?.toDouble(),
    adr: (j['adr'] as num?)?.toDouble(),
    revpar: (j['revpar'] as num?)?.toDouble(),
    trevpar: (j['trevpar'] as num?)?.toDouble(),
    goppar: (j['goppar'] as num?)?.toDouble(),
    revenueMtd: (j['revenueMtd'] as num?)?.toDouble(),
    roomRevenueMtd: (j['roomRevenueMtd'] as num?)?.toDouble(),
    fbRevenueMtd: (j['fbRevenueMtd'] as num?)?.toDouble(),
    profitMtd: (j['profitMtd'] as num?)?.toDouble(),
    updatedAt: j['updatedAt'],
  );

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (occupancy != null) m['occupancy'] = occupancy;
    if (adr != null) m['adr'] = adr;
    if (revpar != null) m['revpar'] = revpar;
    if (trevpar != null) m['trevpar'] = trevpar;
    if (goppar != null) m['goppar'] = goppar;
    if (revenueMtd != null) m['revenueMtd'] = revenueMtd;
    if (roomRevenueMtd != null) m['roomRevenueMtd'] = roomRevenueMtd;
    if (fbRevenueMtd != null) m['fbRevenueMtd'] = fbRevenueMtd;
    if (profitMtd != null) m['profitMtd'] = profitMtd;
    return m;
  }
}

class RoomRate {
  final String id;
  final String type;
  final int count;
  final double rate;

  const RoomRate({
    required this.id,
    required this.type,
    required this.count,
    required this.rate,
  });

  factory RoomRate.fromJson(Map<String, dynamic> j) => RoomRate(
    id: j['id'] ?? '',
    type: j['type'] ?? '',
    count: (j['count'] as num?)?.toInt() ?? 0,
    rate: (j['rate'] as num?)?.toDouble() ?? 0,
  );
}

class PropertyData {
  final HotelProfile profile;
  final HotelMetrics metrics;
  final List<RoomRate> rooms;
  final List<dynamic> appliedRates;

  const PropertyData({
    required this.profile,
    required this.metrics,
    required this.rooms,
    required this.appliedRates,
  });

  factory PropertyData.fromJson(Map<String, dynamic> j) => PropertyData(
    profile: HotelProfile.fromJson(j['profile'] as Map<String, dynamic>? ?? {}),
    metrics: HotelMetrics.fromJson(j['metrics'] as Map<String, dynamic>? ?? {}),
    rooms: (j['rooms'] as List<dynamic>? ?? []).map((r) => RoomRate.fromJson(r as Map<String, dynamic>)).toList(),
    appliedRates: j['appliedRates'] as List<dynamic>? ?? [],
  );

  Map<String, double> get roomRateMap =>
      {for (final r in rooms) r.id: r.rate};
}

class PricingRec {
  final int id;
  final String roomId;
  final String room;
  final double current;
  final double suggested;
  final String reason;
  final int impact;
  final String urgency;
  final int? minStay;

  const PricingRec({
    required this.id,
    required this.roomId,
    required this.room,
    required this.current,
    required this.suggested,
    required this.reason,
    required this.impact,
    required this.urgency,
    this.minStay,
  });
}

class ChatMessage {
  final String role;
  final String text;

  const ChatMessage({required this.role, required this.text});
}
