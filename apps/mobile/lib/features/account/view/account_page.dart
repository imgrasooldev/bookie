import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../../core/di/injector.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/money.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../core/widgets/shimmer.dart';
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

class _AccountData {
  final Profile profile;
  final Wallet wallet;
  final List<Traveller> travellers;
  const _AccountData(this.profile, this.wallet, this.travellers);
}

class _ProfileView extends StatefulWidget {
  const _ProfileView();
  @override
  State<_ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<_ProfileView> {
  late Future<_AccountData> _future = _load();

  // load profile + wallet + travellers together; tolerate the sub-resources failing
  Future<_AccountData> _load() async {
    final repo = sl<AuthRepository>();
    final pf = repo.profile();
    final wl = repo.wallet().catchError((_) => const Wallet(balance: 0, transactions: []));
    final tv = repo.travellers().catchError((_) => <Traveller>[]);
    return _AccountData(await pf, await wl, await tv);
  }

  Future<void> _refresh() async {
    final f = _load();
    setState(() => _future = f);
    try {
      await f;
    } catch (_) {/* keep the indicator from hanging */}
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_AccountData>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done && !snap.hasData) {
          return const _ProfileSkeleton();
        }
        if (!snap.hasData) {
          return RefreshIndicator(
            onRefresh: _refresh,
            color: AppColors.brand,
            child: ListView(children: const [SizedBox(height: 220), Center(child: Text('Could not load your account.', style: TextStyle(color: AppColors.muted)))]),
          );
        }
        final data = snap.data!;
        final p = data.profile;
        return RefreshIndicator(
          onRefresh: _refresh,
          color: AppColors.brand,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
            children: [
              _Header(profile: p),
              const SizedBox(height: 16),
              _statsRow(p),
              const SizedBox(height: 20),
              _PersonalDetails(profile: p),
              const SizedBox(height: 20),
              _WalletCard(wallet: data.wallet),
              const SizedBox(height: 20),
              _TravellersCard(travellers: data.travellers),
              if (p.referralCode != null) ...[
                const SizedBox(height: 20),
                _ReferralCard(code: p.referralCode!),
              ],
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => context.read<AuthBloc>().add(const AuthLogoutRequested()),
                icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 20),
                label: const Text('Sign out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50), side: const BorderSide(color: Color(0xFFFECACA))),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _statsRow(Profile p) => Row(children: [
        Expanded(child: _StatCard(label: 'Bookie Cash', value: pkr(p.walletBalance), icon: Icons.account_balance_wallet_outlined, color: AppColors.brand)),
        const SizedBox(width: 10),
        Expanded(child: _StatCard(label: 'Reward points', value: '${p.rewardPoints}', icon: Icons.stars_rounded, color: AppColors.accent)),
        const SizedBox(width: 10),
        Expanded(child: _StatCard(label: 'Upcoming', value: '${p.upcomingTrips}', icon: Icons.event_available_outlined, color: const Color(0xFF0F9D58))),
      ]);
}

// ---------------- sections ----------------

class _Header extends StatelessWidget {
  final Profile profile;
  const _Header({required this.profile});

  @override
  Widget build(BuildContext context) {
    final initial = profile.name.isNotEmpty ? profile.name[0].toUpperCase() : '?';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.brand.withValues(alpha: 0.30), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Row(children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: Colors.white,
          backgroundImage: (profile.avatar != null && profile.avatar!.isNotEmpty) ? NetworkImage(profile.avatar!) : null,
          child: (profile.avatar == null || profile.avatar!.isEmpty)
              ? Text(initial, style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold, fontSize: 22))
              : null,
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(profile.name, style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(profile.phone, style: const TextStyle(color: Colors.white70, fontSize: 13)),
              if (profile.email != null) Text(profile.email!, style: const TextStyle(color: Colors.white70, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(20)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text('${profile.tier} member', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                  ]),
                ),
                const SizedBox(width: 8),
                Text('Since ${profile.memberSince}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
              ]),
            ],
          ),
        ),
      ]),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.hairline)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color), maxLines: 1, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
      ]),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailing;
  const _SectionCard({required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.hairline)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 6),
            child: Row(children: [
              Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.ink)),
              const Spacer(),
              if (trailing != null) trailing!,
            ]),
          ),
          child,
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

class _PersonalDetails extends StatelessWidget {
  final Profile profile;
  const _PersonalDetails({required this.profile});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[
      if (profile.email != null) _detailRow(Icons.email_outlined, 'Email', profile.email!),
      if (profile.cnic != null) _detailRow(Icons.badge_outlined, 'CNIC', profile.cnic!),
      if (profile.dob != null && profile.dob!.isNotEmpty) _detailRow(Icons.cake_outlined, 'Date of birth', profile.dob!),
      if (profile.gender != null) _detailRow(Icons.wc_outlined, 'Gender', profile.gender!),
      if (profile.city != null) _detailRow(Icons.location_city_outlined, 'City', profile.city!),
    ];
    return _SectionCard(
      title: 'Personal details',
      child: rows.isEmpty
          ? const Padding(padding: EdgeInsets.fromLTRB(16, 4, 16, 12), child: Text('Add your details for faster checkout.', style: TextStyle(color: AppColors.muted, fontSize: 13)))
          : Column(children: rows),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        child: Row(children: [
          Icon(icon, size: 18, color: AppColors.muted),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
          const Spacer(),
          Flexible(child: Text(value, style: const TextStyle(color: AppColors.ink, fontSize: 13, fontWeight: FontWeight.w600), textAlign: TextAlign.right, maxLines: 1, overflow: TextOverflow.ellipsis)),
        ]),
      );
}

