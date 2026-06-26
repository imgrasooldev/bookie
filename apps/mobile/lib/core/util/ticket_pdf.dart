import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../data/models/api_models.dart';
import 'money.dart';

/// Builds a printable e-ticket PDF (with a scannable QR of the booking ref).
Future<Uint8List> buildTicketPdf(Ticket t) async {
  final doc = pw.Document();
  final hex = t.operatorColor.replaceAll('#', '');
  final brand = PdfColor.fromInt(int.parse('FF$hex', radix: 16));

  pw.Widget kv(String k, String v) => pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 3),
        child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
          pw.Text(k, style: const pw.TextStyle(color: PdfColors.grey700, fontSize: 11)),
          pw.Text(v, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
        ]),
      );

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a5,
      build: (ctx) => pw.Center(
        child: pw.Container(
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.grey300),
            borderRadius: pw.BorderRadius.circular(12),
          ),
          child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.stretch, mainAxisSize: pw.MainAxisSize.min, children: [
            // header
            pw.Container(
              color: brand,
              padding: const pw.EdgeInsets.all(14),
              child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                pw.Text('Bookie e-ticket', style: pw.TextStyle(color: PdfColors.white, fontSize: 16, fontWeight: pw.FontWeight.bold)),
                pw.Text(t.status, style: const pw.TextStyle(color: PdfColors.white, fontSize: 11)),
              ]),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(18),
              child: pw.Column(children: [
                pw.Text(t.serviceType, style: const pw.TextStyle(color: PdfColors.grey600, fontSize: 10)),
                pw.SizedBox(height: 2),
                pw.Text(t.title, style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.center),
                pw.Text(t.operator, style: const pw.TextStyle(color: PdfColors.grey700, fontSize: 11)),
                pw.SizedBox(height: 16),
                kv('Date', hm(t.departAt) ?? '—'),
                kv('Seats', t.seats.isEmpty ? '—' : t.seats.join(', ')),
                kv('Passengers', '${t.passengers.isEmpty ? 1 : t.passengers.length}'),
                kv('Amount', pkr(t.total)),
                if (t.passengers.isNotEmpty) ...[
                  pw.Divider(color: PdfColors.grey300),
                  ...t.passengers.map((p) => pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(vertical: 2),
                        child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                          pw.Text(p.name, style: const pw.TextStyle(fontSize: 11)),
                          pw.Text([if (p.gender != null) p.gender == 'F' ? 'Female' : 'Male', if (p.seatLabel != null) 'Seat ${p.seatLabel}'].join(' · '),
                              style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                        ]),
                      )),
                ],
                pw.SizedBox(height: 18),
                pw.BarcodeWidget(barcode: pw.Barcode.qrCode(), data: t.ref, width: 120, height: 120, drawText: false),
                pw.SizedBox(height: 8),
                pw.Text(t.ref, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, letterSpacing: 1)),
                pw.Text('Show this code at boarding', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
              ]),
            ),
          ]),
        ),
      ),
    ),
  );
  return doc.save();
}

/// Saves the e-ticket PDF to the device and returns the file path.
/// Tries the public Downloads folder on Android, falling back to the app's
/// documents directory if scoped storage blocks it.
Future<String> saveTicket(Ticket t) async {
  final bytes = await buildTicketPdf(t);
  final fileName = 'Bookie-${t.ref}.pdf';

  Directory dir;
  if (Platform.isAndroid) {
    final downloads = Directory('/storage/emulated/0/Download');
    dir = await downloads.exists() ? downloads : (await getExternalStorageDirectory() ?? await getApplicationDocumentsDirectory());
  } else {
    dir = await getApplicationDocumentsDirectory();
  }

  var file = File('${dir.path}/$fileName');
  try {
    await file.writeAsBytes(bytes);
  } catch (_) {
    // scoped storage may block the public folder -> fall back to app storage
    final fallback = await getApplicationDocumentsDirectory();
    file = File('${fallback.path}/$fileName');
    await file.writeAsBytes(bytes);
  }
  return file.path;
}

/// Opens the OS share sheet (WhatsApp, email, Drive, print, …).
Future<void> shareTicket(Ticket t) async {
  final bytes = await buildTicketPdf(t);
  await Printing.sharePdf(bytes: bytes, filename: 'Bookie-${t.ref}.pdf');
}
