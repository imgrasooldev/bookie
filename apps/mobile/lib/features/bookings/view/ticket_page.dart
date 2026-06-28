import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:open_filex/open_filex.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/di/injector.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/money.dart';
import '../../../core/util/ticket_pdf.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../data/models/api_models.dart';
import '../../../data/repositories/booking_repository.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/view/login_page.dart';
import '../bloc/booking_bloc.dart';

class TicketPage extends StatefulWidget {
  final Ticket ticket;
  final bool justBooked;
  const TicketPage({super.key, required this.ticket, this.justBooked = false});
  @override
  State<TicketPage> createState() => _TicketPageState();
}

class _TicketPageState extends State<TicketPage> {
  late Ticket _t = widget.ticket;
  bool _busy = false;

  bool _downloading = false;
  bool _sharing = false;

  Future<void> _download() async {
    setState(() => _downloading = true);
    try {
      final path = await saveTicket(_t);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: AppColors.ink,
        content: const Row(children: [
          Icon(Icons.check_circle, color: Colors.greenAccent, size: 20),
          SizedBox(width: 8),
          Expanded(child: Text('E-ticket downloaded')),
        ]),
        action: SnackBarAction(label: 'OPEN', textColor: Colors.amberAccent, onPressed: () => OpenFilex.open(path)),
      ));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save the e-ticket. Please try again.')));
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _share() async {
    setState(() => _sharing = true);
    try {
      await shareTicket(_t);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not share the e-ticket.')));
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  Future<void> _cancel() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel this booking?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_t.title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(12)),
              child: Text(
                _t.seats.isNotEmpty
                    ? '♻️ Seat ${_t.seats.join(', ')} will be released${_t.total > 0 ? ', and ${pkr(_t.total)} refunded to your wallet' : ''}.'
                    : '${pkr(_t.total)} will be refunded to your wallet.',
                style: const TextStyle(fontSize: 13, color: Color(0xFF92400E)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Keep booking')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Yes, cancel'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _busy = true);
    try {
      final updated = await sl<BookingRepository>().cancel(_t.id);
      if (!mounted) return;
      setState(() => _t = updated);
      context.read<BookingBloc>().add(const MyBookingsRequested());
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: const Color(0xFF0A1222),
        content: Row(children: [
          const Icon(Icons.check_circle, color: Colors.greenAccent, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(updated.total > 0 ? 'Cancelled · ${pkr(updated.total)} refunded to wallet' : 'Booking cancelled — seats released')),
        ]),
      ));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not cancel. Please try again.')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = _t;
    return Scaffold(
      appBar: const BookieAppBar(title: 'E-ticket'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.justBooked)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
              child: const Row(children: [Icon(Icons.check_circle, color: Colors.green), SizedBox(width: 8), Text('Booking confirmed')]),
            ),
          // guest booked → nudge to create an account so the trip lands in My Trips
          BlocBuilder<AuthBloc, AuthState>(
            builder: (context, auth) {
              if (auth.status == AuthStatus.authenticated) return const SizedBox.shrink();
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(14)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: const [
                    Icon(Icons.bookmark_added_rounded, color: AppColors.brand),
                    SizedBox(width: 8),
                    Expanded(child: Text('Save this booking', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.ink))),
                  ]),
                  const SizedBox(height: 4),
                  const Text('Create an account with this number to track your trips and get delay updates.', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                      child: FilledButton(
                        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LoginPage(prefillPhone: t.contactPhone, startRegister: true))),
                        child: const Text('Create account'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LoginPage(prefillPhone: t.contactPhone))),
                      child: const Text('Sign in'),
                    ),
                  ]),
                ]),
              );
            },
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(t.serviceType, style: const TextStyle(color: Colors.black45, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text(t.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                  Text(t.operator, style: const TextStyle(color: Colors.black54)),
                  const SizedBox(height: 16),
                  if (t.pickup != null) ...[
                    _row('Pickup', t.pickup!),
                    if (t.dropoff != null) _row('Drop-off', t.dropoff!),
                    _row('When', _fmtSchedule(t.scheduledAt)),
                  ] else ...[
                    _row('Date', hm(t.departAt) ?? '—'),
                    if (t.originTerminal != null) _row('Boarding', t.originTerminal!),
                    if (t.destinationTerminal != null) _row('Drop-off', t.destinationTerminal!),
                    _row('Seats', t.seats.isEmpty ? '—' : t.seats.join(', ')),
                  ],
                  _row('Amount', pkr(t.total)),
                  _row('Status', t.status),
                  const SizedBox(height: 20),
                  Opacity(
                    opacity: t.isCancelled ? 0.25 : 1,
                    child: QrImageView(data: t.ref, size: 160, padding: EdgeInsets.zero),
                  ),
                  const SizedBox(height: 8),
                  Text(t.ref, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, letterSpacing: 1)),
                  Text(t.isCancelled ? 'This booking was cancelled' : 'Show this code at boarding', style: const TextStyle(fontSize: 12, color: Colors.black45)),
                ],
              ),
            ),
          ),
          if (t.passengers.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              child: Column(
                children: t.passengers
                    .map((p) => ListTile(
                          dense: true,
                          leading: const Icon(Icons.person_outline),
                          title: Text(p.name),
                          trailing: Text([if (p.gender != null) p.gender == 'F' ? '♀' : '♂', if (p.seatLabel != null) 'Seat ${p.seatLabel}'].join('  ')),
                        ))
                    .toList(),
              ),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _downloading ? null : _download,
            icon: _downloading
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.download_rounded),
            label: Text(_downloading ? 'Saving…' : 'Download e-ticket'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _sharing ? null : _share,
            icon: _sharing
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.share_rounded),
            label: Text(_sharing ? 'Preparing…' : 'Share ticket'),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
          if (!t.isCancelled) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _busy ? null : _cancel,
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48), foregroundColor: Colors.red),
              child: _busy ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Cancel booking'),
            ),
          ],
          if (!t.isCancelled) ...[
            const SizedBox(height: 16),
            _ReviewCard(bookingId: t.id),
          ],
        ],
      ),
    );
  }

  String _fmtSchedule(String? iso) {
    final d = iso == null ? null : DateTime.tryParse(iso);
    if (d == null) return '—';
    final hh = d.hour.toString().padLeft(2, '0');
    final mm = d.minute.toString().padLeft(2, '0');
    return '${d.day}/${d.month}/${d.year}  ·  $hh:$mm';
  }

  Widget _row(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(k, style: const TextStyle(color: Colors.black54)), Text(v, style: const TextStyle(fontWeight: FontWeight.w600))]),
      );
}

