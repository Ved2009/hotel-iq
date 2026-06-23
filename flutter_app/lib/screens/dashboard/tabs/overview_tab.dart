import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../data/mock_data.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/card_container.dart';
import '../../../widgets/kpi_card.dart';
import '../../../widgets/section_header.dart';

class OverviewTab extends StatelessWidget {
  final void Function(String) setTab;
  final void Function(String) showAuth;

  const OverviewTab({super.key, required this.setTab, required this.showAuth});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final user = prov.user;
    final prop = prov.property;
    final m = prop?.metrics;
    final p = prop?.profile;

    final occ    = m?.occupancy ?? 73.0;
    final adr    = m?.adr ?? 195.0;
    final revpar = m?.revpar ?? 142.0;
    final trevpar= m?.trevpar ?? 168.0;
    final revMtd = m?.revenueMtd ?? 89400.0;
    final goppar = m?.goppar ?? 89.0;
    final totalRooms = p?.totalRooms ?? 292;

    final urgent = pricingRecs.where((r) =>
        r.urgency == 'high' &&
        !prov.applied.contains(r.id) &&
        !prov.skipped.contains(r.id)).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (user == null) _DemoBanner(onAction: showAuth),
        if (user == null) const SizedBox(height: 16),
        SectionHeader(
          title: 'Revenue Overview',
          sub: user?.hotelName ?? p?.hotelName ?? 'The Coastal Grand',
          live: m?.hasData == true,
        ),
        const SizedBox(height: 20),
        // KPI grid
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth > 1100 ? 6 : c.maxWidth > 700 ? 3 : 2;
          return GridView.count(
            crossAxisCount: cols,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.1,
            children: [
              KpiCard(label: 'Occupancy',   value: '${occ.toInt()}%',
                sub: '${(occ/100*totalRooms).round()} / $totalRooms rooms',
                delta: 4.2,  accent: C.gold,   icon: '◈', spark: sparks['occupancy']),
              KpiCard(label: 'RevPAR',      value: '\$${revpar.toInt()}',
                sub: 'vs \$131 last mo.',    delta: 7.8,  accent: C.orange, icon: '↗', spark: sparks['revpar']),
              KpiCard(label: 'ADR',         value: '\$${adr.toInt()}',
                sub: 'Avg daily rate',        delta: 2.1,  accent: C.blue,   icon: '◆', spark: sparks['adr']),
              KpiCard(label: 'TRevPAR',     value: '\$${trevpar.toInt()}',
                sub: 'Total rev / room',      delta: 5.4,  accent: C.purple, icon: '⊞', spark: sparks['trevpar']),
              KpiCard(label: 'Revenue MTD', value: revMtd >= 1000 ? '\$${(revMtd/1000).toStringAsFixed(1)}K' : '\$${revMtd.toInt()}',
                sub: 'Month to date',         delta: 11.3, accent: C.green,  icon: '▦', spark: sparks['revenueMtd']),
              KpiCard(label: 'GOPPAR',      value: '\$${goppar.toInt()}',
                sub: 'Gross op. profit',      delta: 3.1,  accent: C.pink,   icon: '✦', spark: sparks['goppar']),
            ],
          );
        }),
        const SizedBox(height: 16),
        // Charts row
        LayoutBuilder(builder: (_, c) {
          final wide = c.maxWidth > 900;
          return wide
              ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(flex: 2, child: _OccupancyChart()),
                  const SizedBox(width: 16),
                  Expanded(child: _WeeklyBarChart()),
                ])
              : Column(children: [
                  _OccupancyChart(),
                  const SizedBox(height: 16),
                  _WeeklyBarChart(),
                ]);
        }),
        const SizedBox(height: 16),
        // AI insight + quick actions
        LayoutBuilder(builder: (_, c) {
          final wide = c.maxWidth > 900;
          return wide
              ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(flex: 3, child: _AiInsight(setTab: setTab)),
                  const SizedBox(width: 16),
                  Expanded(flex: 2, child: _QuickActions(urgent: urgent, prov: prov)),
                ])
              : Column(children: [
                  _AiInsight(setTab: setTab),
                  const SizedBox(height: 16),
                  _QuickActions(urgent: urgent, prov: prov),
                ]);
        }),
        const SizedBox(height: 16),
        _ActivityLog(),
      ],
    );
  }
}

