import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/theme/app_theme.dart';
import '../features/trips/view/search_page.dart';
import '../features/bookings/view/my_bookings_page.dart';
import '../features/account/view/account_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final _navKey = GlobalKey<CurvedNavigationBarState>();
  int _index = 0;
  static const _pages = [SearchPage(), MyBookingsPage(), AccountPage()];

  static const _icons = [
    Icons.search_rounded,
    Icons.confirmation_num_rounded,
    Icons.person_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // the curve shows the page bg through the notch — keep them the same
      backgroundColor: AppColors.bg,
      body: IndexedStack(index: _index, children: _pages),
      // SafeArea(bottom) lifts the bar above the Android system navigation /
      // gesture inset so the system back/home buttons no longer overlap it.
      // The inset strip below shows the scaffold bg, matching the bar's notch.
      bottomNavigationBar: SafeArea(
        top: false,
        child: CurvedNavigationBar(
          key: _navKey,
          index: _index,
          height: 64,
          // dark bar + brand-orange floating button, page bg through the notch
          color: AppColors.ink,
          buttonBackgroundColor: AppColors.accent,
          backgroundColor: AppColors.bg,
          animationCurve: Curves.easeOutQuint,
          animationDuration: const Duration(milliseconds: 450),
          items: List.generate(_icons.length, (i) {
            final selected = i == _index;
            return Icon(
              _icons[i],
              size: selected ? 30 : 26,
              color: Colors.white,
            );
          }),
          onTap: (i) {
            HapticFeedback.selectionClick();
            setState(() => _index = i);
          },
        ),
      ),
    );
  }
}
