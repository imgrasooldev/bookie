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
import 'seat_picker.dart';
import 'payment_page.dart';
import 'vehicle_gallery.dart';

class BookingPage extends StatefulWidget {
  final Trip trip;
  final String? date;
  const BookingPage({super.key, required this.trip, this.date});
  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  // booker contact — prefilled from the account when signed in, typed otherwise
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _cnic = TextEditingController();

  late Future<Trip> _detail = sl<TripRepository>().trip(widget.trip.id, date: widget.date);
  Map<String, String> _seats = {}; // seat -> gender
  bool _busy = false;

  // bus, car & HiAce all reserve specific seats on a seat map
  bool get _isSeat => const ['BUS', 'CAR', 'HIACE'].contains(widget.trip.serviceType);

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _cnic]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _confirm(AuthUser? user) async {
    final guest = user == null;
    final name = guest ? _name.text.trim() : user.name;
    final phone = guest ? onlyDigits(_phone.text) : user.phone;
    final email = guest
        ? (_email.text.trim().isEmpty ? null : _email.text.trim())
        : user.email;
    final cnic = onlyDigits(_cnic.text);

    String? err;
    if (_isSeat && _seats.isEmpty) {
      err = 'Please select at least one seat.';
    } else if (guest && name.length < 2) {
      err = 'Enter the booker\'s name.';
    } else if (guest && !isValidPkMobile(_phone.text)) {
      err = 'Enter a valid mobile number (03XX-XXXXXXX).';
    } else if (guest && _email.text.trim().isNotEmpty && !isValidEmail(_email.text)) {
      err = 'Enter a valid email, or leave it blank.';
    } else if (cnic.length != 13) {
      err = 'Enter your 13-digit CNIC.';
    }
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      return;
    }

    setState(() => _busy = true);
    try {
      final seats = _seats.keys.toList();
      final ticket = await sl<BookingRepository>().create(
        tripId: widget.trip.id,
        date: widget.date,
        seats: _isSeat ? seats : null,
        quantity: _isSeat ? null : 1,
        passengers: _isSeat
            ? seats.map((s) => Passenger(name: name, gender: _seats[s], seatLabel: s)).toList()
            : [Passenger(name: name)],
        contact: {'name': name, 'cnic': cnic, 'phone': phone, if (email != null) 'email': email},
        paymentMethod: 'Easypaisa',
      );
      if (!mounted) return;
      // booking is created as AWAITING_PAYMENT → take the user to pay
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => PaymentPage(ticket: ticket)));
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
          final user = auth.status == AuthStatus.authenticated ? auth.user : null;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _tripCard(widget.trip),
              FutureBuilder<Trip>(
                future: _detail,
                builder: (context, snap) {
                  final m = snap.data?.media ?? const <TripMedia>[];
                  return m.isEmpty
                      ? const SizedBox.shrink()
                      : Padding(padding: const EdgeInsets.only(top: 16), child: VehicleGallery(media: m));
                },
              ),
              const SizedBox(height: 16),
              if (_isSeat) _seatFlow(user) else _simpleFlow(user),
            ],
          );
        },
      ),
    );
  }

  Widget _seatFlow(AuthUser? user) {
    return FutureBuilder<Trip>(
      future: _detail,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()));
        }
        final detail = snap.data ?? widget.trip;
        final booked = detail.bookedSeats.toSet();
        final business = detail.businessSeats.toSet();
        final capacity = (detail.seatsAvailable ?? 36) + booked.length;
        final total = _seats.keys.fold<num>(0, (sum, s) => sum + widget.trip.price + (business.contains(s) ? detail.businessSurcharge : 0));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select your seats', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 12),
            SeatPicker(capacity: capacity, booked: booked, business: business, onChanged: (s) => setState(() => _seats = s)),
            const SizedBox(height: 20),
            _contactSection(user),
            const SizedBox(height: 20),
            _payBar(total, () => _confirm(user)),
          ],
        );
      },
    );
  }

  Widget _simpleFlow(AuthUser? user) {
    final total = widget.trip.price;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _contactSection(user),
      const SizedBox(height: 20),
      _payBar(total, () => _confirm(user)),
    ]);
  }

  // Booker details — a compact "booking as <you>" card when signed in, or the
  // full guest form (name, mobile, email, CNIC) when checking out as a guest.
  Widget _contactSection(AuthUser? user) {
    if (user != null) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            const Icon(Icons.person_rounded, color: AppColors.brand, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text('Booking as ${user.name} · ${user.phone}', style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600))),
          ]),
        ),
        const SizedBox(height: 12),
        _cnicField(),
      ]);
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Text('Your details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const Spacer(),
        TextButton(
          onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginPage())),
          child: const Text('Have an account? Sign in'),
        ),
      ]),
      const Text('Book as a guest — your e-ticket goes to this number & email.', style: TextStyle(color: AppColors.muted, fontSize: 13)),
      const SizedBox(height: 12),
      TextField(controller: _name, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Full name')),
      const SizedBox(height: 12),
      TextField(controller: _phone, keyboardType: TextInputType.phone, inputFormatters: [PhoneInputFormatter()], decoration: const InputDecoration(labelText: 'Mobile number', hintText: '0300-1234567')),
      const SizedBox(height: 12),
      TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email (optional)', hintText: 'you@example.com')),
      const SizedBox(height: 12),
      _cnicField(),
    ]);
  }

  Widget _cnicField() => TextField(
        controller: _cnic,
        keyboardType: TextInputType.number,
        inputFormatters: [CnicInputFormatter()],
        decoration: const InputDecoration(labelText: 'CNIC (booker)', hintText: '42301-1211234-1', counterText: ''),
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
