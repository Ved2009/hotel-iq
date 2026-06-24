import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

enum AppView { loading, landing, pending, app }

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

  AppView get view             => _view;
  User?   get user             => _user;
  PropertyData? get property   => _property;
  bool    get propertyLoading  => _propertyLoading;
  String? get propertyError    => _propertyError;
  Set<int> get applied         => _applied;
  Set<int> get skipped         => _skipped;

  bool get isNewUser => _user != null && _property != null && !(_property!.metrics.hasData);

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
      String firstName, String lastName, String hotelName, String email, String password) async {
    final res = await api.register(firstName, lastName, hotelName, email, password);
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
