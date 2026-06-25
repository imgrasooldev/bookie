import 'package:flutter/material.dart';

import '../api.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/trip_card.dart';
import 'booking_screen.dart';

class ResultsScreen extends StatelessWidget {
  final Vertical vertical;
  final String originId;
  final String? destinationId;

  const ResultsScreen({
    super.key,
    required this.vertical,
    required this.originId,
    this.destinationId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${vertical.icon} ${vertical.label}'),
      ),
      body: FutureBuilder<List<Trip>>(
        future: Api.searchTrips(
          serviceType: vertical.type,
          originId: originId,
          destinationId: destinationId,
        ),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Error: ${snap.error}'));
          }
          final trips = snap.data ?? [];
          if (trips.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No options found. Try a different search.',
                    style: TextStyle(color: muted)),
              ),
            );
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('${trips.length} options',
                  style: const TextStyle(color: muted)),
              const SizedBox(height: 8),
              ...trips.map((t) => TripCard(
                    trip: t,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => BookingScreen(trip: t)),
                    ),
                  )),
            ],
          );
        },
      ),
    );
  }
}
