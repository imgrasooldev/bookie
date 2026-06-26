import 'package:flutter/material.dart';

import '../../core/di/injector.dart';
import '../../core/storage/onboarding_store.dart';
import '../../core/theme/app_theme.dart';
import '../../shell/home_shell.dart';
import '../onboarding/onboarding_page.dart';

/// Branded splash shown on launch, then routes into the app shell (no login
/// gate — guests can browse straight away).
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});
  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1900), () {
      if (!mounted) return;
      // First launch -> walkthrough; afterwards -> straight into the app.
      final next = sl<OnboardingStore>().seen ? const HomeShell() : const OnboardingPage();
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 450),
          pageBuilder: (_, a, __) => FadeTransition(opacity: a, child: next),
        ),
      );
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scale = CurvedAnimation(parent: _c, curve: Curves.easeOutBack);
    final fade = CurvedAnimation(parent: _c, curve: Curves.easeIn);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: scale,
                child: FadeTransition(
                  opacity: fade,
                  child: Column(
                    children: [
                      Container(
                        height: 84,
                        width: 84,
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(24)),
                        child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 46),
                      ),
                      const SizedBox(height: 20),
                      const BookieWordmark(size: 40, color: Colors.white),
                      const SizedBox(height: 8),
                      Text("Pakistan's travel, booked in seconds",
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 14)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 48),
              const SizedBox(
                height: 26,
                width: 26,
                child: CircularProgressIndicator(strokeWidth: 2.4, valueColor: AlwaysStoppedAnimation(Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
