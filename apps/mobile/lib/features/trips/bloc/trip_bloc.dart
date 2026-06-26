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
  const TripSearchRequested({
    this.serviceType = 'BUS',
    this.originId,
    this.destinationId,
  });
  @override
  List<Object?> get props => [serviceType, originId, destinationId];
}

/* state */
enum TripStatus { initial, loading, success, failure }

class TripState extends Equatable {
  final TripStatus status;
  final List<City> cities;
  final List<Trip> trips;
  final String? error;
  const TripState({
    this.status = TripStatus.initial,
    this.cities = const [],
    this.trips = const [],
    this.error,
  });

  TripState copyWith({
    TripStatus? status,
    List<City>? cities,
    List<Trip>? trips,
    String? error,
  }) => TripState(
    status: status ?? this.status,
    cities: cities ?? this.cities,
    trips: trips ?? this.trips,
    error: error,
  );

  @override
  List<Object?> get props => [status, cities, trips, error];
}

/* bloc */
class TripBloc extends Bloc<TripEvent, TripState> {
  final TripRepository _repo;

  TripBloc(this._repo) : super(const TripState()) {
    on<TripCitiesLoaded>((event, emit) async {
      try {
        emit(state.copyWith(cities: await _repo.cities()));
      } catch (_) {
        /* non-fatal */
      }
    });

    on<TripSearchRequested>((event, emit) async {
      emit(state.copyWith(status: TripStatus.loading, error: null));
      try {
        final trips = await _repo.search(
          serviceType: event.serviceType,
          originId: event.originId,
          destinationId: event.destinationId,
        );
        emit(state.copyWith(status: TripStatus.success, trips: trips));
      } catch (e) {
        emit(state.copyWith(status: TripStatus.failure, error: apiError(e)));
      }
    });
  }
}
