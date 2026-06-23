import 'dart:math';
import '../models/models.dart';

double _rng(int n) => ((sin(n * 9301 + 49297) * 0.5 + 0.5)).abs();

final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
final daysShort = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

class MonthlyPoint {
  final String month;
  final double occupancy;
  final double lastYear;
  final double revpar;
  final double adr;
  final double revenue;
  MonthlyPoint(this.month, this.occupancy, this.lastYear, this.revpar, this.adr, this.revenue);
}

final List<MonthlyPoint> monthlyData = List.generate(12, (i) => MonthlyPoint(
  months[i],
  (55 + sin(i * 0.6) * 20 + _rng(i) * 8).roundToDouble(),
  (50 + sin(i * 0.6) * 18 + _rng(i + 1) * 6).roundToDouble(),
  (110 + sin(i * 0.6) * 40 + _rng(i + 2) * 20).roundToDouble(),
  (180 + sin(i * 0.4) * 30 + _rng(i + 3) * 15).roundToDouble(),
  (280000 + sin(i * 0.6) * 80000 + _rng(i + 4) * 40000).roundToDouble(),
));

class DayRevenue {
  final String day;
  final double revenue;
  DayRevenue(this.day, this.revenue);
}

final List<DayRevenue> weeklyRevenue = List.generate(7, (i) => DayRevenue(
  daysShort[i],
  (10000 + _rng(i + 14) * 8000 + (i >= 4 ? 5000 : 0)).roundToDouble(),
));

class ForecastPoint {
  final String date;
  final double demand;
  final double confidence;
  final String? event;
  ForecastPoint(this.date, this.demand, this.confidence, this.event);
}

List<ForecastPoint> buildForecast() {
  final now = DateTime.now();
  return List.generate(14, (i) {
    final d = now.add(Duration(days: i));
    final isWknd = d.weekday == 6 || d.weekday == 7;
    final isEvent = i >= 5 && i <= 7;
    final demand = min(100.0, (62 + _rng(i) * 20 + (isWknd ? 12 : 0) + (isEvent ? 24 : 0)).roundToDouble());
    final conf = (92 - i * 2.2 + _rng(i + 10) * 3).roundToDouble();
    final label = '${_monthAbbr(d.month)} ${d.day}';
    return ForecastPoint(label, demand, conf, isEvent ? 'Conference' : isWknd ? 'Weekend' : null);
  });
}

String _monthAbbr(int m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];

final List<ForecastPoint> forecastData = buildForecast();

class PickupPoint {
  final String date;
  final double bookings;
  final double cancellations;
  PickupPoint(this.date, this.bookings, this.cancellations);
}

List<PickupPoint> buildPickup() {
  final now = DateTime.now();
  return List.generate(7, (i) {
    final d = now.subtract(Duration(days: 6 - i));
    return PickupPoint(
      '${_monthAbbr(d.month)} ${d.day}',
      (5 + _rng(i * 3) * 14).roundToDouble(),
      (_rng(i * 5 + 2) * 4).roundToDouble(),
    );
  });
}

final List<PickupPoint> pickupData = buildPickup();

class ChannelPoint {
  final String month;
  final double direct;
  final double booking;
  final double expedia;
  final double phoneEmail;
  ChannelPoint(this.month, this.direct, this.booking, this.expedia, this.phoneEmail);
}

final List<ChannelPoint> channelData = List.generate(6, (i) {
  final m = months[6 + i];
  return ChannelPoint(
    m,
    (38000 + _rng(i) * 18000).roundToDouble(),
    (32000 + _rng(i + 1) * 16000).roundToDouble(),
    (20000 + _rng(i + 2) * 10000).roundToDouble(),
    (14000 + _rng(i + 3) * 7000).roundToDouble(),
  );
});

class SegmentItem {
  final String name;
  final double value;
  final int color;
  SegmentItem(this.name, this.value, this.color);
}

final List<SegmentItem> segmentData = [
  SegmentItem('Leisure',  45, 0xFFF59E0B),
  SegmentItem('Business', 30, 0xFF6366F1),
  SegmentItem('Group',    15, 0xFF8B5CF6),
  SegmentItem('OTA',      10, 0xFFF97316),
];

class CompHotel {
  final String name;
  final double rate;
  final double change;
  final int stars;
  final double score;
  CompHotel(this.name, this.rate, this.change, this.stars, this.score);
}

final List<CompHotel> competitors = [
  CompHotel('Your Hotel',     189, 3.2,  4, 4.4),
  CompHotel('Grand Regency',  210, -1.5, 5, 4.7),
  CompHotel('Blue Harbor',    175, 5.1,  3, 4.1),
  CompHotel('The Meridian',   220, 0,    5, 4.8),
  CompHotel('Coastal Suites', 165, 2.3,  3, 3.9),
  CompHotel('Harbor View',    195, -0.8, 4, 4.3),
];

