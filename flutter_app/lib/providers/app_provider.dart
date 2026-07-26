import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

enum AppView { loading, landing, pending, demo, app }

const String _apiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://localhost:5000');

class AppProvider extends ChangeNotifier {
  final ApiService api = const ApiService(_apiBase);

  AppView _view = AppView.loading;
  User? _user;
  PropertyData? _property;
  bool _propertyLoading = false;
  String? _propertyError;
  final Set<int> _applied = {};
  final Set<int> _skipped = {};
  List<Map<String, dynamic>> _dailyHistory = [];
  List<Map<String, dynamic>> _monthlyHistory = [];

  AppView get view             => _view;
  User?   get user             => _user;
  PropertyData? get property   => _property;
  bool    get propertyLoading  => _propertyLoading;
  String? get propertyError    => _propertyError;
  Set<int> get applied         => _applied;
  Set<int> get skipped         => _skipped;
  List<Map<String, dynamic>> get dailyHistory   => _dailyHistory;
  List<Map<String, dynamic>> get monthlyHistory => _monthlyHistory;
  bool get hasRealHistory => _dailyHistory.isNotEmpty;

  bool get isNewUser => _user != null && _property != null && !(_property!.metrics.hasData) && !hasRealHistory;

  // ── Derived "live" metrics from real daily history ───────────────────────
  // Falls back to null (caller uses manual metrics/mock) when no history exists.
  Map<String, dynamic>? get _latestDay => _dailyHistory.isEmpty ? null : _dailyHistory.last;

  double? get liveOccupancy => _latestDay?['occupancy']?.toDouble();
  double? get liveAdr       => _latestDay?['adr']?.toDouble();
  double? get liveRevpar    => _latestDay?['revpar']?.toDouble();
  String?  get latestHistoryDate => _latestDay?['date'] as String?;

  double? get liveRevenueMtd {
    if (_dailyHistory.isEmpty) return null;
    final lastDate = _latestDay!['date'] as String;
    final month = lastDate.substring(0, 7); // YYYY-MM
    double sum = 0;
    for (final r in _dailyHistory) {
      if ((r['date'] as String).startsWith(month)) {
        sum += (r['roomRevenue'] as num?)?.toDouble() ?? 0;
        sum += (r['fbRevenue'] as num?)?.toDouble() ?? 0;
      }
    }
    return sum;
  }

  double? get liveRoomRevenueMtd {
    if (_dailyHistory.isEmpty) return null;
    final lastDate = _latestDay!['date'] as String;
    final month = lastDate.substring(0, 7);
    double sum = 0;
    for (final r in _dailyHistory) {
      if ((r['date'] as String).startsWith(month)) {
        sum += (r['roomRevenue'] as num?)?.toDouble() ?? 0;
      }
    }
    return sum;
  }

  /// Last 7 days of history, oldest first — for the weekly revenue chart.
  List<Map<String, dynamic>> get last7Days =>
      _dailyHistory.length <= 7 ? _dailyHistory : _dailyHistory.sublist(_dailyHistory.length - 7);

  /// Monthly occupancy split into this-year vs last-year series (by calendar
  /// month, Jan=0..Dec=11), for year-over-year comparison charts.
  (List<double?> thisYear, List<double?> lastYear) get yearOverYearOccupancy {
    if (_monthlyHistory.isEmpty) return (List.filled(12, null), List.filled(12, null));
    final years = _monthlyHistory.map((m) => (m['month'] as String).substring(0, 4)).toSet().toList()..sort();
    final currentYear = years.last;
    final priorYear = years.length > 1 ? years[years.length - 2] : null;
    final thisYear = List<double?>.filled(12, null);
    final lastYear = List<double?>.filled(12, null);
    for (final m in _monthlyHistory) {
      final year  = (m['month'] as String).substring(0, 4);
      final month = int.parse((m['month'] as String).substring(5, 7)) - 1;
      final occ = (m['occupancy'] as num?)?.toDouble();
      if (year == currentYear) thisYear[month] = occ;
      if (year == priorYear)   lastYear[month] = occ;
    }
    return (thisYear, lastYear);
  }

