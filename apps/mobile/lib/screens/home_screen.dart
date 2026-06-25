import 'package:flutter/material.dart';

import '../mock_data.dart';
import '../models.dart';
import '../theme.dart';
import 'results_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Vertical selected = verticals.first;
  String originId = 'lhe';
  String destinationId = 'isb';

  bool get needsRoute => selected.flavor == 'SCHEDULED_SEAT';

  void _search() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ResultsScreen(
        vertical: selected,
        originId: originId,
        destinationId: needsRoute ? destinationId : null,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: brand,
            foregroundColor: Colors.white,
            expandedHeight: 150,
            title: const Text('Bookie',
                style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
            flexibleSpace: const FlexibleSpaceBar(
              background: _Hero(),
            ),
          ),
          SliverToBoxAdapter(child: _searchCard()),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Text('What do you want to book?',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold)),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            sliver: SliverGrid.count(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: verticals
                  .map((v) => _verticalCard(v))
                  .toList(growable: false),
            ),
          ),
        ],
      ),
    );
  }

  Widget _searchCard() {
    return Container(
      transform: Matrix4.translationValues(0, -24, 0),
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 20,
              offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        children: [
          // vertical tabs
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: verticals.map((v) {
                final on = v.type == selected.type;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => selected = v),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: on ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(9),
                        boxShadow: on
                            ? [
                                BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 6)
                              ]
                            : null,
                      ),
                      child: Column(
                        children: [
                          Text(v.icon, style: const TextStyle(fontSize: 18)),
                          Text(v.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: on ? brandDark : muted)),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          _cityField(
              label: needsRoute ? 'From' : 'City',
              value: originId,
              onChanged: (v) => setState(() => originId = v)),
          if (needsRoute) ...[
            const SizedBox(height: 10),
            _cityField(
                label: 'To',
                value: destinationId,
                onChanged: (v) => setState(() => destinationId = v)),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _search,
              style: FilledButton.styleFrom(backgroundColor: accent),
              child: Text('Search ${selected.label}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _cityField({
    required String label,
    required String value,
    required ValueChanged<String> onChanged,
  }) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          items: cities
              .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
              .toList(),
          onChanged: (v) => v != null ? onChanged(v) : null,
        ),
      ),
    );
  }

  Widget _verticalCard(Vertical v) {
    return InkWell(
      onTap: () => setState(() => selected = v),
      borderRadius: BorderRadius.circular(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(v.icon, style: const TextStyle(fontSize: 26)),
              const SizedBox(height: 8),
              Text(v.label,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: ink)),
              const SizedBox(height: 2),
              Text(v.tagline,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: muted)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [brand, brandDark],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 70, 16, 30),
      alignment: Alignment.centerLeft,
      child: const Text(
        'Bus, car, picnic & corporate\ntransport across Pakistan',
        style: TextStyle(
            color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }
}
