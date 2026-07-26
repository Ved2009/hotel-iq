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

  int get urgentCount {
    if (_property == null) return 0;
    const highIds = [1, 3, 5]; // Standard King, Double Queen, Junior Suite
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

    if (res.ok) await _loadMetricsHistory();
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
