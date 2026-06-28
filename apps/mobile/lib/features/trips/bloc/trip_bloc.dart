import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../../../core/network/api_client.dart';
import '../../../models.dart';
import '../../../data/repositories/trip_repository.dart';

/* events */
abstract class TripEvent extends Equatable {
  const TripEvent();
  @override
  List<Object?> get props => [];
}

class TripCitiesLoaded extends TripEvent {
  const TripCitiesLoaded();
}

class TripSearchRequested extends TripEvent {
  final String serviceType;
  final String? originId;
  final String? destinationId;
  final String? date;
  const TripSearchRequested({
    this.serviceType = 'BUS',
    this.originId,
    this.destinationId,
    this.date,
  });
  @override
  List<Object?> get props => [serviceType, originId, destinationId, date];
}

/* state */
enum TripStatus { initial, loading, success, failure }

class TripState extends Equatable {
  final TripStatus status;
  final List<City> cities;
  final List<PopularRoute> popularRoutes;
  final bool popularLoaded; // true once the popular-routes fetch has settled
  final List<String> enabledVerticals; // admin-enabled service types (empty = show all)
  final List<Trip> trips;
  final String? error;
  const TripState({
    this.status = TripStatus.initial,
    this.cities = const [],
    this.popularRoutes = const [],
    this.popularLoaded = false,
    this.enabledVerticals = const [],
    this.trips = const [],
    this.error,
  });

  TripState copyWith({
    TripStatus? status,
    List<City>? cities,
    List<PopularRoute>? popularRoutes,
    bool? popularLoaded,
    List<String>? enabledVerticals,
    List<Trip>? trips,
    String? error,
  }) => TripState(
    status: status ?? this.status,
    cities: cities ?? this.cities,
    popularRoutes: popularRoutes ?? this.popularRoutes,
    popularLoaded: popularLoaded ?? this.popularLoaded,
    enabledVerticals: enabledVerticals ?? this.enabledVerticals,
    trips: trips ?? this.trips,
    error: error,
  );

  @override
  List<Object?> get props => [status, cities, popularRoutes, popularLoaded, enabledVerticals, trips, error];
}

/* bloc */
class TripBloc extends Bloc<TripEvent, TripState> {
  final TripRepository _repo;

  TripBloc(this._repo) : super(const TripState()) {
    on<TripCitiesLoaded>((event, emit) async {
      try {
        final cities = await _repo.cities();
        emit(state.copyWith(cities: cities));
      } catch (_) {
        /* non-fatal */
      }
      try {
        final enabled = await _repo.enabledVerticals();
        emit(state.copyWith(enabledVerticals: enabled));
      } catch (_) {
        /* non-fatal — empty means show all */
      }
      try {
        final routes = await _repo.popularRoutes();
        emit(state.copyWith(popularRoutes: routes, popularLoaded: true));
      } catch (_) {
        emit(state.copyWith(popularLoaded: true)); // stop the shimmer even on failure
      }
    });

    on<TripSearchRequested>((event, emit) async {
      emit(state.copyWith(status: TripStatus.loading, error: null));
      try {
        final trips = await _repo.search(
          serviceType: event.serviceType,
          originId: event.originId,
          destinationId: event.destinationId,
          date: event.date,
        );
        emit(state.copyWith(status: TripStatus.success, trips: trips));
      } catch (e) {
        emit(state.copyWith(status: TripStatus.failure, error: apiError(e)));
      }
    });
  }
}
