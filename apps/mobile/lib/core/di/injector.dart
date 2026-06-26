import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/api_client.dart';
import '../storage/auth_store.dart';
import '../storage/onboarding_store.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/trip_repository.dart';
import '../../data/repositories/booking_repository.dart';

final sl = GetIt.instance;

/// Wire singletons once at startup (called from main before runApp).
Future<void> initDependencies() async {
  final prefs = await SharedPreferences.getInstance();
  sl.registerSingleton<AuthStore>(AuthStore(prefs));
  sl.registerSingleton<OnboardingStore>(OnboardingStore(prefs));
  sl.registerSingleton<ApiClient>(ApiClient(sl()));

  sl.registerLazySingleton<AuthRepository>(() => AuthRepository(sl(), sl()));
  sl.registerLazySingleton<TripRepository>(() => TripRepository(sl()));
  sl.registerLazySingleton<BookingRepository>(() => BookingRepository(sl()));
}
