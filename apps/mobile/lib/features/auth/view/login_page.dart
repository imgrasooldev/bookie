import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/di/injector.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/util/formatters.dart';
import '../../../data/repositories/auth_repository.dart';
import '../bloc/auth_bloc.dart';

/// Sign-in / sign-up. Default path is password-free **OTP login** (the norm in
/// Pakistan): enter your mobile number, get an SMS code, you're in — the account
/// is created automatically on first use. A "password" path remains for anyone
/// who set one. Pops back to whatever opened it once authentication succeeds.
class LoginPage extends StatefulWidget {
  /// Optionally prefill the mobile number (used after a guest booking so the
  /// new account links to that booking).
  final String? prefillPhone;
  final bool startRegister;
  const LoginPage({super.key, this.prefillPhone, this.startRegister = false});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _useOtp = true;

  // password mode
  bool _register = false;
  final _name = TextEditingController();
  final _id = TextEditingController(text: '03001234567');
  final _phone = TextEditingController(text: '03');
  final _email = TextEditingController();
  final _pw = TextEditingController();
  String? _nameErr, _phoneErr, _emailErr, _pwErr;

  // otp mode
  final _otpPhone = TextEditingController(text: '03');
  final _otpName = TextEditingController();
  final _otpCode = TextEditingController();
  int _otpStep = 0; // 0 = enter number, 1 = enter code
  bool _otpSending = false;
  String? _otpDevCode;
  String? _otpPhoneErr, _otpCodeErr;

  @override
  void initState() {
    super.initState();
    if (widget.startRegister) {
      _useOtp = false;
      _register = true;
    }
    final p = widget.prefillPhone;
    if (p != null && p.isNotEmpty) {
      _phone.text = p;
      _id.text = p;
      _otpPhone.text = p;
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _id, _phone, _email, _pw, _otpPhone, _otpName, _otpCode]) {
      c.dispose();
    }
    super.dispose();
  }

  /* ----------------------------- OTP actions ----------------------------- */

  Future<void> _sendCode() async {
    setState(() => _otpPhoneErr = isValidPkMobile(_otpPhone.text) ? null : 'Enter a valid number (03XX-XXXXXXX).');
    if (_otpPhoneErr != null) return;
    setState(() => _otpSending = true);
    try {
      final dev = await sl<AuthRepository>().requestOtp(onlyDigits(_otpPhone.text));
      if (!mounted) return;
      setState(() {
        _otpStep = 1;
        _otpDevCode = dev;
        if (dev != null) _otpCode.text = dev; // demo convenience when SMS isn't wired
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Code sent to ${onlyDigits(_otpPhone.text)}')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(e))));
    } finally {
      if (mounted) setState(() => _otpSending = false);
    }
  }

  void _verifyCode() {
    setState(() => _otpCodeErr = _otpCode.text.trim().length < 4 ? 'Enter the code from the SMS.' : null);
    if (_otpCodeErr != null) return;
    context.read<AuthBloc>().add(AuthOtpVerifyRequested(
          phone: onlyDigits(_otpPhone.text),
          code: _otpCode.text.trim(),
          name: _otpName.text.trim().isEmpty ? null : _otpName.text.trim(),
        ));
  }

  /* --------------------------- password actions -------------------------- */

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
      bloc.add(AuthRegisterRequested(name: _name.text.trim(), phone: onlyDigits(_phone.text), email: _email.text.trim(), password: _pw.text));
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
              Text(
                _useOtp ? 'Sign in with your mobile number.' : (_register ? 'Create your account.' : 'Welcome back.'),
                style: const TextStyle(color: AppColors.muted, fontSize: 16),
              ),
              const SizedBox(height: 28),
              if (_useOtp) ..._otpFlow(busy) else ..._passwordFlow(busy),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _otpFlow(bool busy) {
    if (_otpStep == 0) {
      return [
        _field(_otpPhone, 'Mobile number', keyboard: TextInputType.phone, errorText: _otpPhoneErr, formatters: [PhoneInputFormatter()], hint: '0300-1234567'),
        const SizedBox(height: 4),
        FilledButton(
          onPressed: _otpSending ? null : _sendCode,
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: _otpSending
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Send code'),
        ),
        TextButton(onPressed: () => setState(() => _useOtp = false), child: const Text('Use a password instead')),
      ];
    }
    return [
      Text('Enter the 6-digit code sent to ${onlyDigits(_otpPhone.text)}.', style: const TextStyle(color: AppColors.muted)),
      if (_otpDevCode != null) ...[
        const SizedBox(height: 6),
        Text('Demo mode — code: $_otpDevCode', style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600, fontSize: 13)),
      ],
      const SizedBox(height: 14),
      _field(_otpCode, 'Verification code', keyboard: TextInputType.number, errorText: _otpCodeErr, formatters: [FilteringTextInputFormatter.digitsOnly], hint: '123456'),
      _field(_otpName, 'Your name (new accounts only)', capitalize: true, hint: 'optional'),
      const SizedBox(height: 4),
      FilledButton(
        onPressed: busy ? null : _verifyCode,
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
        child: busy
            ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Text('Verify & continue'),
      ),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        TextButton(onPressed: busy ? null : () => setState(() => _otpStep = 0), child: const Text('Change number')),
        TextButton(onPressed: _otpSending || busy ? null : _sendCode, child: const Text('Resend code')),
      ]),
    ];
  }

  List<Widget> _passwordFlow(bool busy) {
    return [
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
      TextButton(onPressed: () => setState(() => _useOtp = true), child: const Text('Sign in with an SMS code instead')),
    ];
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
