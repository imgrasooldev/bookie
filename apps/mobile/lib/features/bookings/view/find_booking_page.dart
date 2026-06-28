import 'package:flutter/material.dart';

import '../../../core/di/injector.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/formatters.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../data/repositories/booking_repository.dart';
import 'ticket_page.dart';

/// Retrieve a guest booking by reference + mobile number — no account needed.
/// Mirrors the web "manage booking" lookup.
class FindBookingPage extends StatefulWidget {
  const FindBookingPage({super.key});
  @override
  State<FindBookingPage> createState() => _FindBookingPageState();
}

class _FindBookingPageState extends State<FindBookingPage> {
  final _ref = TextEditingController();
  final _phone = TextEditingController(text: '03');
  bool _busy = false;

  @override
  void dispose() {
    _ref.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _find() async {
    final ref = _ref.text.trim().toUpperCase();
    if (ref.length < 5) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter your booking reference (e.g. BK…).')));
      return;
    }
    if (!isValidPkMobile(_phone.text)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter the mobile number used for the booking.')));
      return;
    }
    setState(() => _busy = true);
    try {
      final ticket = await sl<BookingRepository>().lookup(ref, onlyDigits(_phone.text));
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => TicketPage(ticket: ticket)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BookieAppBar(title: 'Find a booking'),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Booked as a guest?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
          const SizedBox(height: 6),
          const Text('Enter your booking reference and the mobile number you booked with to pull up your e-ticket.', style: TextStyle(color: AppColors.muted)),
          const SizedBox(height: 24),
          TextField(
            controller: _ref,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'Booking reference', hintText: 'BK…'),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            inputFormatters: [PhoneInputFormatter()],
            decoration: const InputDecoration(labelText: 'Mobile number', hintText: '0300-1234567'),
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: _busy ? null : _find,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: _busy
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Find my e-ticket'),
          ),
        ],
      ),
    );
  }
}
