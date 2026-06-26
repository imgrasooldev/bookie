import 'package:intl/intl.dart';

final _fmt = NumberFormat('#,##0', 'en');

String pkr(num n) => 'Rs ${_fmt.format(n)}';

String? hm(String? iso) {
  if (iso == null) return null;
  final d = DateTime.tryParse(iso)?.toLocal();
  return d == null ? null : DateFormat('EEE d MMM · h:mm a').format(d);
}
