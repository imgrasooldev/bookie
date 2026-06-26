import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/util/formatters.dart';
import '../bloc/auth_bloc.dart';

/// Combined sign-in / sign-up screen with inline validation. Pops back to
/// whatever opened it once authentication succeeds.
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _register = false;
  final _name = TextEditingController();
  final _id = TextEditingController(text: '03001234567');
  final _phone = TextEditingController(text: '03');
  final _email = TextEditingController();
  final _pw = TextEditingController();

  String? _nameErr, _phoneErr, _emailErr, _pwErr;

  @override
  void dispose() {
    for (final c in [_name, _id, _phone, _email, _pw]) {
      c.dispose();
    }
    super.dispose();
  }

  void _submit() {
    setState(() {
      _nameErr = _register && _name.text.trim().length < 2 ? 'Enter your name.' : null;
      _phoneErr = _register && !isValidPkMobile(_phone.text) ? 'Enter a valid number (03XX-XXXXXXX).' : null;
      _emailErr = _register && _email.text.trim().isNotEmpty && !isValidEmail(_email.text) ? 'Enter a valid email (must contain @).' : null;
      _pwErr = _register && _pw.text.length < 6 ? 'At least 6 characters.' : null;
    });
    if ([_nameErr, _phoneErr, _emailErr, _pwErr].any((e) => e != null)) return;

    final bloc = context.read<AuthBloc>();
    if (_register) {
      bloc.add(AuthRegisterRequested(
        name: _name.text.trim(),
        phone: onlyDigits(_phone.text),
        email: _email.text.trim(),
        password: _pw.text,
      ));
    } else {
      bloc.add(AuthLoginRequested(_id.text.trim(), _pw.text));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: BlocConsumer<AuthBloc, AuthState>(
        listenWhen: (a, b) => b.status != a.status || (b.error != null && b.error != a.error),
        listener: (context, state) {
          if (state.status == AuthStatus.authenticated) {
            if (Navigator.of(context).canPop()) Navigator.of(context).pop();
          } else if (state.error != null) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!)));
          }
        },
        builder: (context, state) {
          final busy = state.status == AuthStatus.submitting;
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const BookieWordmark(size: 34),
              const SizedBox(height: 6),
              Text(_register ? 'Create your account.' : 'Welcome back.', style: const TextStyle(color: AppColors.muted, fontSize: 16)),
              const SizedBox(height: 28),
              if (_register) ...[
                _field(_name, 'Full name', errorText: _nameErr, capitalize: true),
                _field(_phone, 'Mobile number', keyboard: TextInputType.phone, errorText: _phoneErr, formatters: [PhoneInputFormatter()], hint: '0300-1234567'),
                _field(_email, 'Email (optional)', keyboard: TextInputType.emailAddress, errorText: _emailErr, hint: 'you@example.com'),
              ] else
                _field(_id, 'Mobile number or email', keyboard: TextInputType.text),
              _field(_pw, 'Password', obscure: true, errorText: _pwErr),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: busy ? null : _submit,
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                child: busy
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_register ? 'Create account' : 'Sign in'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => setState(() {
                  _register = !_register;
                  _nameErr = _phoneErr = _emailErr = _pwErr = null;
                }),
                child: Text(_register ? 'Already have an account? Sign in' : "Don't have an account? Sign up"),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    bool obscure = false,
    bool capitalize = false,
    TextInputType? keyboard,
    String? errorText,
    String? hint,
    List<TextInputFormatter>? formatters,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: TextField(
          controller: c,
          obscureText: obscure,
          keyboardType: keyboard,
          textCapitalization: capitalize ? TextCapitalization.words : TextCapitalization.none,
          inputFormatters: formatters,
          decoration: InputDecoration(labelText: label, hintText: hint, errorText: errorText),
        ),
      );
}
