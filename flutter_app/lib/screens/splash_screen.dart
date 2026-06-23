import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _dot;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
    _dot = Tween<double>(begin: 0.2, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().init();
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.bg,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text.rich(TextSpan(children: [
              TextSpan(text: 'Hotel',
                style: GoogleFonts.syne(
                  fontSize: 28, fontWeight: FontWeight.w800,
                  color: C.text1, letterSpacing: -0.5,
                )),
              TextSpan(text: 'IQ',
                style: GoogleFonts.syne(
                  fontSize: 28, fontWeight: FontWeight.w800,
                  color: C.gold, letterSpacing: -0.5,
                )),
            ])),
            const SizedBox(height: 28),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) => AnimatedBuilder(
                animation: _ctrl,
                builder: (_, __) {
                  final offset = ((_ctrl.value - i * 0.2) % 1.0).clamp(0.0, 1.0);
                  final alpha = (offset < 0.5
                    ? offset * 2
                    : (1 - offset) * 2).clamp(0.2, 1.0);
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: 6, height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: C.blue.withValues(alpha: alpha),
                    ),
                  );
                },
              )),
            ),
          ],
        ),
      ),
    );
  }
}
