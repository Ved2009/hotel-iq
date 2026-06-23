import 'dart:ui';
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

class _KpiCardState extends State<KpiCard> with SingleTickerProviderStateMixin {
  bool _hovered = false;
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 200));
    _scale = Tween<double>(begin: 1, end: 1.02).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) { setState(() => _hovered = true); _ctrl.forward(); },
      onExit: (_)  { setState(() => _hovered = false); _ctrl.reverse(); },
      child: ScaleTransition(
        scale: _scale,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: const Alignment(-1, -1),
              end: const Alignment(1, 1),
              colors: [
                _hovered ? C.surf2 : C.surf1,
                C.surf1.withValues(alpha: 0.5),
              ],
            ),
            border: Border.all(
              color: _hovered ? widget.accent.withValues(alpha: 0.5) : C.border,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.5),
                blurRadius: 30, offset: const Offset(0, 8),
              ),
              if (_hovered)
                BoxShadow(
                  color: widget.accent.withValues(alpha: 0.15),
                  blurRadius: 40, spreadRadius: -5,
                ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(children: [
              // Glow blob bottom-right
              Positioned(
                bottom: -40, right: -40,
                child: Container(
                  width: 140, height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(colors: [
                      widget.accent.withValues(alpha: _hovered ? 0.1 : 0.05),
                      Colors.transparent,
                    ]),
                  ),
                ),
              ),
              // Top accent bar
              Positioned(top: 0, left: 0, right: 0, child: Container(
                height: 1,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    widget.accent.withValues(alpha: _hovered ? 1 : 0.6),
                    widget.accent.withValues(alpha: 0.2),
                    Colors.transparent,
                  ]),
                ),
              )),
              Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(widget.label,
                        style: GoogleFonts.spaceMono(
                          fontSize: 9, color: C.text3, letterSpacing: 2,
                        )),
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          color: widget.accent.withValues(alpha: 0.12),
                          border: Border.all(color: widget.accent.withValues(alpha: 0.25)),
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _hovered ? [
                            BoxShadow(color: widget.accent.withValues(alpha: 0.3), blurRadius: 12),
                          ] : null,
                        ),
                        child: Center(child: Text(widget.icon, style: const TextStyle(fontSize: 14))),
                      ),
                    ]),
                    const SizedBox(height: 16),
                    Text(widget.value,
                      style: GoogleFonts.syne(
                        fontSize: 32, fontWeight: FontWeight.w800,
                        color: C.text1, letterSpacing: -1.5, height: 1,
                      )),
                    if (widget.sub != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 5),
                        child: Text(widget.sub!,
                          style: GoogleFonts.inter(fontSize: 11, color: C.text3, height: 1.4)),
                      ),
                    if (widget.delta != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: _DeltaChip(delta: widget.delta!),
                      ),
                    if (widget.spark != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: MiniSpark(data: widget.spark!, color: widget.accent, height: 32),
                      ),
                  ],
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _DeltaChip extends StatelessWidget {
  final double delta;
  const _DeltaChip({required this.delta});

  @override
  Widget build(BuildContext context) {
    final pos = delta >= 0;
    final color = pos ? C.green : C.red;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.25)),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(pos ? '▲' : '▼', style: TextStyle(fontSize: 8, color: color)),
        const SizedBox(width: 4),
        Text('${delta.abs()}% vs last mo',
          style: GoogleFonts.inter(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
