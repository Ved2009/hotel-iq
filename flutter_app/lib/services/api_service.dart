import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

const String _kToken = 'hiq-token';

class ApiResult<T> {
  final T? data;
  final String? error;
  bool get ok => error == null;
  const ApiResult.ok(this.data) : error = null;
  const ApiResult.err(this.error) : data = null;
}

class ApiService {
  final String base;
  const ApiService(this.base);

  // ── Token storage ──────────────────────────────────────────────────────────
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kToken);
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  Future<Map<String, String>> _headers({bool auth = true}) async {
    final h = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await getToken();
      if (token != null) h['Authorization'] = 'Bearer $token';
    }
    return h;
  }

  Map<String, dynamic> _body(http.Response r) => json.decode(r.body) as Map<String, dynamic>;

  // ── Auth ───────────────────────────────────────────────────────────────────
  Future<ApiResult<Map<String, dynamic>>> login(String email, String password) async {
    try {
      final r = await http.post(
        Uri.parse('$base/api/auth/login'),
        headers: await _headers(auth: false),
        body: json.encode({'email': email, 'password': password}),
      );
      final b = _body(r);
      if (!r.ok) return ApiResult.err(b['error'] ?? 'Login failed');
      return ApiResult.ok(b);
    } catch (e) {
      return ApiResult.err('Network error');
    }
  }

  Future<ApiResult<Map<String, dynamic>>> register(
      String firstName, String lastName, String hotelName, String email, String password) async {
    try {
      final r = await http.post(
        Uri.parse('$base/api/auth/register'),
        headers: await _headers(auth: false),
        body: json.encode({
          'firstName': firstName, 'lastName': lastName,
          'hotelName': hotelName, 'email': email, 'password': password,
        }),
      );
      final b = _body(r);
      if (!r.ok) return ApiResult.err(b['error'] ?? 'Registration failed');
      return ApiResult.ok(b);
    } catch (e) {
      return ApiResult.err('Network error');
    }
  }

  Future<ApiResult<User>> getMe() async {
    try {
      final r = await http.get(
        Uri.parse('$base/api/auth/me'),
        headers: await _headers(),
      );
      if (!r.ok) return const ApiResult.err('Session expired');
      final b = _body(r);
      return ApiResult.ok(User.fromJson(b['user'] as Map<String, dynamic>));
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }

  // ── Property ───────────────────────────────────────────────────────────────
  Future<ApiResult<PropertyData>> getProperty() async {
    try {
      final r = await http.get(
        Uri.parse('$base/api/property/me'),
        headers: await _headers(),
      );
      if (!r.ok) return const ApiResult.err('Failed to load property');
      return ApiResult.ok(PropertyData.fromJson(_body(r)));
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }

  Future<ApiResult<HotelProfile>> updateProfile(HotelProfile p) async {
    try {
      final r = await http.put(
        Uri.parse('$base/api/property/profile'),
        headers: await _headers(),
        body: json.encode(p.toJson()),
      );
      if (!r.ok) return const ApiResult.err('Failed to save');
      return ApiResult.ok(HotelProfile.fromJson(_body(r)));
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }

  Future<ApiResult<HotelMetrics>> updateMetrics(Map<String, dynamic> metrics) async {
    try {
      final r = await http.post(
        Uri.parse('$base/api/property/metrics'),
        headers: await _headers(),
        body: json.encode(metrics),
      );
      if (!r.ok) return const ApiResult.err('Failed to save');
      return ApiResult.ok(HotelMetrics.fromJson(_body(r)));
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }

  Future<ApiResult<Map<String, dynamic>>> applyRate(
      String roomId, double oldRate, double newRate, String reason) async {
    try {
      final r = await http.post(
        Uri.parse('$base/api/property/rates/apply'),
        headers: await _headers(),
        body: json.encode({'roomId': roomId, 'oldRate': oldRate, 'newRate': newRate, 'reason': reason}),
      );
      if (!r.ok) return const ApiResult.err('Failed to apply');
      return ApiResult.ok(_body(r));
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }

  // ── AI Chat ────────────────────────────────────────────────────────────────
  Future<ApiResult<String>> chat(String context, List<Map<String, String>> messages) async {
    try {
      final r = await http.post(
        Uri.parse('$base/api/ai/chat'),
        headers: await _headers(),
        body: json.encode({'context': context, 'messages': messages}),
      );
      if (!r.ok) return ApiResult.err(_body(r)['error'] ?? 'AI error');
      return ApiResult.ok(_body(r)['reply'] as String);
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }

  // ── Comp Set ───────────────────────────────────────────────────────────────
  Future<ApiResult<Map<String, dynamic>>> getCompSetRates(double yourRate) async {
    try {
      final r = await http.get(
        Uri.parse('$base/api/compset/rates?yourRate=$yourRate'),
        headers: await _headers(),
      );
      if (!r.ok) return const ApiResult.err('Failed to fetch');
      return ApiResult.ok(_body(r));
    } catch (e) {
      return const ApiResult.err('Network error');
    }
  }
}
