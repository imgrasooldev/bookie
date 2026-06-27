import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/util/money.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../core/widgets/shimmer.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/view/sign_in_prompt.dart';
import '../bloc/booking_bloc.dart';
import 'ticket_page.dart';

class MyBookingsPage extends StatelessWidget {
  const MyBookingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BookieAppBar(title: 'My Trips'),
      body: BlocBuilder<AuthBloc, AuthState>(
        buildWhen: (a, b) => a.status != b.status,
        builder: (context, state) {
          if (state.status != AuthStatus.authenticated) {
            return const SignInPrompt(message: 'Sign in to see your bookings & e-tickets.');
          }
          return const _BookingsList();
        },
      ),
    );
  }
}

class _BookingsList extends StatefulWidget {
  const _BookingsList();
  @override
  State<_BookingsList> createState() => _BookingsListState();
}

class _BookingsListState extends State<_BookingsList> {
  @override
  void initState() {
    super.initState();
    context.read<BookingBloc>().add(const MyBookingsRequested());
  }

  Future<void> _refresh() async {
    context.read<BookingBloc>().add(const MyBookingsRequested());
    await context.read<BookingBloc>().stream.firstWhere((s) => s.status != BookingStatus.loading);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      color: AppColors.brand,
      child: BlocBuilder<BookingBloc, BookingState>(
        builder: (context, state) {
          if (state.status == BookingStatus.loading && state.tickets.isEmpty) {
            return SkeletonList(count: 5, itemBuilder: (_, __) => const BookingCardSkeleton());
          }
          if (state.tickets.isEmpty) {
            return ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
              const SizedBox(height: 160),
              Center(child: Text(state.error ?? 'No bookings yet.', style: const TextStyle(color: AppColors.muted))),
            ]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: state.tickets.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final t = state.tickets[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  leading: CircleAvatar(backgroundColor: AppColors.brand50, child: const Icon(Icons.confirmation_num_outlined, color: AppColors.brand)),
                  title: Text(t.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${t.ref} · ${t.operator}${t.seats.isNotEmpty ? ' · ${t.seats.join(', ')}' : ''}'),
                  trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(pkr(t.total), style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(t.status, style: TextStyle(fontSize: 11, color: t.isCancelled ? Colors.red : Colors.green)),
                  ]),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => TicketPage(ticket: t))),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