class _WalletCard extends StatelessWidget {
  final Wallet wallet;
  const _WalletCard({required this.wallet});

  String _fmtDate(String iso) {
    final d = DateTime.tryParse(iso);
    return d == null ? '' : DateFormat('d MMM yyyy').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final tx = wallet.transactions.take(5).toList();
    return _SectionCard(
      title: 'Bookie wallet',
      trailing: Text(pkr(wallet.balance), style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w800, fontSize: 15)),
      child: tx.isEmpty
          ? const Padding(padding: EdgeInsets.fromLTRB(16, 4, 16, 12), child: Text('No transactions yet.', style: TextStyle(color: AppColors.muted, fontSize: 13)))
          : Column(
              children: tx.map((t) {
                final credit = t.kind == 'credit';
                final amt = t.amount.abs();
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                  child: Row(children: [
                    Container(
                      width: 34, height: 34,
                      decoration: BoxDecoration(color: (credit ? const Color(0xFF0F9D58) : Colors.red).withValues(alpha: 0.10), borderRadius: BorderRadius.circular(9)),
                      child: Icon(credit ? Icons.south_west_rounded : Icons.north_east_rounded, size: 18, color: credit ? const Color(0xFF0F9D58) : Colors.red),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(t.desc, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text(_fmtDate(t.date), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                      ]),
                    ),
                    Text('${credit ? '+' : '−'}${pkr(amt)}', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: credit ? const Color(0xFF0F9D58) : Colors.red)),
                  ]),
                );
              }).toList(),
            ),
    );
  }
}

class _TravellersCard extends StatelessWidget {
  final List<Traveller> travellers;
  const _TravellersCard({required this.travellers});

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Saved travellers',
      trailing: Text('${travellers.length}', style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700)),
      child: travellers.isEmpty
          ? const Padding(padding: EdgeInsets.fromLTRB(16, 4, 16, 12), child: Text('Travellers you book for are saved here.', style: TextStyle(color: AppColors.muted, fontSize: 13)))
          : Column(
              children: travellers.map((t) {
                final female = t.gender == 'Female';
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(children: [
                    CircleAvatar(radius: 17, backgroundColor: (female ? const Color(0xFFEC4899) : AppColors.brand).withValues(alpha: 0.12), child: Text(t.name.isNotEmpty ? t.name[0].toUpperCase() : '?', style: TextStyle(color: female ? const Color(0xFFEC4899) : AppColors.brand, fontWeight: FontWeight.bold, fontSize: 14))),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(t.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink)),
                        Text('${t.relation} · CNIC ${t.cnic}', style: const TextStyle(fontSize: 11, color: AppColors.muted), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ]),
                    ),
                    Text(female ? '♀' : '♂', style: TextStyle(color: female ? const Color(0xFFEC4899) : AppColors.brand, fontSize: 16, fontWeight: FontWeight.bold)),
                  ]),
                );
              }).toList(),
            ),
    );
  }
}

class _ReferralCard extends StatelessWidget {
  final String code;
  const _ReferralCard({required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.accent.withValues(alpha: 0.30))),
      child: Row(children: [
        const Icon(Icons.card_giftcard_rounded, color: AppColors.accent),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Refer & earn', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink, fontSize: 14)),
            Text('Your code: $code', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          ]),
        ),
        OutlinedButton(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: code));
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Referral code copied')));
          },
          style: OutlinedButton.styleFrom(foregroundColor: AppColors.accent, side: const BorderSide(color: AppColors.accent)),
          child: const Text('Copy'),
        ),
      ]),
    );
  }
}

// Shimmer placeholder shown while the account loads.
class _ProfileSkeleton extends StatelessWidget {
  const _ProfileSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: ListView(
        padding: const EdgeInsets.all(16),
        physics: const NeverScrollableScrollPhysics(),
        children: const [
          SkeletonBox(height: 96, radius: 20),
          SizedBox(height: 16),
          Row(children: [
            Expanded(child: SkeletonBox(height: 80, radius: 16)),
            SizedBox(width: 10),
            Expanded(child: SkeletonBox(height: 80, radius: 16)),
            SizedBox(width: 10),
            Expanded(child: SkeletonBox(height: 80, radius: 16)),
          ]),
          SizedBox(height: 20),
          SkeletonBox(height: 150, radius: 16),
          SizedBox(height: 20),
          SkeletonBox(height: 160, radius: 16),
        ],
      ),
    );
  }
}
