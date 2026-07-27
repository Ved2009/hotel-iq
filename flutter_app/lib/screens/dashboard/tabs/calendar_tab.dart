import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/mock_data.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/card_container.dart';
import '../../../widgets/kpi_card.dart';
import '../../../widgets/section_header.dart';
import 'package:provider/provider.dart';

class CalendarTab extends StatelessWidget {
  const CalendarTab({super.key});

  Color _occColor(double occ) {
    if (occ >= 90) return C.red;
    if (occ >= 80) return C.orange;
    if (occ >= 65) return C.gold;
    if (occ >= 50) return C.green;
    return C.text4;
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final m = prov.property?.metrics;
    final now = DateTime.now();
    final monthName = '${_monthFull(now.month)} ${now.year}';
    final hasReal = prov.hasRealHistory;

    final thisMonthKey = '${now.year}-${now.month.toString().padLeft(2, '0')}';
    final priorMonthDate = DateTime(now.year, now.month - 1, 1);
    final priorMonthKey = '${priorMonthDate.year}-${priorMonthDate.month.toString().padLeft(2, '0')}';
    Map<String, dynamic>? thisMonthAgg;
    Map<String, dynamic>? priorMonthAgg;
    for (final row in prov.monthlyHistory) {
      if (row['month'] == thisMonthKey) thisMonthAgg = row;
      if (row['month'] == priorMonthKey) priorMonthAgg = row;
    }

    final realThisMonthDays = prov.dailyHistory.where((r) => (r['date'] as String).startsWith(thisMonthKey)).toList();

    final bestDay = realThisMonthDays.isNotEmpty
        ? realThisMonthDays.map((r) => ((r['roomRevenue'] as num?)?.toDouble() ?? 0) + ((r['fbRevenue'] as num?)?.toDouble() ?? 0)).reduce((a, b) => a > b ? a : b)
        : calendarDays.map((d) => d.revenue).reduce((a, b) => a > b ? a : b);
    final lowestOcc = realThisMonthDays.isNotEmpty
        ? realThisMonthDays.map((r) => (r['occupancy'] as num?)?.toDouble() ?? 100).reduce((a, b) => a < b ? a : b)
        : calendarDays.map((d) => d.occupancy).reduce((a, b) => a < b ? a : b);

    final occMtd = thisMonthAgg != null ? '${(thisMonthAgg['occupancy'] as num).toInt()}%'
        : m?.occupancy != null ? '${m!.occupancy!.toInt()}%' : '73%';
    final adrMtd = thisMonthAgg != null ? '\$${(thisMonthAgg['adr'] as num).toInt()}'
        : m?.adr != null ? '\$${m!.adr!.toInt()}' : '\$195';
    final occSub = priorMonthAgg != null ? 'vs ${(priorMonthAgg['occupancy'] as num).toInt()}% last month' : 'vs 69% last month';
    final adrSub = priorMonthAgg != null ? 'vs \$${(priorMonthAgg['adr'] as num).toInt()} last month' : 'vs \$191 last month';

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(title: 'Revenue Calendar', sub: '$monthName · Daily occupancy, ADR & revenue'),
      const SizedBox(height: 20),
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 900 ? 4 : 2;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: 1.1,
          children: [
            KpiCard(label: 'Avg Occupancy MTD', value: occMtd, sub: occSub, delta: 4.2, accent: C.gold,  icon: '▦'),
            KpiCard(label: 'Avg ADR MTD',       value: adrMtd, sub: adrSub, delta: 2.1, accent: C.blue, icon: '◆'),
            KpiCard(label: 'Best Day',           value: '\$${(bestDay / 1000).toStringAsFixed(1)}K', sub: 'Revenue single day', accent: C.green, icon: '↗'),
            KpiCard(label: 'Lowest Occ Day',     value: '${lowestOcc.toInt()}%', sub: 'Opportunity exists', accent: C.red, icon: '◇'),
          ],
        );
      }),
      const SizedBox(height: 16),
      CardContainer(
        title: '$monthName — Occupancy Heatmap',
        subtitle: 'Color-coded by occupancy level',
        child: Column(children: [
          // Day headers
          Row(children: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) =>
            Expanded(child: Center(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(d, style: GoogleFonts.spaceMono(fontSize: 10, color: C.text3)),
              ),
            ))).toList()),
          // Calendar grid
          Wrap(children: [
            ...List.generate(calendarOffset, (_) => const SizedBox(width: 0)),
            if (hasReal)
              ...List.generate(DateTime(now.year, now.month + 1, 0).day, (i) {
                final date = DateTime(now.year, now.month, i + 1);
                final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                Map<String, dynamic>? row;
                for (final r in realThisMonthDays) {
                  if (r['date'] == dateKey) { row = r; break; }
                }
                return LayoutBuilder(builder: (_, c) => SizedBox(
                  width: c.maxWidth > 0 ? c.maxWidth : double.infinity,
                  child: _RealCalDay(
                    day: i + 1,
                    isToday: date.day == now.day,
                    occupancy: row != null ? (row['occupancy'] as num?)?.toDouble() : null,
                    adr: row != null ? (row['adr'] as num?)?.toDouble() : null,
                    revenue: row != null
                        ? ((row['roomRevenue'] as num?)?.toDouble() ?? 0) + ((row['fbRevenue'] as num?)?.toDouble() ?? 0)
                        : null,
                    colorFor: _occColor,
                  ),
                ));
              })
            else
              ...calendarDays.map((d) => LayoutBuilder(builder: (_, c) {
                final occ = d.occupancy;
                final color = _occColor(occ);
                return SizedBox(
                  width: c.maxWidth > 0 ? c.maxWidth : double.infinity,
                  child: _CalDay(d: d, color: color),
                );
              })),
          ]),
          const SizedBox(height: 8),
          // Legend
          Wrap(spacing: 16, runSpacing: 6, children: [
            for (final x in [
              (C.green,  '50–65%'),
              (C.gold,   '65–80%'),
              (C.orange, '80–90%'),
              (C.red,    '90%+'),
            ])
              Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 8, height: 8, decoration: BoxDecoration(color: x.$1, borderRadius: BorderRadius.circular(2))),
                const SizedBox(width: 6),
                Text(x.$2, style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
              ]),
          ]),
        ]),
      ),
    ]);
  }
}

