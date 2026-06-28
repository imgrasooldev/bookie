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

/// Payment step shown after a booking is created (AWAITING_PAYMENT). Options come
/// live from the server (configured gateways + cash-at-terminal). A real gateway
/// opens its hosted checkout; the mock settles instantly; cash reserves the seat
/// to be paid at the counter.
class PaymentPage extends StatefulWidget {
  final Ticket ticket;
  const PaymentPage({super.key, required this.ticket});
  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  List<PayMethod> _methods = [];
  PayMethod? _selected;
  bool _loading = true;
  bool _busy = false;
  PaymentSession? _session; // set once a real gateway checkout is open

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final m = await sl<BookingRepository>().paymentMethods();
      if (!mounted) return;
      setState(() {
        _methods = m;
        _selected = m.isNotEmpty ? m.first : null;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _onConfirmed() async {
    final t = await sl<BookingRepository>().get(widget.ticket.id);
    if (!mounted) return;
    context.read<BookingBloc>().add(const MyBookingsRequested());
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => TicketPage(ticket: t, justBooked: true)));
  }

  Future<void> _pay() async {
    final m = _selected;
    if (m == null) return;
    setState(() => _busy = true);
    try {
      final repo = sl<BookingRepository>();
      if (m.isCash) {
        final status = await repo.payCash(widget.ticket.id);
        if (!mounted) return;
        if (status == 'CONFIRMED') {
          await _onConfirmed();
        } else {
          _snack('Could not reserve. Please try again.');
        }
        return;
      }
      final session = await repo.initiatePayment(widget.ticket.id, gateway: m.name);
      if (session.isMock) {
        final status = await repo.mockCompletePayment(session.transactionId);
        if (!mounted) return;
        if (status == 'CONFIRMED') {
          await _onConfirmed();
        } else {
          _snack('Payment did not go through. Please try again.');
        }
      } else {
        await launchUrl(Uri.parse(session.checkoutUrl), mode: LaunchMode.externalApplication);
        if (mounted) setState(() => _session = session);
      }
    } catch (e) {
      if (mounted) _snack(apiError(e));
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
        _snack('Payment not confirmed yet. Finish on the checkout page, then tap again.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  (IconData, Color) _visual(PayMethod m) {
    switch (m.name) {
      case 'jazzcash':
        return (Icons.account_balance_wallet_rounded, const Color(0xFFDC2626));
      case 'easypaisa':
        return (Icons.account_balance_wallet_rounded, const Color(0xFF16A34A));
      case 'safepay':
        return (Icons.credit_card_rounded, AppColors.brand);
      case 'cash':
        return (Icons.payments_rounded, const Color(0xFFF59E0B));
      case 'mock':
        return (Icons.science_rounded, AppColors.muted);
      default:
        return (Icons.account_balance_wallet_rounded, AppColors.brand);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.ticket;
    final awaitingReturn = _session != null;
    final cash = _selected?.isCash ?? false;
    return Scaffold(
      appBar: const BookieAppBar(title: 'Payment'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(gradient: AppColors.brandGradient, borderRadius: BorderRadius.circular(18)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(cash ? 'Amount to pay at terminal' : 'Amount to pay', style: const TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 4),
              Text(pkr(t.total), style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text('${t.title}  ·  ${t.ref}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ]),
          ),
          const SizedBox(height: 22),
          const Text('Pay with', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 10),
          if (_loading)
            const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))
          else
            ..._methods.map((m) {
              final on = _selected?.name == m.name;
              final (icon, color) = _visual(m);
              return GestureDetector(
                onTap: awaitingReturn ? null : () => setState(() => _selected = m),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: on ? AppColors.brand : AppColors.hairline, width: on ? 2 : 1),
                  ),
                  child: Row(children: [
                    Icon(icon, color: color),
                    const SizedBox(width: 12),
                    Expanded(child: Text(m.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
                    Icon(on ? Icons.radio_button_checked : Icons.radio_button_off, color: on ? AppColors.brand : AppColors.muted, size: 20),
                  ]),
                ),
              );
            }),
          if (cash && !awaitingReturn)
            const Padding(
              padding: EdgeInsets.only(bottom: 6),
              child: Text('Your seat is reserved now; pay the fare in cash at the terminal counter before departure.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
            ),
          const SizedBox(height: 8),
          if (!awaitingReturn)
            FilledButton(
              onPressed: _busy || _loading || _selected == null ? null : _pay,
              style: FilledButton.styleFrom(backgroundColor: AppColors.accent, minimumSize: const Size.fromHeight(54)),
              child: _busy
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(cash ? 'Reserve — pay ${pkr(t.total)} at terminal' : 'Pay ${pkr(t.total)}'),
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
          const Center(child: Text('Secured by Bookie', style: TextStyle(fontSize: 11, color: AppColors.muted))),
        ],
      ),
    );
  }
}
