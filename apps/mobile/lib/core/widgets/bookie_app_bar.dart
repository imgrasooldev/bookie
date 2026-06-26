import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// One reusable app bar for the whole app.
/// - `showLogo: true`  -> shows the "Bookie." wordmark (used on the home tab).
/// - otherwise          -> shows `title` (+ optional `subtitle`).
/// - `transparent: true` -> for use over a coloured/gradient background.
class BookieAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final String? subtitle;
  final bool showLogo;
  final bool transparent;
  final List<Widget>? actions;

  const BookieAppBar({super.key, this.title, this.subtitle, this.showLogo = false, this.transparent = false, this.actions});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final fg = transparent ? Colors.white : AppColors.ink;
    return AppBar(
      backgroundColor: transparent ? Colors.transparent : Colors.white,
      surfaceTintColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: transparent ? 0 : 0.5,
      foregroundColor: fg,
      iconTheme: IconThemeData(color: fg),
      titleSpacing: 16,
      title: showLogo
          ? BookieWordmark(size: 22, color: fg)
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title ?? '', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: fg)),
                if (subtitle != null)
                  Text(subtitle!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: transparent ? Colors.white70 : AppColors.muted)),
              ],
            ),
      actions: actions ??
          [
            IconButton(onPressed: () {}, icon: Icon(Icons.notifications_none_rounded, color: fg)),
            const SizedBox(width: 4),
          ],
    );
  }
}
