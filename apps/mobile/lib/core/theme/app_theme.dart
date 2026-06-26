import 'package:flutter/material.dart';

/// Brand palette mirrored from the web (apps/web globals.css).
class AppColors {
  static const brand = Color(0xFF155CC9);
  static const brand700 = Color(0xFF1149A1);
  static const brand900 = Color(0xFF0E336C);
  static const brand50 = Color(0xFFEEF4FF);
  static const accent = Color(0xFFF97316);
  static const accent600 = Color(0xFFEA580C);
  static const ink = Color(0xFF0A1222);
  static const muted = Color(0xFF64748B);
  static const bg = Color(0xFFF8FAFC);
  static const hairline = Color(0xFFE2E8F0);

  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand, brand900],
  );
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.brand,
    primary: AppColors.brand,
    secondary: AppColors.accent,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.bg,
    fontFamily: 'Roboto',
    appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, foregroundColor: AppColors.ink, elevation: 0, scrolledUnderElevation: 0),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: AppColors.hairline)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.hairline)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.hairline)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.brand,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      indicatorColor: AppColors.brand50,
      elevation: 12,
      height: 64,
      labelTextStyle: const WidgetStatePropertyAll(TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(color: states.contains(WidgetState.selected) ? AppColors.brand : AppColors.muted),
      ),
    ),
  );
}

/// Brand wordmark "Bookie." with the orange dot (matches the web logo).
class BookieWordmark extends StatelessWidget {
  final double size;
  final Color color;
  const BookieWordmark({super.key, this.size = 28, this.color = AppColors.ink});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(fontSize: size, fontWeight: FontWeight.w800, color: color, letterSpacing: -0.5),
        children: const [
          TextSpan(text: 'Bookie'),
          TextSpan(text: '.', style: TextStyle(color: AppColors.accent)),
        ],
      ),
    );
  }
}