class _RealCalDay extends StatelessWidget {
  final int day;
  final bool isToday;
  final double? occupancy;
  final double? adr;
  final double? revenue;
  final Color Function(double) colorFor;

  const _RealCalDay({
    required this.day, required this.isToday,
    required this.occupancy, required this.adr, required this.revenue,
    required this.colorFor,
  });

  @override
  Widget build(BuildContext context) {
    final hasData = occupancy != null;
    final color = hasData ? colorFor(occupancy!) : C.text4;
    return LayoutBuilder(builder: (_, constraints) {
      return SizedBox(
        width: constraints.maxWidth > 0 ? constraints.maxWidth : 48,
        child: Container(
          margin: const EdgeInsets.all(3),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isToday ? const Color(0x2E6366F1) : hasData ? color.withValues(alpha: 0.15) : const Color(0x05FFFFFF),
            border: Border.all(
              color: isToday ? const Color(0xB36366F1) : hasData ? color.withValues(alpha: 0.4) : const Color(0x0AFFFFFF),
              width: isToday ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(children: [
            Text('$day${isToday ? " ●" : ""}',
              style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3),
              textAlign: TextAlign.center),
            const SizedBox(height: 4),
            if (hasData) ...[
              Text('${occupancy!.toInt()}%',
                style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w800, color: color),
                textAlign: TextAlign.center),
              if (adr != null)
                Text('\$${adr!.toInt()}',
                  style: GoogleFonts.spaceMono(fontSize: 8, color: C.text3),
                  textAlign: TextAlign.center),
              if (revenue != null)
                Text('\$${(revenue! / 1000).toStringAsFixed(1)}k',
                  style: GoogleFonts.spaceMono(fontSize: 7, color: C.text4),
                  textAlign: TextAlign.center),
            ] else
              Text('—', style: GoogleFonts.spaceMono(fontSize: 10, color: C.text4), textAlign: TextAlign.center),
          ]),
        ),
      );
    });
  }
}

class _CalDay extends StatelessWidget {
  final CalendarDay d;
  final Color color;
  const _CalDay({required this.d, required this.color});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (_, constraints) {
      return SizedBox(
        width: constraints.maxWidth > 0 ? constraints.maxWidth : 48,
        child: Container(
          margin: const EdgeInsets.all(3),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: d.isToday ? const Color(0x2E6366F1) : color.withValues(alpha: 0.15),
            border: Border.all(
              color: d.isToday ? const Color(0xB36366F1) : color.withValues(alpha: 0.4),
              width: d.isToday ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(children: [
            Text('${d.day}${d.isToday ? " ●" : ""}',
              style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3),
              textAlign: TextAlign.center),
            const SizedBox(height: 4),
            Text('${d.occupancy.toInt()}%',
              style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w800, color: color),
              textAlign: TextAlign.center),
            Text('\$${d.adr.toInt()}',
              style: GoogleFonts.spaceMono(fontSize: 8, color: C.text3),
              textAlign: TextAlign.center),
            Text('\$${(d.revenue / 1000).toStringAsFixed(1)}k',
              style: GoogleFonts.spaceMono(fontSize: 7, color: C.text4),
              textAlign: TextAlign.center),
          ]),
        ),
      );
    });
  }
}

String _monthFull(int m) => ['January','February','March','April','May','June',
  'July','August','September','October','November','December'][m-1];
