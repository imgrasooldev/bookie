import 'package:flutter/services.dart';

/// Masks input as a Pakistani CNIC: 42301-1211234-1 (5-7-1 digits).
class CnicInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 13) digits = digits.substring(0, 13);
    final b = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i == 5 || i == 12) b.write('-');
      b.write(digits[i]);
    }
    final text = b.toString();
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}

/// Masks a PK mobile number as 0300-1234567.
class PhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 11) digits = digits.substring(0, 11);
    final text = digits.length > 4 ? '${digits.substring(0, 4)}-${digits.substring(4)}' : digits;
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}

bool isValidEmail(String s) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s.trim());

bool isValidCnic(String s) => s.replaceAll(RegExp(r'\D'), '').length == 13;

bool isValidPkMobile(String s) => RegExp(r'^03\d{9}$').hasMatch(s.replaceAll(RegExp(r'\D'), ''));

String onlyDigits(String s) => s.replaceAll(RegExp(r'\D'), '');