  // ── Demand forecast (day-of-week seasonality from real history) ──────────
  // No booking-pace/events data exists in the imported PMS export, so this
  // is intentionally a simple, explainable model: each future day's forecast
  // is the historical average occupancy for that weekday. Real, not fabricated,
  // but not a sophisticated pickup/pace model either.

  Map<int, List<double>> get _occupancyByWeekday {
    final byDow = <int, List<double>>{for (var i = 1; i <= 7; i++) i: []};
    for (final r in _dailyHistory) {
      final occ = (r['occupancy'] as num?)?.toDouble();
      if (occ == null) continue;
      final dow = DateTime.parse(r['date'] as String).weekday;
      byDow[dow]!.add(occ);
    }
    return byDow;
  }

  double? _weekdayAvg(Map<int, List<double>> byDow, int weekday) {
    final vals = byDow[weekday]!;
    if (vals.isEmpty) return null;
    return vals.reduce((a, b) => a + b) / vals.length;
  }

  /// Next 14 days: {date, weekday(1-7), demand, sampleCount}. Empty if no history.
  List<Map<String, dynamic>> get forecastNext14Days {
    if (_dailyHistory.isEmpty) return [];
    final byDow = _occupancyByWeekday;
    final today = DateTime.now();
    return List.generate(14, (i) {
      final date = DateTime(today.year, today.month, today.day).add(Duration(days: i));
      final demand = _weekdayAvg(byDow, date.weekday);
      return {
        'date': date,
        'weekday': date.weekday,
        'demand': demand,
        'sampleCount': byDow[date.weekday]!.length,
      };
    });
  }

  /// Backtest over the last 30 real days: how close was the same-weekday
  /// historical average to what actually happened. Null if not enough data.
  double? get forecastAccuracyPct {
    if (_dailyHistory.length < 14) return null;
    final byDow = _occupancyByWeekday;
    final testDays = _dailyHistory.length <= 30 ? _dailyHistory : _dailyHistory.sublist(_dailyHistory.length - 30);
    final errors = <double>[];
    for (final r in testDays) {
      final actual = (r['occupancy'] as num?)?.toDouble();
      if (actual == null || actual == 0) continue;
      final dow = DateTime.parse(r['date'] as String).weekday;
      final predicted = _weekdayAvg(byDow, dow);
      if (predicted == null) continue;
      errors.add((actual - predicted).abs() / actual);
    }
    if (errors.isEmpty) return null;
    final mape = errors.reduce((a, b) => a + b) / errors.length * 100;
    return (100 - mape).clamp(0, 100);
  }

  double? get _recentAvgAdr {
    final withAdr = _dailyHistory.where((r) => r['adr'] != null).toList();
    if (withAdr.isEmpty) return null;
    final recent = withAdr.length <= 30 ? withAdr : withAdr.sublist(withAdr.length - 30);
    return recent.map((r) => (r['adr'] as num).toDouble()).reduce((a, b) => a + b) / recent.length;
  }

  double? projectedRevenueNext7(int totalRooms) {
    final forecast = forecastNext14Days.take(7).toList();
    final adr = _recentAvgAdr;
    if (forecast.isEmpty || adr == null) return null;
    double sum = 0;
    for (final d in forecast) {
      final demand = d['demand'] as double?;
      if (demand == null) continue;
      sum += (demand / 100) * totalRooms * adr;
    }
    return sum;
  }

  /// Average weekend forecast vs average weekday forecast, next 14 days.
  double? get weekendUpliftPct {
    final forecast = forecastNext14Days;
    if (forecast.isEmpty) return null;
    final weekend = forecast.where((d) => (d['weekday'] as int) >= 6 && d['demand'] != null);
    final weekday = forecast.where((d) => (d['weekday'] as int) < 6 && d['demand'] != null);
    if (weekend.isEmpty || weekday.isEmpty) return null;
    final weekendAvg = weekend.map((d) => d['demand'] as double).reduce((a, b) => a + b) / weekend.length;
    final weekdayAvg = weekday.map((d) => d['demand'] as double).reduce((a, b) => a + b) / weekday.length;
    if (weekdayAvg == 0) return null;
    return (weekendAvg - weekdayAvg) / weekdayAvg * 100;
  }

