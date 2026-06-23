import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final String? sub;
  final Widget? right;
  final bool live;

  const SectionHeader({
    super.key,
    required this.title,
    this.sub,
    this.right,
    this.live = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(title,
                  style: GoogleFonts.syne(
                    fontSize: 26, fontWeight: FontWeight.w700,
                    color: C.text1, letterSpacing: -0.8, height: 1.1,
                  )),
                if (live) ...[
                  const SizedBox(width: 10),
                  _LiveBadge(),
                ],
              ]),
              if (sub != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(sub!,
                    style: GoogleFonts.inter(
                      fontSize: 13, color: C.text3, height: 1.5,
                    )),
                ),
            ],
          ),
        ),
        if (right != null) right!,
      ],
    );
  }
}

class _LiveBadge extends StatefulWidget {
  @override
  State<_LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<_LiveBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x1410B981),
        border: Border.all(color: const Color(0x3310B981)),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        AnimatedBuilder(
          animation: _anim,
          builder: (_, __) => Container(
            width: 5, height: 5,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF10B981).withValues(alpha: _anim.value),
              boxShadow: [BoxShadow(color: const Color(0x8010B981), blurRadius: 4 * _anim.value)],
            ),
          ),
        ),
        const SizedBox(width: 5),
        Text('LIVE',
          style: GoogleFonts.spaceMono(
            fontSize: 9, color: const Color(0xFF34D399),
            letterSpacing: 1.5, fontWeight: FontWeight.w700,
          )),
      ]),
    );
  }
}

class MonoBadge extends StatelessWidget {
  final String text;
  final Color color;
  const MonoBadge({super.key, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text,
        style: GoogleFonts.spaceMono(
          fontSize: 9, color: color, letterSpacing: 1.5,
        )),
    );
  }
}
