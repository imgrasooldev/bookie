import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/bookie_app_bar.dart';
import '../../../models.dart';
import '../bloc/trip_bloc.dart';
import 'results_page.dart';

const _categories = [
  ('Bus', 'BUS', Icons.directions_bus_rounded),
  ('Flights', 'FLIGHT', Icons.flight_takeoff_rounded),
  ('Train', 'TRAIN', Icons.train_rounded),
  ('Hotels', 'HOTEL', Icons.hotel_rounded),
  ('City Ride', 'CAR', Icons.local_taxi_rounded),
];

const _popular = [('lhe', 'isb', 'Lahore → Islamabad'), ('khi', 'lhe', 'Karachi → Lahore'), ('isb', 'pesh', 'Islamabad → Peshawar')];

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});
  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  String _service = 'BUS';
  String _origin = 'lhe';
  String _dest = 'isb';

  void _openResults(BuildContext context, List<City> cities) {
    FocusScope.of(context).unfocus();
    String name(String id) => cities.firstWhere((c) => c.id == id, orElse: () => City(id: id, name: id.toUpperCase())).name;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ResultsPage(serviceType: _service, originId: _origin, destinationId: _dest, title: '${name(_origin)} → ${name(_dest)}'),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BookieAppBar(showLogo: true),
      body: BlocBuilder<TripBloc, TripState>(
        buildWhen: (a, b) => a.cities != b.cities,
        builder: (context, state) {
          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _header(context, state.cities)),
              SliverToBoxAdapter(child: _popularRoutes(context, state.cities)),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          );
        },
      ),
    );
  }

  Widget _header(BuildContext context, List<City> cities) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              const Text("Where to,\nfriend?", style: TextStyle(color: Colors.white, fontSize: 30, height: 1.1, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text('Buses, flights, trains & stays across Pakistan.', style: TextStyle(color: Colors.white.withValues(alpha: 0.85))),
              const SizedBox(height: 18),
              SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final c = _categories[i];
                    final on = _service == c.$2;
                    return GestureDetector(
                      onTap: () => setState(() => _service = c.$2),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: on ? Colors.white : Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(children: [
                          Icon(c.$3, size: 16, color: on ? AppColors.brand : Colors.white),
                          const SizedBox(width: 6),
                          Text(c.$1, style: TextStyle(color: on ? AppColors.brand : Colors.white, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              _searchCard(cities),
            ],
          ),
        ),
      ),
    );
  }

  Widget _searchCard(List<City> cities) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 24, offset: const Offset(0, 12))],
      ),
      child: Column(
        children: [
          Stack(
            children: [
              Column(
                children: [
                  _cityRow(context, cities, 'From', _origin, Icons.radio_button_checked, AppColors.brand, (v) => setState(() => _origin = v)),
                  const Divider(height: 1),
                  _cityRow(context, cities, 'To', _dest, Icons.location_on, AppColors.accent, (v) => setState(() => _dest = v)),
                ],
              ),
              Positioned(
                right: 0,
                top: 0,
                bottom: 0,
                child: Center(
                  child: Material(
                    color: AppColors.brand50,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () => setState(() { final t = _origin; _origin = _dest; _dest = t; }),
                      child: const Padding(padding: EdgeInsets.all(9), child: Icon(Icons.swap_vert_rounded, color: AppColors.brand, size: 20)),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => _openResults(context, cities),
              icon: const Icon(Icons.search_rounded),
              label: const Text('Search'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.accent, minimumSize: const Size.fromHeight(50)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _popularRoutes(BuildContext context, List<City> cities) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Popular routes', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.ink)),
          const SizedBox(height: 12),
          ..._popular.map((r) => Card(
                child: ListTile(
                  leading: const CircleAvatar(backgroundColor: AppColors.brand50, child: Icon(Icons.directions_bus_rounded, color: AppColors.brand)),
                  title: Text(r.$3, style: const TextStyle(fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.arrow_forward_rounded, size: 18, color: AppColors.muted),
                  onTap: () {
                    setState(() { _service = 'BUS'; _origin = r.$1; _dest = r.$2; });
                    _openResults(context, cities);
                  },
                ),
              )),
        ],
      ),
    );
  }
}

/// A tappable From/To row that opens a searchable city picker (no dropdown
/// overlap inside the compact card).
Widget _cityRow(BuildContext context, List<City> cities, String label, String value, IconData icon, Color color, ValueChanged<String> onChanged) {
  final name = cities.firstWhere((c) => c.id == value, orElse: () => City(id: value, name: value.toUpperCase())).name;
  return InkWell(
    borderRadius: BorderRadius.circular(12),
    onTap: () => _pickCity(context, cities, label, value, onChanged),
    child: Padding(
      padding: const EdgeInsets.only(right: 48, top: 8, bottom: 8),
      child: Row(children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.muted, fontWeight: FontWeight.w600)),
              const SizedBox(height: 1),
              Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, color: AppColors.ink, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ]),
    ),
  );
}

Future<void> _pickCity(BuildContext context, List<City> cities, String label, String current, ValueChanged<String> onChanged) async {
  final picked = await showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (_) => _CityPickerSheet(cities: cities, current: current, title: label == 'From' ? 'Departure city' : 'Destination city'),
  );
  if (picked != null) onChanged(picked);
}

class _CityPickerSheet extends StatefulWidget {
  final List<City> cities;
  final String current;
  final String title;
  const _CityPickerSheet({required this.cities, required this.current, required this.title});
  @override
  State<_CityPickerSheet> createState() => _CityPickerSheetState();
}

class _CityPickerSheetState extends State<_CityPickerSheet> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.cities.where((c) => c.name.toLowerCase().contains(_q.toLowerCase())).toList();
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.72,
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(height: 4, width: 42, decoration: BoxDecoration(color: AppColors.hairline, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
                  const SizedBox(height: 12),
                  TextField(
                    autofocus: true,
                    onChanged: (v) => setState(() => _q = v),
                    decoration: const InputDecoration(hintText: 'Search city…', prefixIcon: Icon(Icons.search_rounded), filled: true, fillColor: AppColors.bg),
                  ),
                ],
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? const Center(child: Text('No city found', style: TextStyle(color: AppColors.muted)))
                  : ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (_, i) {
                        final c = filtered[i];
                        final sel = c.id == widget.current;
                        return ListTile(
                          leading: Icon(Icons.location_city_rounded, color: sel ? AppColors.brand : AppColors.muted),
                          title: Text(c.name, style: TextStyle(fontWeight: sel ? FontWeight.w700 : FontWeight.w500, color: sel ? AppColors.brand : AppColors.ink)),
                          trailing: sel ? const Icon(Icons.check_rounded, color: AppColors.brand) : null,
                          onTap: () => Navigator.of(context).pop(c.id),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

