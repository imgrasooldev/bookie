import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/di/injector.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/money.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../data/models/api_models.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/view/sign_in_prompt.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BookieAppBar(title: 'Account'),
      body: BlocBuilder<AuthBloc, AuthState>(
        buildWhen: (a, b) => a.status != b.status,
        builder: (context, state) {
          if (state.status != AuthStatus.authenticated) {
            return const SignInPrompt(message: 'Sign in to view your trips, wallet & rewards.');
          }
          return const _ProfileView();
        },
      ),
    );
  }
}

class _ProfileView extends StatefulWidget {
  const _ProfileView();
  @override
  State<_ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<_ProfileView> {
  late Future<Profile> _future = sl<AuthRepository>().profile();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Profile>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
        final p = snap.data;
        return RefreshIndicator(
          onRefresh: () async => setState(() => _future = sl<AuthRepository>().profile()),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(children: [
                CircleAvatar(radius: 28, backgroundColor: AppColors.brand, child: Text((p?.name.isNotEmpty ?? false) ? p!.name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p?.name ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(p?.phone ?? '', style: const TextStyle(color: AppColors.muted)),
                      if (p != null) Container(margin: const EdgeInsets.only(top: 4), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(8)), child: Text('${p.tier} member', style: const TextStyle(color: AppColors.brand, fontSize: 11, fontWeight: FontWeight.w600))),
                    ],
                  ),
                ),
              ]),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: _stat('Bookie Cash', pkr(p?.walletBalance ?? 0), AppColors.brand)),
                const SizedBox(width: 12),
                Expanded(child: _stat('Reward points', '${p?.rewardPoints ?? 0}', AppColors.accent)),
              ]),
              const SizedBox(height: 20),
              if (p?.email != null) _tile(Icons.email_outlined, p!.email!),
              if (p?.cnic != null) _tile(Icons.badge_outlined, 'CNIC ${p!.cnic}'),
              if (p?.city != null) _tile(Icons.location_city_outlined, p!.city!),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => context.read<AuthBloc>().add(const AuthLogoutRequested()),
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Sign out', style: TextStyle(color: Colors.red)),
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _stat(String label, String value, Color color) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.hairline)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ]),
      );

  Widget _tile(IconData icon, String text) => Card(child: ListTile(leading: Icon(icon, color: AppColors.brand), title: Text(text)));
}
