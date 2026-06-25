import 'package:flutter/material.dart';

import '../format.dart';
import '../mock_data.dart';
import '../models.dart';
import '../theme.dart';

class TripCard extends StatelessWidget {
  final Trip trip;
  final VoidCallback onTap;
  const TripCard({super.key, required this.trip, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheduled = trip.departAt != null;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: hexColor(trip.operator.logoColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      trip.operator.name.substring(0, 2).toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(trip.title,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, color: ink)),
                        Text(
                          '${trip.operator.name} · ⭐ ${trip.operator.rating}'
                          '${trip.vehicle != null ? ' · ${trip.vehicle}' : ''}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (scheduled) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(formatTime(trip.departAt),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, color: ink)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6),
                      child: Text('→', style: TextStyle(color: muted)),
                    ),
                    Text(formatTime(trip.arriveAt),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, color: ink)),
                    const SizedBox(width: 8),
                    Text('(${formatDuration(trip.durationMin)})',
                        style: const TextStyle(color: muted, fontSize: 12)),
                  ],
                ),
              ],
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: trip.amenities
                    .take(4)
                    .map((a) => Chip(
                          label: Text(amenityLabels[a] ?? a,
                              style: const TextStyle(fontSize: 11)),
                          visualDensity: VisualDensity.compact,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                          backgroundColor: const Color(0xFFF1F5F9),
                          side: BorderSide.none,
                        ))
                    .toList(),
              ),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  trip.isQuote
                      ? const Text('On request',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, color: brandDark))
                      : RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: formatPKR(trip.price),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 18,
                                    color: ink),
                              ),
                              TextSpan(
                                text: trip.priceUnit == 'per_seat'
                                    ? ' / seat'
                                    : trip.priceUnit == 'from'
                                        ? ' onwards'
                                        : '',
                                style: const TextStyle(
                                    fontSize: 12, color: muted),
                              ),
                            ],
                          ),
                        ),
                  FilledButton(
                    onPressed: onTap,
                    child: Text(trip.isQuote ? 'Request quote' : 'Select'),
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
