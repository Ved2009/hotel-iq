import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'theme/app_theme.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'screens/splash_screen.dart';
import 'screens/landing_screen.dart';
import 'screens/pending_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: const HotelIQApp(),
    ),
  );
}

class HotelIQApp extends StatelessWidget {
  const HotelIQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hotel IQ',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const _AppRouter(),
    );
  }
}

class _AppRouter extends StatelessWidget {
  const _AppRouter();

  String? _urlParam(String key) {
    if (!kIsWeb) return null;
    try {
      final uri = Uri.base;
      return uri.queryParameters[key];
    } catch (_) { return null; }
  }

  @override
  Widget build(BuildContext context) {
    // Check for password reset link: hoteliq.us?reset=TOKEN
    final resetToken = _urlParam('reset');
    if (resetToken != null && resetToken.isNotEmpty) {
      return ResetPasswordScreen(token: resetToken);
    }

    final view = context.watch<AppProvider>().view;
    return switch (view) {
      AppView.loading  => const SplashScreen(),
      AppView.landing  => const LandingScreen(),
      AppView.pending  => const PendingScreen(),
      AppView.demo     => const DashboardScreen(),
      AppView.app      => const DashboardScreen(),
    };
  }
}
