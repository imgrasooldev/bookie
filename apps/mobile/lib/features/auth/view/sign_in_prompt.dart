import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import 'login_page.dart';

/// Shown on auth-gated tabs (Account, My Trips) and at the booking step when
/// the user is browsing as a guest.
class SignInPrompt extends StatelessWidget {
  final String message;
  const SignInPrompt({super.key, this.message = 'Sign in to continue'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(radius: 32, backgroundColor: AppColors.brand50, child: Icon(Icons.lock_outline_rounded, color: AppColors.brand, size: 30)),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: AppColors.muted)),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginPage())),
              style: FilledButton.styleFrom(minimumSize: const Size(180, 48)),
              child: const Text('Sign in / Sign up'),
            ),
          ],
        ),
      ),
    );
  }
}
