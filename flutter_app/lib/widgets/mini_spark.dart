import 'package:flutter/material.dart';

class MiniSpark extends StatelessWidget {
  final List<double> data;
  final Color color;
  final double height;

  const MiniSpark({
    super.key,
    required this.data,
    required this.color,
    this.height = 28,
  });

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: height,
      child: CustomPaint(
        size: Size.fromHeight(height),
        painter: _SparkPainter(data: data, color: color),
      ),
    );
  }
}

class _SparkPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  const _SparkPainter({required this.data, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    if (data.length < 2) return;
    final mn = data.reduce((a, b) => a < b ? a : b);
    final mx = data.reduce((a, b) => a > b ? a : b);
    final range = (mx - mn).abs() < 0.001 ? 1.0 : mx - mn;

    List<Offset> pts = [];
    for (int i = 0; i < data.length; i++) {
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - ((data[i] - mn) / range) * (size.height - 2) - 1;
      pts.add(Offset(x, y));
    }

    // Fill area
    final path = Path()..moveTo(0, size.height);
    for (final pt in pts) path.lineTo(pt.dx, pt.dy);
    path.lineTo(size.width, size.height);
    path.close();

    final gradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [color.withValues(alpha: 0.3), color.withValues(alpha: 0)],
    );
    canvas.drawPath(
      path,
      Paint()..shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );

    // Line
    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 1.8
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final linePath = Path()..moveTo(pts[0].dx, pts[0].dy);
    for (int i = 1; i < pts.length; i++) linePath.lineTo(pts[i].dx, pts[i].dy);
    canvas.drawPath(linePath, linePaint);
  }

  @override
  bool shouldRepaint(_SparkPainter o) => o.data != data || o.color != color;
}