class RateHistoryPoint {
  final String day;
  final double yourHotel;
  final double grandRegency;
  final double meridian;
  final double blueHarbor;
  RateHistoryPoint(this.day, this.yourHotel, this.grandRegency, this.meridian, this.blueHarbor);
}

final List<RateHistoryPoint> rateHistory = List.generate(7, (i) => RateHistoryPoint(
  daysShort[i],
  189 + (_rng(i) - 0.5) * 18,
  210 + (_rng(i + 1) - 0.5) * 14,
  220 + (_rng(i + 2) - 0.5) * 12,
  175 + (_rng(i + 3) - 0.5) * 16,
));

final List<PricingRec> pricingRecs = [
  const PricingRec(id: 1, roomId: 'standard-king',    room: 'Standard King',    current: 159, suggested: 179, reason: 'High demand — comp supply low',   impact: 2400,  urgency: 'high',   minStay: 2),
  const PricingRec(id: 2, roomId: 'ocean-view-suite', room: 'Ocean View Suite', current: 289, suggested: 269, reason: '3 comps dropped rates below',     impact: -800,  urgency: 'medium', minStay: null),
  const PricingRec(id: 3, roomId: 'double-queen',     room: 'Double Queen',     current: 139, suggested: 155, reason: 'Weekend demand spike forecast',   impact: 1100,  urgency: 'high',   minStay: 2),
  const PricingRec(id: 4, roomId: 'executive-floor',  room: 'Executive Floor',  current: 349, suggested: 349, reason: 'Rate is optimal — hold position', impact: 0,     urgency: 'low',    minStay: null),
  const PricingRec(id: 5, roomId: 'junior-suite',     room: 'Junior Suite',     current: 229, suggested: 249, reason: 'Conference demand surge',         impact: 880,   urgency: 'high',   minStay: 3),
];

class ActivityItem {
  final String time;
  final String type;
  final String icon;
  final String text;
  ActivityItem(this.time, this.type, this.icon, this.text);
}

final List<ActivityItem> activityLog = [
  ActivityItem('2m ago',  'alert',    '⚡', 'Demand spike detected: +34% this weekend'),
  ActivityItem('18m ago', 'positive', '↑',  'Occupancy hit 78% — 4-week high'),
  ActivityItem('1h ago',  'success',  '✓',  'Price applied: Penthouse Suite → \$420'),
  ActivityItem('3h ago',  'warning',  '↓',  'Grand Regency dropped rates −1.5%'),
  ActivityItem('5h ago',  'info',     '★',  'New 5-star review on Booking.com'),
  ActivityItem('8h ago',  'alert',    '⚡', 'Fresh 14-day demand forecast generated'),
];

const Map<String, List<double>> sparks = {
  'occupancy':   [64, 67, 65, 69, 71, 70, 74, 73],
  'revpar':      [129, 131, 133, 130, 136, 138, 140, 142],
  'adr':         [187, 190, 188, 191, 193, 192, 196, 195],
  'trevpar':     [158, 161, 159, 163, 165, 164, 168, 168],
  'revenueMtd':  [60,  65,  70,  74,  78,  82,  86,  89],
  'goppar':      [83,  85,  84,  86,  87,  87,  89,  89],
  'forecast7':   [75,  78,  80,  82,  84,  83,  82,  81],
  'forecastAcc': [92,  93,  91,  93,  94,  94,  94,  94],
  'projRev':     [31,  33,  35,  36,  38,  39,  40,  41],
  'roomRev':     [62,  67,  72,  76,  79,  83,  86,  89],
  'fbRev':       [14,  15,  15,  16,  17,  17,  18,  18],
  'profit':      [36,  39,  40,  42,  44,  45,  46,  47],
};

class CalendarDay {
  final int day;
  final String dow;
  final double occupancy;
  final double adr;
  final double revenue;
  final bool isToday;
  final bool isWknd;
  CalendarDay(this.day, this.dow, this.occupancy, this.adr, this.revenue, this.isToday, this.isWknd);
}

List<CalendarDay> buildCalendar() {
  final now = DateTime.now();
  final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
  final weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return List.generate(daysInMonth, (i) {
    final d = DateTime(now.year, now.month, i + 1);
    final isWknd = d.weekday == 6 || d.weekday == 7;
    final occ = (52 + _rng(i) * 38 + (isWknd ? 12 : 0)).roundToDouble().clamp(0, 100);
    final adr = (178 + _rng(i * 2) * 42).roundToDouble();
    return CalendarDay(
      i + 1,
      weekdays[(d.weekday - 1) % 7],
      occ, adr,
      (occ * 2.92 * adr * 0.01).roundToDouble(),
      d.day == now.day,
      isWknd,
    );
  });
}

final List<CalendarDay> calendarDays = buildCalendar();

