import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class UrgencyBadge extends StatelessWidget {
  final String urgency;
  const UrgencyBadge({super.key, required this.urgency});

  @override
  Widget build(BuildContext context) {
    final Color color;
    switch (urgency) {
      case 'high':   color = C.red;    break;
      case 'medium': color = C.orange; break;
      default:       color = C.green;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(urgency.toUpperCase(),
        style: GoogleFonts.spaceMono(
          fontSize: 9, color: color, letterSpacing: 1.5,
        )),
    );
  }
}
