import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract class C {
  static const Color bg     = Color(0xFF030712);
  static const Color surf1  = Color(0xFF070B14);
  static const Color surf2  = Color(0xFF0B101C);
  static const Color surf3  = Color(0xFF0F1623);

  static const Color border      = Color(0x17FFFFFF);
  static const Color borderHover = Color(0x2EFFFFFF);

  static const Color text1 = Color(0xFFF1F5F9);
  static const Color text2 = Color(0xFF94A3B8);
  static const Color text3 = Color(0xFF64748B);
  static const Color text4 = Color(0xFF334155);

  static const Color gold   = Color(0xFFF59E0B);
  static const Color blue   = Color(0xFF6366F1);
  static const Color green  = Color(0xFF10B981);
  static const Color red    = Color(0xFFEF4444);
  static const Color orange = Color(0xFFF97316);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color teal   = Color(0xFF14B8A6);
  static const Color pink   = Color(0xFFEC4899);
  static const Color indigo = Color(0xFF6366F1);

  static const Color greenMuted  = Color(0x1A10B981);
  static const Color blueMuted   = Color(0x1A6366F1);
  static const Color goldMuted   = Color(0x1AF59E0B);
  static const Color redMuted    = Color(0x1AEF4444);
  static const Color orangeMuted = Color(0x1AF97316);
  static const Color purpleMuted = Color(0x1A8B5CF6);
  static const Color pinkMuted   = Color(0x1AEC4899);

  static Color withAlpha(Color c, double opacity) =>
      c.withValues(alpha: opacity);
}

class AppTheme {
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: C.bg,
    colorScheme: const ColorScheme.dark(
      primary: C.blue,
      secondary: C.gold,
      surface: C.surf1,
      error: C.red,
    ),
    textTheme: _textTheme,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0x0AFFFFFF),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: C.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: C.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0x806366F1)),
      ),
      hintStyle: GoogleFonts.inter(color: C.text4, fontSize: 13),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
    ),
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: WidgetStateProperty.all(const Color(0x336366F1)),
      thickness: WidgetStateProperty.all(3),
      radius: const Radius.circular(2),
    ),
  );

  static TextTheme get _textTheme => TextTheme(
    displayLarge: GoogleFonts.syne(
      fontSize: 56, fontWeight: FontWeight.w800,
      color: C.text1, letterSpacing: -2,
    ),
    displayMedium: GoogleFonts.syne(
      fontSize: 42, fontWeight: FontWeight.w800,
      color: C.text1, letterSpacing: -1.5,
    ),
    displaySmall: GoogleFonts.syne(
      fontSize: 32, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -1,
    ),
    headlineLarge: GoogleFonts.syne(
      fontSize: 26, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -0.8,
    ),
    headlineMedium: GoogleFonts.syne(
      fontSize: 20, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -0.5,
    ),
    headlineSmall: GoogleFonts.syne(
      fontSize: 16, fontWeight: FontWeight.w700,
      color: C.text1, letterSpacing: -0.3,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: 14, fontWeight: FontWeight.w600,
      color: C.text1, letterSpacing: -0.2,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 13, fontWeight: FontWeight.w600,
      color: C.text1,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 12, fontWeight: FontWeight.w500,
      color: C.text2,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: 15, color: C.text2, height: 1.7,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 13, color: C.text2, height: 1.6,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12, color: C.text3, height: 1.5,
    ),
    labelLarge: GoogleFonts.spaceMono(
      fontSize: 11, color: C.text3, letterSpacing: 1.5,
    ),
    labelMedium: GoogleFonts.spaceMono(
      fontSize: 10, color: C.text3, letterSpacing: 1.5,
    ),
    labelSmall: GoogleFonts.spaceMono(
      fontSize: 9, color: C.text4, letterSpacing: 2,
    ),
  );
}
