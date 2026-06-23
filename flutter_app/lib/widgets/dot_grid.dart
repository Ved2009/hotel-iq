import 'package:flutter/material.dart';

class DotGridBackground extends StatelessWidget {
  final Widget child;
  const DotGridBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Positioned.fill(child: CustomPaint(painter: _DotGridPainter())),
      Positioned.fill(
        child: Container(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, -0.8),
              radius: 1.2,
              colors: [Color(0x196366F1), Colors.transparent],
            ),
          ),
        ),
      ),
      child,
    ]);
  }
}

class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x2E6366F1)
      ..strokeWidth = 1;

    const spacing = 36.0;
    const radius = 1.0;

    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height * 0.7; y += spacing) {
        final opacity = (1 - y / (size.height * 0.7)).clamp(0.0, 1.0);
        paint.color = Color.fromRGBO(99, 102, 241, opacity * 0.18);
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_) => false;
}
