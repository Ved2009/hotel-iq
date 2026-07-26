import 'dart:convert';
import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/section_header.dart';

void _downloadCsv(String filename, String csv) {
  final bytes = utf8.encode(csv);
  final blob = html.Blob([bytes], 'text/csv');
  final url = html.Url.createObjectUrlFromBlob(blob);
  html.AnchorElement(href: url)
    ..setAttribute('download', filename)
    ..click();
  html.Url.revokeObjectUrl(url);
}

String _csvRow(List<Object?> cells) =>
    cells.map((c) => c == null ? '' : c.toString()).join(',');

class _ReportDef {
  final String name;
  final String desc;
  final String freq;
  final bool Function(AppProvider) available;
  final String Function(AppProvider) buildCsv;
  const _ReportDef({
    required this.name, required this.desc, required this.freq,
    required this.available, required this.buildCsv,
  });
}

final List<_ReportDef> _reportDefs = [
  _ReportDef(
    name: 'Daily Metrics Export',
    desc: 'Every day of imported history — date, occupancy, ADR, RevPAR, room revenue, rooms sold',
    freq: 'On demand',
    available: (p) => p.hasRealHistory,
    buildCsv: (p) {
      final rows = [_csvRow(['date', 'occupancy', 'adr', 'revpar', 'roomRevenue', 'fbRevenue', 'roomsSold'])];
      for (final r in p.dailyHistory) {
        rows.add(_csvRow([r['date'], r['occupancy'], r['adr'], r['revpar'], r['roomRevenue'], r['fbRevenue'], r['roomsSold']]));
      }
      return rows.join('\n');
    },
  ),
  _ReportDef(
    name: 'Year-over-Year Comparison',
    desc: 'Monthly occupancy, ADR & RevPAR — this year vs last year',
    freq: 'On demand',
    available: (p) => p.monthlyHistory.length > 1,
    buildCsv: (p) {
      final rows = [_csvRow(['month', 'occupancy', 'adr', 'revpar', 'roomRevenue', 'fbRevenue'])];
      for (final m in p.monthlyHistory) {
        rows.add(_csvRow([m['month'], m['occupancy'], m['adr'], m['revpar'], m['roomRevenue'], m['fbRevenue']]));
      }
      return rows.join('\n');
    },
  ),
  _ReportDef(
    name: '14-Day Demand Forecast',
    desc: 'Day-of-week seasonal forecast, next 14 days',
    freq: 'On demand',
    available: (p) => p.hasRealHistory,
    buildCsv: (p) {
      final rows = [_csvRow(['date', 'weekday', 'forecastDemandPct', 'historicalSamples'])];
      for (final d in p.forecastNext14Days) {
        final date = d['date'] as DateTime;
        rows.add(_csvRow([
          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
          d['weekday'], d['demand'], d['sampleCount'],
        ]));
      }
      return rows.join('\n');
    },
  ),
  _ReportDef(
    name: 'Comp Set Snapshot',
    desc: 'Live competitor rates & position — open the Comp Set tab first to fetch this',
    freq: 'On demand',
    available: (p) => p.compsetAnalysis != null,
    buildCsv: (p) {
      final a = p.compsetAnalysis!;
      final rows = [_csvRow(['metric', 'value'])];
      rows.add(_csvRow(['avgComp', a['avgComp']]));
      rows.add(_csvRow(['maxRate', a['maxRate']]));
      rows.add(_csvRow(['minRate', a['minRate']]));
      rows.add(_csvRow(['position', a['position']]));
      rows.add(_csvRow(['parity%', a['parity']]));
      rows.add(_csvRow(['suggestion', a['suggestion']]));
      return rows.join('\n');
    },
  ),
];

class ReportsTab extends StatefulWidget {
  const ReportsTab({super.key});

  @override
  State<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<ReportsTab> {
  String? _downloading;

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(
        title: 'Reports',
        sub: prov.hasRealHistory
            ? 'Real CSV exports from your imported history'
            : 'Import data (Settings) to unlock real exports',
        live: false,
      ),
      const SizedBox(height: 20),
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 700 ? 2 : 1;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: cols == 2 ? 3 : 2.5,
          children: _reportDefs.map((r) {
            final isReady = r.available(prov);
            return _ReportCard(
              report: r,
              isReady: isReady,
              downloading: _downloading == r.name,
              onDownload: () async {
                if (!isReady) return;
                setState(() => _downloading = r.name);
                final csv = r.buildCsv(prov);
                final slug = r.name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
                _downloadCsv('$slug.csv', csv);
                await Future.delayed(const Duration(milliseconds: 600));
                if (mounted) setState(() => _downloading = null);
              },
            );
          }).toList(),
        );
      }),
    ]);
  }
}

class _ReportCard extends StatelessWidget {
  final _ReportDef report;
  final bool isReady;
  final bool downloading;
  final VoidCallback onDownload;

  const _ReportCard({required this.report, required this.isReady, required this.downloading, required this.onDownload});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      decoration: BoxDecoration(
        color: const Color(0x08FFFFFF),
        border: Border.all(color: const Color(0x12FFFFFF)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: isReady ? const Color(0x1A10B981) : const Color(0x1A6366F1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text('📄',
              style: TextStyle(fontSize: 20, color: isReady ? C.green : const Color(0xFF818CF8))),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(report.name,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: C.text1)),
          const SizedBox(height: 3),
          Text(report.desc, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
          const SizedBox(height: 8),
          Row(children: [
            _Badge(text: report.freq, color: C.blue),
            const SizedBox(width: 8),
            _Badge(text: isReady ? 'Ready' : 'No data yet', color: isReady ? C.green : const Color(0xFF818CF8)),
          ]),
        ])),
        const SizedBox(width: 16),
        GestureDetector(
          onTap: isReady ? onDownload : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: downloading
                  ? const Color(0x1A10B981)
                  : isReady
                      ? const Color(0x1A6366F1)
                      : const Color(0x0AFFFFFF),
              border: Border.all(
                color: downloading
                    ? const Color(0x4D10B981)
                    : isReady
                        ? const Color(0x4D6366F1)
                        : const Color(0x0FFFFFFF),
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              downloading ? '✓ SAVED' : isReady ? '↓ DOWNLOAD' : 'PENDING',
              style: GoogleFonts.spaceMono(
                fontSize: 11, fontWeight: FontWeight.w700,
                color: downloading ? C.green : isReady ? const Color(0xFF818CF8) : C.text3,
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;
  const _Badge({required this.text, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(4),
    ),
    child: Text(text, style: GoogleFonts.spaceMono(fontSize: 10, color: color)),
  );
}
