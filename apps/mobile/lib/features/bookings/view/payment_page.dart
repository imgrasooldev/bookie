import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/di/injector.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/money.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../data/models/api_models.dart';
import '../../../data/repositories/booking_repository.dart';
import '../bloc/booking_bloc.dart';
import 'ticket_page.dart';

const _methods = [
  ('Easypaisa', Icons.account_balance_wallet_rounded, Color(0xFF16A34A)),
  ('JazzCash', Icons.account_balance_wallet_rounded, Color(0xFFDC2626)),
  ('Card', Icons.credit_card_rounded, AppColors.brand),
];

/// Payment step shown after a booking is created (AWAITING_PAYMENT). Drives the
/// gateway: the mock gateway settles instantly (sandbox); a real gateway opens
/// its hosted checkout and we poll for confirmation.
class PaymentPage extends StatefulWidget {
  final Ticket ticket;
  const PaymentPage({super.key, required this.ticket});
  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  String _method = 'Easypaisa';
  bool _busy = false;
  PaymentSession? _session; // set once a real gateway checkout is open

  Future<void> _onConfirmed() async {
    final t = await sl<BookingRepository>().get(widget.ticket.id);
    if (!mounted) return;
    context.read<BookingBloc>().add(const MyBookingsRequested());
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => TicketPage(ticket: t, justBooked: true)));
  }

  Future<void> _pay() async {
    setState(() => _busy = true);
    try {
      final repo = sl<BookingRepository>();
      final session = await repo.initiatePayment(widget.ticket.id);
      if (session.isMock) {
        // sandbox: complete immediately
        final status = await repo.mockCompletePayment(session.transactionId);
        if (!mounted) return;
        if (status == 'CONFIRMED') {
          await _onConfirmed();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment did not go through. Please try again.')));
        }
      } else {
        // real gateway: open the hosted checkout, then poll on return
        await launchUrl(Uri.parse(session.checkoutUrl), mode: LaunchMode.externalApplication);
        if (mounted) setState(() => _session = session);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _checkStatus() async {
    setState(() => _busy = true);
    try {
      final status = await sl<BookingRepository>().paymentStatus(_session!.transactionId);
      if (!mounted) return;
      if (status == 'CONFIRMED') {
        await _onConfirmed();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment not confirmed yet. Finish on the checkout page, then tap again.')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.ticket;
    final awaitingReturn = _session != null;
    return Scaffold(
      appBar: const BookieAppBar(title: 'Payment'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(18)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Amount to pay', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 4),
              Text(pkr(t.total), style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text('${t.title}  ·  ${t.ref}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ]),
          ),
          const SizedBox(height: 22),
          const Text('Pay with', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 10),
          ..._methods.map((m) {
            final on = _method == m.$1;
            return GestureDetector(
              onTap: awaitingReturn ? null : () => setState(() => _method = m.$1),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: on ? AppColors.brand : AppColors.hairline, width: on ? 2 : 1),
                ),
                child: Row(children: [
                  Icon(m.$2, color: m.$3),
                  const SizedBox(width: 12),
                  Text(m.$1, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const Spacer(),
                  Icon(on ? Icons.radio_button_checked : Icons.radio_button_off, color: on ? AppColors.brand : AppColors.muted, size: 20),
                ]),
              ),
            );
          }),
          const SizedBox(height: 14),
          if (!awaitingReturn)
            FilledButton(
              onPressed: _busy ? null : _pay,
              style: FilledButton.styleFrom(backgroundColor: AppColors.accent, minimumSize: const Size.fromHeight(54)),
              child: _busy
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('Pay ${pkr(t.total)}'),
            )
          else ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text('Complete the payment on the checkout page that opened, then tap below.', style: TextStyle(color: AppColors.muted)),
            ),
            FilledButton(
              onPressed: _busy ? null : _checkStatus,
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
              child: _busy
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text("I've paid — show my ticket"),
            ),
          ],
          const SizedBox(height: 10),
          const Center(child: Text('Secured by Bookie · sandbox mode until a live gateway is connected', style: TextStyle(fontSize: 11, color: AppColors.muted))),
        ],
      ),
    );
  }
}
