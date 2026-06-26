import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/di/injector.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/formatters.dart';
import '../../../core/util/money.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../data/models/api_models.dart';
import '../../../data/repositories/booking_repository.dart';
import '../../../data/repositories/trip_repository.dart';
import '../../../models.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/view/login_page.dart';
import '../bloc/booking_bloc.dart';
import 'seat_picker.dart';
import 'ticket_page.dart';

class BookingPage extends StatefulWidget {
  final Trip trip;
  const BookingPage({super.key, required this.trip});
  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  final _cnic = TextEditingController();
  late Future<Trip> _detail = sl<TripRepository>().trip(widget.trip.id);
  Map<String, String> _seats = {}; // seat -> gender
  bool _busy = false;

  bool get _isBus => widget.trip.serviceType == 'BUS';

  @override
  void dispose() {
    _cnic.dispose();
    super.dispose();
  }

  Future<void> _confirm(AuthUser user) async {
    if (_isBus && _seats.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select at least one seat.')));
      return;
    }
    if (_cnic.text.replaceAll(RegExp(r'\D'), '').length != 13) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter your 13-digit CNIC.')));
      return;
    }
    setState(() => _busy = true);
    try {
      final seats = _seats.keys.toList();
      final ticket = await sl<BookingRepository>().create(
        tripId: widget.trip.id,
        seats: _isBus ? seats : null,
        quantity: _isBus ? null : 1,
        passengers: _isBus
            ? seats.map((s) => Passenger(name: user.name, gender: _seats[s], seatLabel: s)).toList()
            : [Passenger(name: user.name)],
        contact: {'name': user.name, 'cnic': _cnic.text.replaceAll(RegExp(r'\D'), ''), 'phone': user.phone, if (user.email != null) 'email': user.email},
        paymentMethod: 'Easypaisa',
      );
      if (!mounted) return;
      context.read<BookingBloc>().add(const MyBookingsRequested());
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => TicketPage(ticket: ticket, justBooked: true)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BookieAppBar(title: 'Book your trip'),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, auth) {
          final user = auth.user;
          final loggedIn = auth.status == AuthStatus.authenticated && user != null;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _tripCard(widget.trip),
              const SizedBox(height: 16),
              if (!loggedIn)
                _guest()
              else if (_isBus)
                _seatFlow(user)
              else
                _simpleFlow(user),
            ],
          );
        },
      ),
    );
  }

  Widget _guest() => Column(children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(14)),
          child: const Text('Sign in to pick your seats and get your e-ticket.', style: TextStyle(color: AppColors.brand)),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginPage())),
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: const Text('Sign in to continue'),
        ),
      ]);

  Widget _seatFlow(AuthUser user) {
    return FutureBuilder<Trip>(
      future: _detail,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()));
        }
        final detail = snap.data ?? widget.trip;
        final booked = detail.bookedSeats.toSet();
        final capacity = (detail.seatsAvailable ?? 36) + booked.length;
        final total = widget.trip.price * _seats.length;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select your seats', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 12),
            SeatPicker(capacity: capacity, booked: booked, onChanged: (s) => setState(() => _seats = s)),
            const SizedBox(height: 20),
            _cnicField(),
            const SizedBox(height: 20),
            _payBar(total, () => _confirm(user)),
          ],
        );
      },
    );
  }

  Widget _simpleFlow(AuthUser user) {
    final total = widget.trip.price;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _cnicField(),
      const SizedBox(height: 20),
      _payBar(total, () => _confirm(user)),
    ]);
  }

  Widget _cnicField() => TextField(
        controller: _cnic,
        keyboardType: TextInputType.number,
        inputFormatters: [CnicInputFormatter()],
        decoration: const InputDecoration(labelText: 'Your CNIC (booker)', hintText: '42301-1211234-1', counterText: ''),
        maxLength: 15,
      );

  Widget _payBar(num total, VoidCallback onPay) => Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Total', style: TextStyle(color: AppColors.muted)),
          Text(pkr(total), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy ? null : onPay,
          style: FilledButton.styleFrom(backgroundColor: AppColors.accent, minimumSize: const Size.fromHeight(52)),
          child: _busy
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text('Confirm & pay ${pkr(total)}'),
        ),
        const SizedBox(height: 8),
        const Center(child: Text('Payment is simulated (demo).', style: TextStyle(fontSize: 12, color: AppColors.muted))),
      ]);

  Widget _tripCard(Trip t) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text(t.operator.name, style: const TextStyle(color: AppColors.muted)),
            if (hm(t.departAt) != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(hm(t.departAt)!)),
          ]),
        ),
      );
}