// "Rate your trip" card: loads the user's existing review (if any) and lets
// them add or edit their single review for this booking.
class _ReviewCard extends StatefulWidget {
  final String bookingId;
  const _ReviewCard({required this.bookingId});
  @override
  State<_ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends State<_ReviewCard> {
  Review? _review;
  bool _loading = true;
  bool _editing = false;
  bool _busy = false;
  int _rating = 0;
  final _comment = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await sl<BookingRepository>().myReview(widget.bookingId);
      if (!mounted) return;
      setState(() {
        _review = r;
        if (r != null) { _rating = r.rating; _comment.text = r.comment; }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_rating < 1) return;
    setState(() => _busy = true);
    try {
      final r = await sl<BookingRepository>().submitReview(widget.bookingId, _rating, _comment.text.trim());
      if (!mounted) return;
      setState(() { _review = r; _editing = false; _busy = false; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thanks for your review!')));
    } catch (_) {
      if (mounted) setState(() => _busy = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save your review. Please try again.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const SizedBox.shrink();
    final shown = _review != null && !_editing;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(shown ? 'Your review' : (_review != null ? 'Edit your review' : 'Rate your trip'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              if (shown)
                TextButton(onPressed: () => setState(() => _editing = true), child: const Text('Edit')),
            ]),
            const SizedBox(height: 4),
            Row(
              children: List.generate(5, (i) {
                final n = i + 1;
                final active = (shown ? _review!.rating : _rating) >= n;
                return IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 38, minHeight: 38),
                  onPressed: shown ? null : () => setState(() => _rating = n),
                  icon: Icon(active ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: active ? Colors.amber : Colors.black26, size: 30),
                );
              }),
            ),
            if (shown) ...[
              if (_review!.comment.isNotEmpty)
                Padding(padding: const EdgeInsets.only(top: 6), child: Text('“${_review!.comment}”', style: const TextStyle(color: AppColors.muted))),
            ] else ...[
              const SizedBox(height: 8),
              TextField(
                controller: _comment,
                maxLines: 3,
                maxLength: 1000,
                decoration: InputDecoration(
                  hintText: 'How was the trip? (optional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 8),
              Row(children: [
                if (_review != null)
                  TextButton(
                    onPressed: () => setState(() { _editing = false; _rating = _review!.rating; _comment.text = _review!.comment; }),
                    child: const Text('Cancel'),
                  ),
                const Spacer(),
                FilledButton(
                  onPressed: (_busy || _rating < 1) ? null : _submit,
                  child: _busy
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_review != null ? 'Update review' : 'Submit review'),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }
}
