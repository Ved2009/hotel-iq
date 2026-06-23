import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DotGridBackground extends StatelessWidget {
  final Widget child;
  const DotGridBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      const Positioned.fill(child: _MeshBackground()),
      Positioned.fill(child: CustomPaint(painter: _DotPainter())),
      child,
    ]);
  }
}

class _MeshBackground extends StatelessWidget {
  const _MeshBackground();

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      // Primary violet glow top-left
      Positioned(
        top: -200, left: -100,
        child: Container(
          width: 700, height: 700,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [
              C.violet.withValues(alpha: 0.15),
              Colors.transparent,
            ]),
          ),
        ),
      ),
      // Gold glow bottom-right
      Positioned(
        bottom: -300, right: -200,
        child: Container(
          width: 600, height: 600,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [
              C.gold.withValues(alpha: 0.06),
              Colors.transparent,
            ]),
          ),
        ),
      ),
      // Blue accent mid
      Positioned(
        top: 300, right: 100,
        child: Container(
          width: 400, height: 400,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [
              C.blue.withValues(alpha: 0.07),
              Colors.transparent,
            ]),
          ),
        ),
      ),
    ]);
  }
}

class _DotPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..strokeWidth = 1;
    const spacing = 40.0;
    const radius = 1.0;
    const fadeHeight = 0.65;

    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height * fadeHeight; y += spacing) {
        final opacity = pow(1 - y / (size.height * fadeHeight), 1.5).toDouble() * 0.2;
        paint.color = Color.fromRGBO(150, 120, 255, opacity);
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_) => false;
}
