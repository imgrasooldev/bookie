import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/api_models.dart';
import '../../../data/repositories/auth_repository.dart';

/* ----------------------------- events ----------------------------- */
abstract class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class AuthStarted extends AuthEvent {
  const AuthStarted();
}

class AuthLoginRequested extends AuthEvent {
  final String identifier;
  final String password;
  const AuthLoginRequested(this.identifier, this.password);
  @override
  List<Object?> get props => [identifier, password];
}

class AuthRegisterRequested extends AuthEvent {
  final String name;
  final String phone;
  final String? email;
  final String password;
  const AuthRegisterRequested({required this.name, required this.phone, this.email, required this.password});
  @override
  List<Object?> get props => [name, phone, email, password];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

/* ----------------------------- state ------------------------------ */
enum AuthStatus { unknown, authenticated, unauthenticated, submitting }

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUser? user;
  final String? error;
  const AuthState({this.status = AuthStatus.unknown, this.user, this.error});

  AuthState copyWith({AuthStatus? status, AuthUser? user, String? error}) =>
      AuthState(status: status ?? this.status, user: user ?? this.user, error: error);

  @override
  List<Object?> get props => [status, user, error];
}

/* ------------------------------ bloc ------------------------------ */
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repo;

  AuthBloc(this._repo) : super(const AuthState()) {
    on<AuthStarted>((event, emit) {
      emit(AuthState(
        status: _repo.isLoggedIn ? AuthStatus.authenticated : AuthStatus.unauthenticated,
        user: _repo.currentUser,
      ));
    });

    on<AuthLoginRequested>((event, emit) async {
      emit(state.copyWith(status: AuthStatus.submitting, error: null));
      try {
        final user = await _repo.login(identifier: event.identifier, password: event.password);
        emit(AuthState(status: AuthStatus.authenticated, user: user));
      } catch (e) {
        emit(AuthState(status: AuthStatus.unauthenticated, error: apiError(e)));
      }
    });

    on<AuthRegisterRequested>((event, emit) async {
      emit(state.copyWith(status: AuthStatus.submitting, error: null));
      try {
        final user = await _repo.register(name: event.name, phone: event.phone, email: event.email, password: event.password);
        emit(AuthState(status: AuthStatus.authenticated, user: user));
      } catch (e) {
        emit(AuthState(status: AuthStatus.unauthenticated, error: apiError(e)));
      }
    });

    on<AuthLogoutRequested>((event, emit) async {
      await _repo.logout();
      emit(const AuthState(status: AuthStatus.unauthenticated));
    });
  }
}
