import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/util/money.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../core/widgets/shimmer.dart';
import '../../../models.dart';
import '../bloc/trip_bloc.dart';
import '../../bookings/view/booking_page.dart';

const _amenityIcon = {
  'wifi': Icons.wifi,
  'ac': Icons.ac_unit,
  'usb': Icons.usb,
  'meal': Icons.restaurant,
  'water': Icons.local_drink,
  'sleeper': Icons.airline_seat_flat,
};

/// Dedicated results screen. Runs the search on open and renders the list.
class ResultsPage extends StatefulWidget {
  final String serviceType;
  final String originId;
  final String destinationId;
  final String date;
  final String title;
  const ResultsPage({super.key, required this.serviceType, required this.originId, required this.destinationId, required this.date, required this.title});

  @override
  State<ResultsPage> createState() => _ResultsPageState();
}

class _ResultsPageState extends State<ResultsPage> {
  @override
  void initState() {
    super.initState();
    _search();
  }

  void _search() {
    context.read<TripBloc>().add(TripSearchRequested(serviceType: widget.serviceType, originId: widget.originId, destinationId: widget.destinationId, date: widget.date));
  }

  // Pull-to-refresh: re-run the search and resolve once the bloc settles.
  Future<void> _refresh() async {
    _search();
    await context.read<TripBloc>().stream.firstWhere((s) => s.status != TripStatus.loading);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: BookieAppBar(
        title: widget.title,
        subtitle: '${widget.serviceType[0]}${widget.serviceType.substring(1).toLowerCase()} tickets',
        actions: const [],
      ),
      body: BlocBuilder<TripBloc, TripState>(
        buildWhen: (a, b) => a.status != b.status || a.trips != b.trips,
        builder: (context, state) {
          if (state.status == TripStatus.loading) {
            return SkeletonList(count: 4, itemBuilder: (_, __) => const TripCardSkeleton());
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            color: AppColors.brand,
            child: _body(state),
          );
        },
      ),
    );
  }

  Widget _body(TripState state) {
    if (state.status == TripStatus.failure) {
      return _scrollableCenter(
        const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.muted),
        state.error ?? 'Search failed',
        hint: 'Pull down to retry',
      );
    }
    if (state.trips.isEmpty) {
      return _scrollableCenter(
        const Icon(Icons.search_off_rounded, size: 48, color: AppColors.muted),
        'No trips found for this route.',
        hint: 'Pull down to refresh',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: state.trips.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        if (i == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text('${state.trips.length} ${state.trips.length == 1 ? 'option' : 'options'} found', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink)),
          );
        }
        return _TripCard(trip: state.trips[i - 1], date: widget.date);
      },
    );
  }

  // A centered empty/error state that still scrolls, so RefreshIndicator works.
  Widget _scrollableCenter(Widget icon, String text, {String? hint}) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              icon,
              const SizedBox(height: 12),
              Text(text, style: const TextStyle(color: AppColors.muted)),
              if (hint != null) ...[
                const SizedBox(height: 6),
                Text(hint, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}

class _TripCard extends StatelessWidget {
  final Trip trip;
  final String date;
  const _TripCard({required this.trip, required this.date});

  Color get _opColor {
    final hex = trip.operator.logoColor.replaceAll('#', '');
    return Color(int.parse('FF$hex', radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => BookingPage(trip: trip, date: date))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  height: 38,
                  width: 38,
                  decoration: BoxDecoration(color: _opColor, borderRadius: BorderRadius.circular(10)),
                  alignment: Alignment.center,
                  child: Text(trip.operator.name.substring(0, 2).toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(trip.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.ink)),
                      Text('${trip.operator.name}${trip.vehicle != null ? ' · ${trip.vehicle}' : ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                Row(children: [
                  const Icon(Icons.star_rounded, size: 15, color: Colors.amber),
                  Text((trip.rating ?? trip.operator.rating).toStringAsFixed(1), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  if (trip.ratingCount > 0) Text(' (${trip.ratingCount})', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                ]),
              ]),
              if (hm(trip.departAt) != null) ...[
                const SizedBox(height: 10),
                Row(children: [const Icon(Icons.schedule, size: 14, color: AppColors.muted), const SizedBox(width: 4), Text(hm(trip.departAt)!, style: const TextStyle(fontSize: 13, color: AppColors.ink))]),
              ],
              if (trip.originTerminal != null || trip.destinationTerminal != null) ...[
                const SizedBox(height: 8),
                Row(children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: AppColors.brand),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      [
                        if (trip.originTerminal != null) 'Board: ${trip.originTerminal}',
                        if (trip.destinationTerminal != null) 'Drop: ${trip.destinationTerminal}',
                      ].join('  ·  '),
                      style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ]),
              ],
              if (trip.amenities.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  children: trip.amenities.take(4).map((a) => Chip(
                        visualDensity: VisualDensity.compact,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        backgroundColor: AppColors.bg,
                        side: const BorderSide(color: AppColors.hairline),
                        avatar: Icon(_amenityIcon[a] ?? Icons.check, size: 14, color: AppColors.brand),
                        label: Text(a, style: const TextStyle(fontSize: 11)),
                      )).toList(),
                ),
              ],
              const Divider(height: 22),
              Row(
                children: [
                  if (trip.seatsAvailable != null)
                    Text('${trip.seatsAvailable} seats left', style: TextStyle(fontSize: 12, color: trip.seatsAvailable! <= 9 ? AppColors.accent600 : AppColors.muted, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text(trip.isQuote ? 'On request' : pkr(trip.price), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.ink)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: AppColors.brand, borderRadius: BorderRadius.circular(10)),
                    child: const Text('Select', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