  /// Day-over-day change in rooms sold, last 7 real transitions. This is a
  /// real "net occupancy movement" proxy, NOT booking/cancellation counts —
  /// the PMS export has no booking-transaction data to derive those from.
  List<Map<String, dynamic>> get roomsSoldDelta7 {
    if (_dailyHistory.length < 2) return [];
    final withSold = _dailyHistory.where((r) => r['roomsSold'] != null).toList();
    if (withSold.length < 2) return [];
    final tail = withSold.length <= 8 ? withSold : withSold.sublist(withSold.length - 8);
    final out = <Map<String, dynamic>>[];
    for (var i = 1; i < tail.length; i++) {
      final prev = (tail[i - 1]['roomsSold'] as num).toInt();
      final cur  = (tail[i]['roomsSold'] as num).toInt();
      out.add({'date': tail[i]['date'], 'delta': cur - prev});
    }
    return out.length <= 7 ? out : out.sublist(out.length - 7);
  }

  Map<String, dynamic>? _compsetAnalysis;

  Future<void> _loadCompsetAnalysis() async {
    final rooms = _property?.rooms ?? [];
    if (rooms.isEmpty) return;
    final totalCount = rooms.fold<int>(0, (s, r) => s + r.count);
    final refRate = totalCount == 0
        ? rooms.map((r) => r.rate).reduce((a, b) => a + b) / rooms.length
        : rooms.fold<double>(0, (s, r) => s + r.rate * r.count) / totalCount;
    final res = await api.getCompSetRates(refRate);
    if (res.ok) {
      _compsetAnalysis = res.data!['analysis'] as Map<String, dynamic>?;
      notifyListeners();
    }
  }

  /// Real per-room-type pricing recommendations, derived by applying the
  /// same compset+demand adjustment ratio (backend's /api/compset/rates)
  /// to each room's own current rate. Empty until property + analysis load.
  List<PricingRec> get pricingRecommendations {
    final rooms = _property?.rooms ?? [];
    final analysis = _compsetAnalysis;
    if (rooms.isEmpty || analysis == null) return [];

    final totalCount = rooms.fold<int>(0, (s, r) => s + r.count);
    final refRate = totalCount == 0
        ? rooms.map((r) => r.rate).reduce((a, b) => a + b) / rooms.length
        : rooms.fold<double>(0, (s, r) => s + r.rate * r.count) / totalCount;
    final suggestion = (analysis['suggestion'] as num?)?.toDouble();
    if (suggestion == null || refRate <= 0) return [];
    final ratio = suggestion / refRate;
    final reasoning = (analysis['reasoning'] as List<dynamic>?)?.cast<String>().join(' · ') ?? 'Based on comp set & recent demand';

    return rooms.asMap().entries.map((e) {
      final i = e.key;
      final r = e.value;
      final suggested = (r.rate * ratio).roundToDouble();
      final pctChange = r.rate == 0 ? 0.0 : ((suggested - r.rate).abs() / r.rate * 100);
      final urgency = pctChange >= 8 ? 'high' : pctChange >= 3 ? 'medium' : 'low';
      return PricingRec(
        id: i,
        roomId: r.id,
        room: r.type,
        current: r.rate,
        suggested: suggested,
        reason: reasoning,
        impact: ((suggested - r.rate) * r.count).round(),
        urgency: urgency,
      );
    }).toList();
  }

