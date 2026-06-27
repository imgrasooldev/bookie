import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

/// Gender-aware 2+2 bus seat map (mirrors the web). Reports the selection as
/// seatLabel -> 'M' | 'F'.
class SeatPicker extends StatefulWidget {
  final int capacity;
  final Set<String> booked;
  final Set<String> business;
  final int maxSeats;
  final ValueChanged<Map<String, String>> onChanged;

  const SeatPicker({super.key, required this.capacity, required this.booked, this.business = const {}, this.maxSeats = 6, required this.onChanged});

  @override
  State<SeatPicker> createState() => _SeatPickerState();
}

class _SeatPickerState extends State<SeatPicker> {
  final Map<String, String> _selected = {}; // seat -> gender

  List<String> get _labels {
    const cols = ['A', 'B', 'C', 'D'];
    final out = <String>[];
    var r = 1;
    while (out.length < widget.capacity) {
      for (final c in cols) {
        if (out.length >= widget.capacity) break;
        out.add('$r$c');
      }
      r++;
    }
    return out;
  }

  void _tap(String seat) {
    if (widget.booked.contains(seat)) return;
    setState(() {
      if (_selected.containsKey(seat)) {
        _selected.remove(seat);
      } else if (_selected.length < widget.maxSeats) {
        _selected[seat] = 'M';
      }
    });
    widget.onChanged(Map.of(_selected));
  }

  void _setGender(String seat, String g) {
    setState(() => _selected[seat] = g);
    widget.onChanged(Map.of(_selected));
  }

  @override
  Widget build(BuildContext context) {
    final labels = _labels.toSet();
    final rows = labels.isEmpty ? 0 : labels.map((s) => int.parse(s.substring(0, s.length - 1))).reduce((a, b) => a > b ? a : b);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // legend
        Wrap(spacing: 14, runSpacing: 6, children: [
          const _Legend(color: Colors.white, border: true, label: 'Available'),
          if (widget.business.isNotEmpty) const _Legend(color: Color(0xFFFFFBEB), border: true, label: 'Business'),
          const _Legend(color: AppColors.brand, label: 'Male ♂'),
          const _Legend(color: Color(0xFFEC4899), label: 'Female ♀'),
          const _Legend(color: Color(0xFFE2E8F0), label: 'Booked'),
        ]),
        const SizedBox(height: 14),
        // bus body
        Center(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(24), border: Border.all(color: AppColors.hairline, width: 2)),
            child: Column(
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Front', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  Container(height: 30, width: 30, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.hairline, width: 2)), child: const Icon(Icons.drive_eta, size: 16, color: AppColors.muted)),
                ]),
                const Divider(height: 18),
                for (var r = 1; r <= rows; r++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _seat('${r}A', labels),
                        _seat('${r}B', labels),
                        const SizedBox(width: 22),
                        _seat('${r}C', labels),
                        _seat('${r}D', labels),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (_selected.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('${_selected.length} seat${_selected.length == 1 ? '' : 's'} selected', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _selected.keys.map((seat) => _GenderChip(seat: seat, gender: _selected[seat]!, onChange: (g) => _setGender(seat, g))).toList(),
          ),
          const SizedBox(height: 6),
          const Text('Tap ♂ / ♀ — buses seat male & female travellers separately.', style: TextStyle(fontSize: 12, color: AppColors.muted)),
        ],
      ],
    );
  }

  Widget _seat(String label, Set<String> valid) {
    if (!valid.contains(label)) return const SizedBox(width: 36, height: 36);
    final booked = widget.booked.contains(label);
    final biz = widget.business.contains(label);
    const amber = Color(0xFFF59E0B);
    final g = _selected[label];
    final sel = g != null;
    final bg = booked
        ? const Color(0xFFE2E8F0)
        : sel
            ? (g == 'F' ? const Color(0xFFEC4899) : (biz ? amber : AppColors.brand))
            : (biz ? const Color(0xFFFFFBEB) : Colors.white);
    final accent = biz ? amber : AppColors.brand;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: GestureDetector(
        onTap: () => _tap(label),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 36,
          width: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(10), bottom: Radius.circular(6)),
            border: Border.all(color: sel || booked ? Colors.transparent : accent.withValues(alpha: biz ? 0.6 : 0.3)),
          ),
          child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: booked ? AppColors.muted : (sel ? Colors.white : accent))),
        ),
      ),
    );
  }
}

class _GenderChip extends StatelessWidget {
  final String seat;
  final String gender;
  final ValueChanged<String> onChange;
  const _GenderChip({required this.seat, required this.gender, required this.onChange});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.hairline)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(seat, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(width: 8),
        _g('M', '♂', AppColors.brand),
        _g('F', '♀', const Color(0xFFEC4899)),
      ]),
    );
  }

  Widget _g(String val, String glyph, Color color) {
    final on = gender == val;
    return GestureDetector(
      onTap: () => onChange(val),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(color: on ? color : Colors.transparent, borderRadius: val == 'F' ? const BorderRadius.horizontal(right: Radius.circular(9)) : null),
        child: Text(glyph, style: TextStyle(color: on ? Colors.white : AppColors.muted, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  final bool border;
  const _Legend({required this.color, required this.label, this.border = false});

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(height: 14, width: 14, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4), border: border ? Border.all(color: AppColors.hairline) : null)),
      const SizedBox(width: 5),
      Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
    ]);
  }
}
