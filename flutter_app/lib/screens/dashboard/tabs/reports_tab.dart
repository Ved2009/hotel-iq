import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/mock_data.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/section_header.dart';

class ReportsTab extends StatefulWidget {
  const ReportsTab({super.key});

  @override
  State<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<ReportsTab> {
  String? _downloading;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionHeader(
        title: 'Reports',
        sub: 'Download, schedule and manage performance reports',
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
          children: reports.map((r) => _ReportCard(
            report: r,
            downloading: _downloading == r.name,
            onDownload: () async {
              if (r.status != 'Ready') return;
              setState(() => _downloading = r.name);
              await Future.delayed(const Duration(milliseconds: 1200));
              if (mounted) setState(() => _downloading = null);
            },
          )).toList(),
        );
      }),
    ]);
  }
}

class _ReportCard extends StatelessWidget {
  final ReportItem report;
  final bool downloading;
  final VoidCallback onDownload;

  const _ReportCard({required this.report, required this.downloading, required this.onDownload});

  @override
  Widget build(BuildContext context) {
    final isReady = report.status == 'Ready';

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
            _Badge(text: report.status, color: isReady ? C.green : const Color(0xFF818CF8)),
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
