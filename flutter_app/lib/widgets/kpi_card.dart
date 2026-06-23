import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'mini_spark.dart';

class KpiCard extends StatefulWidget {
  final String label;
  final String value;
  final String? sub;
  final double? delta;
  final Color accent;
  final String icon;
  final List<double>? spark;

  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    this.sub,
    this.delta,
    required this.accent,
    required this.icon,
    this.spark,
  });

  @override
  State<KpiCard> createState() => _KpiCardState();
}

class _KpiCardState extends State<KpiCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        transform: Matrix4.translationValues(0, _hovered ? -2 : 0, 0),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment(-0.3, -1),
            end: Alignment(0.3, 1),
            colors: [C.surf1, C.surf2],
          ),
          border: Border.all(
            color: _hovered
                ? widget.accent.withValues(alpha: 0.5)
                : C.border,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            const BoxShadow(color: Color(0x66000000), blurRadius: 3, offset: Offset(0, 1)),
            if (_hovered)
              BoxShadow(
                color: widget.accent.withValues(alpha: 0.12),
                blurRadius: 20, offset: const Offset(0, 4),
              ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Glow blob
              Positioned(
                bottom: -30, right: -30,
                child: Container(
                  width: 120, height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(colors: [
                      widget.accent.withValues(alpha: 0.06),
                      Colors.transparent,
                    ]),
                  ),
                ),
              ),
              // Top accent line
              Positioned(
                top: 0, left: 0, right: 0,
                child: Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [
                      widget.accent.withValues(alpha: 0.9),
                      widget.accent.withValues(alpha: 0.2),
                      Colors.transparent,
                    ]),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(widget.label,
                          style: GoogleFonts.spaceMono(
                            fontSize: 9, color: C.text3,
                            letterSpacing: 1.5,
                          )),
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(
                            color: widget.accent.withValues(alpha: 0.15),
                            border: Border.all(color: widget.accent.withValues(alpha: 0.25)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(widget.icon,
                              style: const TextStyle(fontSize: 13)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(widget.value,
                      style: GoogleFonts.syne(
                        fontSize: 30, fontWeight: FontWeight.w700,
                        color: C.text1, letterSpacing: -1, height: 1,
                      )),
                    if (widget.sub != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(widget.sub!,
                          style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
                      ),
                    if (widget.delta != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: _DeltaBadge(delta: widget.delta!),
                      ),
                    if (widget.spark != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: MiniSpark(data: widget.spark!, color: widget.accent),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeltaBadge extends StatelessWidget {
  final double delta;
  const _DeltaBadge({required this.delta});

  @override
  Widget build(BuildContext context) {
    final pos = delta >= 0;
    final color = pos ? const Color(0xFF34D399) : const Color(0xFFF87171);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14, height: 14,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Center(
            child: Text(pos ? '▲' : '▼',
              style: TextStyle(fontSize: 7, color: color)),
          ),
        ),
        const SizedBox(width: 4),
        Text('${delta.abs()}% vs last month',
          style: GoogleFonts.inter(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