  int get urgentCount {
    if (_property == null) return 0;
    final real = pricingRecommendations;
    if (real.isNotEmpty) {
      return real.where((r) =>
        r.urgency == 'high' && !_applied.contains(r.id) && !_skipped.contains(r.id)).length;
    }
    const highIds = [1, 3, 5]; // demo fallback ids (Standard King, Double Queen, Junior Suite)
    return highIds.where((id) => !_applied.contains(id) && !_skipped.contains(id)).length;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  Future<void> init() async {
    final token = await ApiService.getToken();
    if (token == null) {
      _view = AppView.landing;
      notifyListeners();
      return;
    }
    final res = await api.getMe();
    if (res.ok) {
      _user = res.data;
      _view = AppView.app;
      notifyListeners();
      await _loadProperty();
    } else {
      await ApiService.clearToken();
      _view = AppView.landing;
      notifyListeners();
    }
  }

  Future<void> _loadProperty() async {
    _propertyLoading = true;
    _propertyError = null;
    notifyListeners();

    final res = await api.getProperty();
    _propertyLoading = false;
    if (res.ok) {
      _property = res.data;
      _propertyError = null;
    } else {
      _propertyError = 'Could not load property data.';
    }
    notifyListeners();

    if (res.ok) {
      await _loadMetricsHistory();
      await _loadCompsetAnalysis();
    }
  }

  Future<void> _loadMetricsHistory() async {
    final res = await api.getMetricsHistory();
    if (res.ok) {
      final data = res.data!;
      _dailyHistory   = (data['daily'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
      _monthlyHistory = (data['monthly'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
      notifyListeners();
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  Future<String?> login(String email, String password) async {
    final res = await api.login(email, password);
    if (!res.ok) {
      // pending === account exists but not approved
      if (res.data != null && (res.data as Map?)?.containsKey('pending') == true) {
        _view = AppView.pending;
        notifyListeners();
        return null;
      }
      return res.error;
    }
    final data = res.data!;
    await ApiService.saveToken(data['token'] as String);
    _user = User.fromJson(data['user'] as Map<String, dynamic>);
    _view = AppView.app;
    notifyListeners();
    await _loadProperty();
    return null;
  }

  Future<String?> register(
      String firstName, String lastName, String hotelName, String email, String password,
      {String? inviteToken}) async {
    final res = await api.register(firstName, lastName, hotelName, email, password, inviteToken: inviteToken);
    if (!res.ok) return res.error;
    final data = res.data!;
    // pending response — no token issued
    if (data.containsKey('pending')) {
      _view = AppView.pending;
      notifyListeners();
      return null;
    }
    await ApiService.saveToken(data['token'] as String);
    _user = User.fromJson(data['user'] as Map<String, dynamic>);
    _view = AppView.app;
    notifyListeners();
    await _loadProperty();
    return null;
  }

  void enterDemo() {
    _view = AppView.demo;
    notifyListeners();
  }

  void exitDemo() {
    _view = AppView.landing;
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    _property = null;
    _propertyError = null;
    _applied.clear();
    _skipped.clear();
    _view = AppView.landing;
    notifyListeners();
  }

  // ── Property ──────────────────────────────────────────────────────────────

  void updateProperty(PropertyData p) {
    _property = p;
    notifyListeners();
  }

  void updatePropertyProfile(HotelProfile profile) {
    if (_property == null) return;
    _property = PropertyData(
      profile: profile,
      metrics: _property!.metrics,
      rooms: _property!.rooms,
      appliedRates: _property!.appliedRates,
    );
    notifyListeners();
  }

  void updatePropertyMetrics(HotelMetrics metrics) {
    if (_property != null) {
      _property = PropertyData(
        profile: _property!.profile,
        metrics: metrics,
        rooms: _property!.rooms,
        appliedRates: _property!.appliedRates,
      );
    }
    notifyListeners();
  }

  // ── Pricing ───────────────────────────────────────────────────────────────

  /// Apply a pricing recommendation — updates local state immediately,
  /// then persists to backend asynchronously.
  Future<void> applyRec(int id, {String? roomId, double? oldRate, double? newRate, String? reason}) async {
    _applied.add(id);
    _skipped.remove(id);
    notifyListeners();

    if (_user != null && roomId != null && oldRate != null && newRate != null && reason != null) {
      final res = await api.applyRate(roomId, oldRate, newRate, reason ?? '');
      if (res.ok) {
        // Refresh property to get updated room rates from backend
        await _loadProperty();
      }
    }
  }

  void skipRec(int id) {
    _skipped.add(id);
    _applied.remove(id);
    notifyListeners();
  }

  void restoreRec(int id) {
    _applied.remove(id);
    _skipped.remove(id);
    notifyListeners();
  }
}