int get calendarOffset {
  final now = DateTime.now();
  final firstDay = DateTime(now.year, now.month, 1);
  return (firstDay.weekday - 1) % 7;
}

class RateCalendarDay {
  final int day;
  final String dow;
  final String label;
  final double demand;
  final double current;
  final double optimal;
  final double gap;
  final bool isWknd;
  final bool isToday;
  final bool hasEvent;
  RateCalendarDay(this.day, this.dow, this.label, this.demand, this.current, this.optimal, this.gap, this.isWknd, this.isToday, this.hasEvent);
}

List<RateCalendarDay> buildRateCalendar() {
  final now = DateTime.now();
  final weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return List.generate(30, (i) {
    final d = now.add(Duration(days: i));
    final isWknd = d.weekday == 6 || d.weekday == 7;
    final demand = min(100.0, (55 + _rng(i * 3) * 36 + (isWknd ? 14 : 0) + (i >= 5 && i <= 7 ? 22 : 0)).roundToDouble());
    const base = 189.0;
    final optimal = (base * (0.76 + (demand / 100) * 0.52)).roundToDouble();
    return RateCalendarDay(
      d.day, weekdays[(d.weekday - 1) % 7],
      '${_monthAbbr(d.month)} ${d.day}',
      demand, base, optimal, optimal - base,
      isWknd, i == 0, i >= 5 && i <= 7,
    );
  });
}

final List<RateCalendarDay> rateCalendar = buildRateCalendar();

class ReportItem {
  final String name;
  final String desc;
  final String freq;
  final String status;
  ReportItem(this.name, this.desc, this.freq, this.status);
}

final List<ReportItem> reports = [
  ReportItem('Monthly Revenue Summary',    'Full P&L, RevPAR, ADR analysis',       'Monthly', 'Ready'),
  ReportItem('Demand Forecast Report',     '14-day demand with confidence bands',   'Daily',   'Ready'),
  ReportItem('Comp Set Rate Analysis',     'Competitor rates, trends, position',    'Weekly',  'Ready'),
  ReportItem('Channel Performance Report', 'OTA vs direct, commissions, mix',       'Monthly', 'Ready'),
  ReportItem('Segment Performance Review', 'Leisure, Business, Group breakdown',    'Monthly', 'Pending'),
  ReportItem('Year-over-Year Comparison',  'KPI trends vs prior year',              'Weekly',  'Ready'),
];

const List<String> quickPrompts = [
  'Optimal rate for this weekend?',
  'How do I grow RevPAR 10%?',
  'Analyse my comp set',
  'Is my ADR competitive?',
  'Forecast next 7 days',
];

class PmsItem {
  final String id, name, desc, icon;
  final List<String> fields;
  PmsItem(this.id, this.name, this.desc, this.icon, this.fields);
}

final List<PmsItem> pmsList = [
  PmsItem('mews',         'Mews',           'Cloud PMS for modern hotels & hostels', '🏨', ['API Token', 'Property ID']),
  PmsItem('cloudbeds',    'Cloudbeds',       'All-in-one hospitality platform',        '☁️', ['API Key', 'Property ID']),
  PmsItem('opera',        'Oracle Opera',    'Enterprise hotel management suite',      '🔷', ['Username', 'Password', 'Endpoint URL']),
  PmsItem('protel',       'Protel Air',      'Cloud PMS for all property sizes',       '🏢', ['API Key', 'Hotel ID']),
  PmsItem('littlehotelier','Little Hotelier','Built for small independent hotels',     '🏡', ['API Key']),
  PmsItem('clock',        'Clock PMS',       'Web-based PMS + booking engine',        '⏱',  ['API Key', 'Property Code']),
];

final List<PmsItem> channelManagers = [
  PmsItem('siteminder',  'SiteMinder',  "World's leading channel manager", '🌐', ['API Key', 'Property ID']),
  PmsItem('channex',     'Channex',     'Open-API channel manager',        '🔗', ['API Key', 'Channel ID']),
  PmsItem('cubilis',     'Cubilis',     'Rate & availability distribution', '📡', ['Username', 'Password']),
  PmsItem('myallocator', 'myallocator', 'Automated OTA sync & reporting',  '⚡', ['Account ID', 'API Key']),
];

final List<PmsItem> otaConnections = [
  PmsItem('booking', 'Booking.com',   'Direct API — push rates & retrieve reviews', '🅱', ['Property ID', 'API Key']),
  PmsItem('expedia', 'Expedia Group', 'Expedia + Hotels.com rate management',        '✈', ['Hotel ID', 'API Key']),
  PmsItem('airbnb',  'Airbnb',        'Host tools & real-time rate sync',            '🏠', ['Listing ID', 'Access Token']),
  PmsItem('google',  'Google Hotels', 'Free booking links + price accuracy',         '🔍', ['Property ID']),
];
