import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/api_models.dart';
import '../../../data/repositories/booking_repository.dart';

/* events */
abstract class BookingEvent extends Equatable {
  const BookingEvent();
  @override
  List<Object?> get props => [];
}

class MyBookingsRequested extends BookingEvent {
  const MyBookingsRequested();
}

class BookingCancelRequested extends BookingEvent {
  final String id;
  const BookingCancelRequested(this.id);
  @override
  List<Object?> get props => [id];
}

/* state */
enum BookingStatus { initial, loading, success, failure }

class BookingState extends Equatable {
  final BookingStatus status;
  final List<Ticket> tickets;
  final String? error;
  const BookingState({this.status = BookingStatus.initial, this.tickets = const [], this.error});

  BookingState copyWith({BookingStatus? status, List<Ticket>? tickets, String? error}) =>
      BookingState(status: status ?? this.status, tickets: tickets ?? this.tickets, error: error);

  @override
  List<Object?> get props => [status, tickets, error];
}

/* bloc */
class BookingBloc extends Bloc<BookingEvent, BookingState> {
  final BookingRepository _repo;

  BookingBloc(this._repo) : super(const BookingState()) {
    on<MyBookingsRequested>((event, emit) async {
      emit(state.copyWith(status: BookingStatus.loading, error: null));
      try {
        emit(state.copyWith(status: BookingStatus.success, tickets: await _repo.mine()));
      } catch (e) {
        emit(state.copyWith(status: BookingStatus.failure, error: apiError(e)));
      }
    });

    on<BookingCancelRequested>((event, emit) async {
      try {
        await _repo.cancel(event.id);
        emit(state.copyWith(status: BookingStatus.success, tickets: await _repo.mine()));
      } catch (e) {
        emit(state.copyWith(error: apiError(e)));
      }
    });
  }
}
