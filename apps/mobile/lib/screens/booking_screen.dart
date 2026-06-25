import 'package:flutter/material.dart';

import '../format.dart';
import '../models.dart';
import '../theme.dart';

const _soldSeats = {'1A', '1B', '3C', '5D', '7A', '7B', '9C'};
const _paymentMethods = ['JazzCash', 'Easypaisa', 'Card', 'Cash'];

class BookingScreen extends StatefulWidget {
  final Trip trip;
  const BookingScreen({super.key, required this.trip});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final Set<String> selectedSeats = {};
  int pax = 1;
  String method = 'JazzCash';

  bool get isBus => widget.trip.serviceType == 'BUS';
  bool get isQuote => widget.trip.isQuote;
  int get qty => isBus ? selectedSeats.length : pax;
  num get total => widget.trip.price * qty;
  bool get canBook => isBus ? selectedSeats.isNotEmpty : pax > 0;

  void _confirm() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        icon: const Text('✅', style: TextStyle(fontSize: 36)),
        title: Text(isQuote ? 'Quote requested' : 'Booking confirmed (demo)'),
        content: Text(isQuote
            ? 'The operator will share a price shortly.'
            : '$qty × ${widget.trip.title}\nTotal: ${formatPKR(total)} via $method.\n\nThis is a front-end demo — real payment & ticketing arrive with the backend.'),
        actions: [
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.trip;
    return Scaffold(
      appBar: AppBar(title: Text(t.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _operatorHeader(t),
          const SizedBox(height: 16),
          if (isBus) _seatPicker() else _paxPicker(),
          if (!isQuote) ...[
            const SizedBox(height: 16),
            _paymentPicker(),
          ],
        ],
      ),
      bottomNavigationBar: _summaryBar(),
    );
  }

  Widget _operatorHeader(Trip t) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: hexColor(t.operator.logoColor),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(t.operator.name.substring(0, 2).toUpperCase(),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.title,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: ink)),
                  if (t.departAt != null)
                    Text(
                      '${formatTime(t.departAt)} → ${formatTime(t.arriveAt)} · ${formatDuration(t.durationMin)}',
                      style: const TextStyle(color: muted, fontSize: 12),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _seatPicker() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select seats',
                style: TextStyle(fontWeight: FontWeight.bold, color: ink)),
            const SizedBox(height: 12),
            Center(
              child: Column(
                children: List.generate(10, (r) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: ['A', 'B', '', 'C', 'D'].map((col) {
                        if (col.isEmpty) return const SizedBox(width: 28);
                        final seat = '${r + 1}$col';
                        return _seat(seat);
                      }).toList(),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _seat(String seat) {
    final sold = _soldSeats.contains(seat);
    final sel = selectedSeats.contains(seat);
    final color = sold
        ? const Color(0xFFE2E8F0)
        : sel
            ? brand
            : const Color(0xFFEEF2FF);
    final textColor = sold
        ? const Color(0xFF94A3B8)
        : sel
            ? Colors.white
            : brandDark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: GestureDetector(
        onTap: sold
            ? null
            : () => setState(() {
                  sel ? selectedSeats.remove(seat) : selectedSeats.add(seat);
                }),
        child: Container(
          width: 36,
          height: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(seat,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: textColor)),
        ),
      ),
    );
  }

  Widget _paxPicker() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(widget.trip.serviceType == 'CAR' ? 'Passengers' : 'Group size',
                style: const TextStyle(fontWeight: FontWeight.bold, color: ink)),
            Row(
              children: [
                IconButton.filledTonal(
                  onPressed: pax > 1 ? () => setState(() => pax--) : null,
                  icon: const Icon(Icons.remove),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('$pax',
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold)),
                ),
                IconButton.filledTonal(
                  onPressed: () => setState(() => pax++),
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _paymentPicker() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payment method',
                style: TextStyle(fontWeight: FontWeight.bold, color: ink)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: _paymentMethods.map((m) {
                final on = m == method;
                return ChoiceChip(
                  label: Text(m),
                  selected: on,
                  onSelected: (_) => setState(() => method = m),
                  selectedColor: brand,
                  labelStyle:
                      TextStyle(color: on ? Colors.white : ink),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isBus
                        ? (selectedSeats.isEmpty
                            ? 'No seats selected'
                            : 'Seats: ${(selectedSeats.toList()..sort()).join(', ')}')
                        : '$pax × ${widget.trip.title}',
                    style: const TextStyle(color: muted, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (!isQuote)
                    Text(formatPKR(total),
                        style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: ink)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            FilledButton(
              onPressed: canBook ? _confirm : null,
              style: FilledButton.styleFrom(backgroundColor: accent),
              child: Text(isQuote ? 'Request quote' : 'Pay with $method'),
            ),
          ],
        ),
      ),
    );
  }
}
