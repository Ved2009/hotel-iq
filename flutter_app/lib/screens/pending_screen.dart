import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class PendingScreen extends StatelessWidget {
  const PendingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.bg,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [C.violet.withValues(alpha: 0.2), C.violetDark.withValues(alpha: 0.1)],
                ),
                border: Border.all(color: C.violet.withValues(alpha: 0.3)),
                shape: BoxShape.circle,
              ),
              child: const Center(child: Text('⏳', style: TextStyle(fontSize: 36))),
            ),
            const SizedBox(height: 32),

            // Logo
            RichText(text: TextSpan(children: [
              TextSpan(text: 'Hotel',
                style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.text1)),
              TextSpan(text: 'IQ',
                style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.gold)),
            ])),
            const SizedBox(height: 24),

            Text('Account Pending Approval',
              style: GoogleFonts.syne(fontSize: 24, fontWeight: FontWeight.w700, color: C.text1, letterSpacing: -0.5)),
            const SizedBox(height: 12),

            SizedBox(
              width: 420,
              child: Text(
                'Your account has been created and is waiting for admin approval. '
                'You\'ll have full access to Hotel IQ once it\'s approved.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 15, color: C.text2, height: 1.7),
              ),
            ),
            const SizedBox(height: 40),

            // Steps
            Container(
              width: 420,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: C.glass,
                border: Border.all(color: C.border),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(children: [
                for (final step in [
                  ('✓', 'Account created', 'Your account is in the system', C.green),
                  ('⏳', 'Awaiting approval', 'An admin will review your request', C.orange),
                  ('◇', 'Full access granted', 'Dashboard, AI analyst, and all features', C.text4),
                ])
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          color: step.$4.withValues(alpha: 0.1),
                          border: Border.all(color: step.$4.withValues(alpha: 0.3)),
                          shape: BoxShape.circle,
                        ),
                        child: Center(child: Text(step.$1,
                          style: TextStyle(fontSize: 13, color: step.$4))),
                      ),
                      const SizedBox(width: 14),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(step.$2,
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: step.$4 == C.text4 ? C.text4 : C.text1)),
                        Text(step.$3,
                          style: GoogleFonts.inter(fontSize: 12, color: C.text3, height: 1.4)),
                      ])),
                    ]),
                  ),
              ]),
            ),
            const SizedBox(height: 32),

            GestureDetector(
              onTap: () => context.read<AppProvider>().logout(),
              child: Text('Sign out',
                style: GoogleFonts.inter(fontSize: 13, color: C.text3,
                  decoration: TextDecoration.underline, decorationColor: C.text3)),
            ),
          ],
        ),
      ),
    );
  }
}