class _DemoBanner extends StatelessWidget {
  final void Function(String) onAction;
  const _DemoBanner({required this.onAction});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0x1A6366F1), Color(0x0F8B5CF6)]),
        border: Border.all(color: const Color(0x336366F1)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: const Color(0x266366F1),
            border: Border.all(color: const Color(0x406366F1)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Center(child: Text('✦', style: TextStyle(fontSize: 20))),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text("You're viewing demo data",
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.text1)),
            const SizedBox(height: 2),
            Text('Sign in to connect your property and get live AI pricing recommendations',
              style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
          ]),
        ),
        GestureDetector(
          onTap: () => onAction('register'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
              borderRadius: BorderRadius.circular(10),
              boxShadow: const [BoxShadow(color: Color(0x666366F1), blurRadius: 20)],
            ),
            child: Text('Get Started Free →',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
          ),
        ),
      ]),
    );
  }
}

class _OccupancyChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: '12-Month Occupancy',
      subtitle: 'This year vs last year',
      child: SizedBox(
        height: 200,
        child: LineChart(LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(sideTitles: SideTitles(
              showTitles: true, reservedSize: 36,
              getTitlesWidget: (v, _) => Text('${v.toInt()}%',
                style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
            )),
            bottomTitles: AxisTitles(sideTitles: SideTitles(
              showTitles: true, reservedSize: 20,
              interval: 1,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                if (i < 0 || i >= months.length) return const SizedBox();
                return Text(months[i],
                  style: GoogleFonts.inter(fontSize: 9, color: C.text3));
              },
            )),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          minX: 0, maxX: 11, minY: 30, maxY: 100,
          lineBarsData: [
            LineChartBarData(
              spots: monthlyData.asMap().entries.map((e) =>
                FlSpot(e.key.toDouble(), e.value.occupancy)).toList(),
              isCurved: true,
              color: C.blue,
              barWidth: 2,
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [C.blue.withValues(alpha: 0.3), C.blue.withValues(alpha: 0)],
                ),
              ),
              dotData: const FlDotData(show: false),
            ),
            LineChartBarData(
              spots: monthlyData.asMap().entries.map((e) =>
                FlSpot(e.key.toDouble(), e.value.lastYear)).toList(),
              isCurved: true,
              color: C.text3,
              barWidth: 1.5,
              dashArray: [4, 4],
              dotData: const FlDotData(show: false),
            ),
          ],
        )),
      ),
    );
  }
}

class _WeeklyBarChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: 'This Week Revenue',
      subtitle: 'Purple = weekend',
      child: SizedBox(
        height: 200,
        child: BarChart(BarChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1),
          ),
          titlesData: FlTitlesData(
            bottomTitles: AxisTitles(sideTitles: SideTitles(
              showTitles: true, reservedSize: 20,
              getTitlesWidget: (v, _) {
                final i = v.toInt();
                if (i < 0 || i >= weeklyRevenue.length) return const SizedBox();
                return Text(weeklyRevenue[i].day,
                  style: GoogleFonts.inter(fontSize: 10, color: C.text3));
              },
            )),
            leftTitles: AxisTitles(sideTitles: SideTitles(
              showTitles: true, reservedSize: 42,
              getTitlesWidget: (v, _) => Text('\$${(v/1000).toStringAsFixed(0)}k',
                style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
            )),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          barGroups: weeklyRevenue.asMap().entries.map((e) => BarChartGroupData(
            x: e.key,
            barRods: [BarChartRodData(
              toY: e.value.revenue,
              color: e.key >= 4 ? C.blue : C.blue.withValues(alpha: 0.25),
              width: 22,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
            )],
          )).toList(),
        )),
      ),
    );
  }
}

