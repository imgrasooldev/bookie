import 'package:intl/intl.dart';

final _pkr = NumberFormat.currency(locale: 'en_PK', symbol: 'Rs ', decimalDigits: 0);

String formatPKR(num amount) => _pkr.format(amount);

String formatTime(String? iso) {
  if (iso == null) return '—';
  final dt = DateTime.parse(iso).toLocal();
  return DateFormat('h:mm a').format(dt);
}

String formatDuration(int? minutes) {
  if (minutes == null) return '—';
  final h = minutes ~/ 60;
  final m = minutes % 60;
  return [if (h > 0) '${h}h', if (m > 0) '${m}m'].join(' ');
}
