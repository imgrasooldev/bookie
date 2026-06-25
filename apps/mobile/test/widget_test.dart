import 'package:flutter_test/flutter_test.dart';

import 'package:bookie_mobile/main.dart';

void main() {
  testWidgets('App boots to home with brand title and verticals',
      (WidgetTester tester) async {
    await tester.pumpWidget(const BookieApp());
    await tester.pumpAndSettle();

    expect(find.text('Bookie'), findsWidgets);
    // The four verticals appear (in tabs and/or grid).
    expect(find.text('Bus'), findsWidgets);
    expect(find.text('City Ride'), findsWidgets);
  });
}
