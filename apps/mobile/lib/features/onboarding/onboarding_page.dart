import 'package:flutter/material.dart';

import '../../core/di/injector.dart';
import '../../core/storage/onboarding_store.dart';
import '../../core/theme/app_theme.dart';
import '../../shell/home_shell.dart';

class _Slide {
  final IconData icon;
  final String title;
  final String body;
  const _Slide(this.icon, this.title, this.body);
}

const _slides = [
  _Slide(Icons.travel_explore_rounded, 'Everything in one place',
      'Search buses, flights, trains, hotels and city rides across Pakistan — compare verified operators in seconds.'),
  _Slide(Icons.event_seat_rounded, 'Pick your perfect seat',
      'Choose your seats on a live map with male/female seating, right from your phone. No surprises at boarding.'),
  _Slide(Icons.qr_code_2_rounded, 'Pay & travel with ease',
      'Pay with Easypaisa, JazzCash, card or cash. Get an instant e-ticket with a QR code — and refunds straight to your wallet.'),
];

/// First-run walkthrough. Shown once; sets the "seen" flag on finish/skip.
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});
  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pc = PageController();
  int _i = 0;

  bool get _last => _i == _slides.length - 1;

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await sl<OnboardingStore>().markSeen();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        pageBuilder: (_, a, __) => FadeTransition(opacity: a, child: const HomeShell()),
      ),
    );
  }

  void _next() => _last ? _finish() : _pc.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: _finish, child: const Text('Skip', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600))),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pc,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _i = i),
                itemBuilder: (_, i) => _SlideView(slide: _slides[i]),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slides.length, (i) {
                final on = i == _i;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 8,
                  width: on ? 24 : 8,
                  decoration: BoxDecoration(color: on ? AppColors.brand : AppColors.hairline, borderRadius: BorderRadius.circular(4)),
                );
              }),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: FilledButton(
                onPressed: _next,
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
                child: Text(_last ? 'Get started' : 'Next'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SlideView extends StatelessWidget {
  final _Slide slide;
  const _SlideView({required this.slide});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            height: 160,
            width: 160,
            decoration: BoxDecoration(gradient: AppColors.brandGradient, shape: BoxShape.circle, boxShadow: [
              BoxShadow(color: AppColors.brand.withValues(alpha: 0.35), blurRadius: 40, offset: const Offset(0, 20)),
            ]),
            child: Icon(slide.icon, size: 78, color: Colors.white),
          ),
          const SizedBox(height: 48),
          Text(slide.title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.ink, height: 1.1)),
          const SizedBox(height: 14),
          Text(slide.body, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: AppColors.muted, height: 1.5)),
        ],
      ),
    );
  }
}
