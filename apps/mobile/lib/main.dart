import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/di/injector.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/trip_repository.dart';
import 'data/repositories/booking_repository.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/trips/bloc/trip_bloc.dart';
import 'features/bookings/bloc/booking_bloc.dart';
import 'features/splash/splash_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initDependencies();
  runApp(const BookieApp());
}

class BookieApp extends StatelessWidget {
  const BookieApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => AuthBloc(sl<AuthRepository>())..add(const AuthStarted())),
        BlocProvider(create: (_) => TripBloc(sl<TripRepository>())..add(const TripCitiesLoaded())),
        BlocProvider(create: (_) => BookingBloc(sl<BookingRepository>())),
      ],
      child: MaterialApp(
        title: 'Bookie',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        // No auth gate — guests land straight on the home shell after the splash.
        home: const SplashPage(),
      ),
    );
  }
}
