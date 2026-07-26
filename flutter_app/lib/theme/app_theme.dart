import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract class C {
  // Backgrounds — soft charcoal-navy instead of near-black, same dark aesthetic
  static const Color bg    = Color(0xFF12141C);
  static const Color surf1 = Color(0xFF1A1D29);
  static const Color surf2 = Color(0xFF20232F);
  static const Color surf3 = Color(0xFF272B3A);
  static const Color glass = Color(0x0DFFFFFF);
  static const Color glassStrong = Color(0x1AFFFFFF);

  // Borders — slightly more visible against the lighter background
  static const Color border      = Color(0x14FFFFFF);
  static const Color borderMid   = Color(0x22FFFFFF);
  static const Color borderHover = Color(0x36FFFFFF);

  // Text — brightened for better contrast against the lighter background
  static const Color text1 = Color(0xFFF8F8FF);
  static const Color text2 = Color(0xFFACACC8);
  static const Color text3 = Color(0xFF7B7B9E);
  static const Color text4 = Color(0xFF4A4A68);

  // Brand
  static const Color violet = Color(0xFF7C3AED);
  static const Color violetLight = Color(0xFF9F67FF);
  static const Color violetDark  = Color(0xFF5B21B6);
  static const Color gold   = Color(0xFFF59E0B);
  static const Color goldLight = Color(0xFFFFBF40);

  // Status
  static const Color blue   = Color(0xFF3B82F6);
  static const Color green  = Color(0xFF10B981);
  static const Color red    = Color(0xFFEF4444);
  static const Color orange = Color(0xFFF97316);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color teal   = Color(0xFF14B8A6);
  static const Color pink   = Color(0xFFEC4899);

  // Muted versions
  static Color muted(Color c, [double alpha = 0.12]) => c.withValues(alpha: alpha);
}

class AppTheme {
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: C.bg,
    colorScheme: const ColorScheme.dark(
      primary: C.violet,
      secondary: C.gold,
      surface: C.surf1,
      error: C.red,
    ),
    textTheme: _textTheme,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0x0AFFFFFF),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: C.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: C.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0x807C3AED), width: 1.5),
      ),
      hintStyle: GoogleFonts.inter(color: C.text4, fontSize: 13),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
    ),
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: WidgetStateProperty.all(C.violet.withValues(alpha: 0.3)),
      thickness: WidgetStateProperty.all(3),
      radius: const Radius.circular(2),
    ),
  );

  static TextTheme get _textTheme => TextTheme(
    displayLarge: GoogleFonts.syne(
      fontSize: 64, fontWeight: FontWeight.w800,
      color: C.text1, letterSpacing: -2.5, height: 1.05,
    ),
    displayMedium: GoogleFonts.syne(
      fontSize: 48, fontWeight: FontWeight.w800,
      color: C.text1, letterSpacing: -2, height: 1.08,
    ),
    displaySmall: GoogleFonts.syne(
      fontSize: 36, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -1.5, height: 1.1,
    ),
    headlineLarge: GoogleFonts.syne(
      fontSize: 28, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -1,
    ),
    headlineMedium: GoogleFonts.syne(
      fontSize: 22, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -0.5,
    ),
    headlineSmall: GoogleFonts.syne(
      fontSize: 17, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -0.3,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: 15, fontWeight: FontWeight.w600,
      color: C.text1, letterSpacing: -0.3,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 13, fontWeight: FontWeight.w600,
      color: C.text1,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: 16, color: C.text2, height: 1.75,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 14, color: C.text2, height: 1.65,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12, color: C.text3, height: 1.5,
    ),
    labelLarge: GoogleFonts.spaceMono(
      fontSize: 11, color: C.text3, letterSpacing: 1.5,
    ),
    labelSmall: GoogleFonts.spaceMono(
      fontSize: 9, color: C.text4, letterSpacing: 2,
    ),
  );
}
