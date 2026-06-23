import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

enum AppView { loading, landing, app }

const String _apiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://localhost:5000');

class AppProvider extends ChangeNotifier {
  final ApiService api = const ApiService(_apiBase);

  AppView _view = AppView.loading;
  User? _user;
  PropertyData? _property;
  bool _aiOpen = false;
  final Set<int> _applied = {};
  final Set<int> _skipped = {};

  AppView get view => _view;
  User? get user => _user;
  PropertyData? get property => _property;
  bool get aiOpen => _aiOpen;
  Set<int> get applied => _applied;
  Set<int> get skipped => _skipped;

  int get urgentCount => _property == null
      ? 0
      : 3 - _applied.where((id) => id <= 3).length - _skipped.where((id) => id <= 3).length;

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
      _loadProperty();
    } else {
      await ApiService.clearToken();
      _view = AppView.landing;
    }
    notifyListeners();
  }

  Future<void> _loadProperty() async {
    final res = await api.getProperty();
    if (res.ok) {
      _property = res.data;
      notifyListeners();
    }
  }

  Future<String?> login(String email, String password) async {
    final res = await api.login(email, password);
    if (!res.ok) return res.error;
    final data = res.data!;
    await ApiService.saveToken(data['token'] as String);
    _user = User.fromJson(data['user'] as Map<String, dynamic>);
    _view = AppView.app;
    notifyListeners();
    _loadProperty();
    return null;
  }

  Future<String?> register(
      String firstName, String lastName, String hotelName, String email, String password) async {
    final res = await api.register(firstName, lastName, hotelName, email, password);
    if (!res.ok) return res.error;
    final data = res.data!;
    await ApiService.saveToken(data['token'] as String);
    _user = User.fromJson(data['user'] as Map<String, dynamic>);
    _view = AppView.app;
    notifyListeners();
    _loadProperty();
    return null;
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    _property = null;
    _applied.clear();
    _skipped.clear();
    _aiOpen = false;
    _view = AppView.landing;
    notifyListeners();
  }

  void updateProperty(PropertyData p) {
    _property = p;
    notifyListeners();
  }

  void toggleAi() {
    _aiOpen = !_aiOpen;
    notifyListeners();
  }

  void closeAi() {
    _aiOpen = false;
    notifyListeners();
  }

  void applyRec(int id) {
    _applied.add(id);
    _skipped.remove(id);
    notifyListeners();
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