class _AiInsight extends StatelessWidget {
  final void Function(String) setTab;
  const _AiInsight({required this.setTab});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0x146366F1), Color(0x0D8B5CF6), Color(0x126E46E5)],
        ),
        border: Border.all(color: const Color(0x336366F1)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0x4D6366F1), Color(0x338B5CF6)]),
              border: Border.all(color: const Color(0x596366F1)),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [BoxShadow(color: Color(0x406366F1), blurRadius: 20)],
            ),
            child: const Center(child: Text('✦', style: TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text('AI Revenue Insight',
                  style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 14, color: const Color(0xFF818CF8))),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0x1F6366F1),
                    border: Border.all(color: const Color(0x406366F1)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('LIVE', style: GoogleFonts.spaceMono(fontSize: 9, color: C.blue, letterSpacing: 1.2)),
                ),
              ]),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: GoogleFonts.inter(fontSize: 13, color: C.text2, height: 1.8),
                  children: [
                    const TextSpan(text: 'Demand spike forecasted '),
                    TextSpan(text: '+34%', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
                    const TextSpan(text: ' this weekend — regional tech conference in town. Standard King & Double Queen rates are '),
                    TextSpan(text: '\$16–20 below optimal', style: GoogleFonts.inter(color: C.orange)),
                    const TextSpan(text: '. Applying open recommendations could generate '),
                    TextSpan(text: '\$4,380', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: C.green)),
                    const TextSpan(text: ' additional revenue.'),
                  ],
                ),
              ),
            ]),
          ),
        ]),
        const SizedBox(height: 16),
        Row(children: [
          GestureDetector(
            onTap: () => setTab('pricing'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
                borderRadius: BorderRadius.circular(9),
                boxShadow: const [BoxShadow(color: Color(0x726366F1), blurRadius: 20)],
              ),
              child: Text('REVIEW PRICING →',
                style: GoogleFonts.spaceMono(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.5)),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () => setTab('forecast'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              decoration: BoxDecoration(
                color: const Color(0x08FFFFFF),
                border: Border.all(color: const Color(0x14FFFFFF)),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Text('VIEW FORECAST',
                style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
            ),
          ),
        ]),
      ]),
    );
  }
}

class _QuickActions extends StatelessWidget {
  final List<dynamic> urgent;
  final AppProvider prov;
  const _QuickActions({required this.urgent, required this.prov});

  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: 'Quick Actions',
      subtitle: urgent.isNotEmpty ? '${urgent.length} urgent recs open' : 'All clear',
      child: Column(children: [
        if (urgent.isEmpty)
          Center(
            child: Text('✓ All urgent actions resolved',
              style: GoogleFonts.spaceMono(fontSize: 11, color: C.green)),
          )
        else
          for (final r in urgent.take(3)) ...[
            Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: const Color(0x0F6366F1),
                border: Border.all(color: const Color(0x2E6366F1)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(r.room,
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                  Text('\$${r.current.toInt()} → \$${r.suggested.toInt()} · +\$${r.impact}',
                    style: GoogleFonts.spaceMono(fontSize: 10, color: C.green)),
                ])),
                GestureDetector(
                  onTap: () => prov.applyRec(r.id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [C.green, Color(0xFF059669)]),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('APPLY',
                      style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ),
              ]),
            ),
          ],
      ]),
    );
  }
}

class _ActivityLog extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: 'Recent Activity',
      subtitle: 'Live event log',
      child: LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 700 ? 3 : 1;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 0, mainAxisSpacing: 0,
          childAspectRatio: cols == 3 ? 3.2 : 5,
          children: activityLog.map((a) {
            final color = a.type == 'positive' || a.type == 'success'
                ? C.green
                : a.type == 'warning'
                    ? C.orange
                    : a.type == 'alert'
                        ? C.red
                        : C.blue;
            return Padding(
              padding: const EdgeInsets.all(10),
              child: Row(children: [
                Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(a.icon, style: TextStyle(fontSize: 12, color: color)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(a.text,
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFCBD5E1), height: 1.4),
                    maxLines: 2),
                  Text(a.time,
                    style: GoogleFonts.spaceMono(fontSize: 10, color: C.text4)),
                ])),
              ]),
            );
          }).toList(),
        );
      }),
    );
  }
}
