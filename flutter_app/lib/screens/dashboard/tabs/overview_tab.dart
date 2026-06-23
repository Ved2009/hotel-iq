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
    final m = prov.property?.metrics;
    final p = prov.property?.profile;

    // Loading state
    if (prov.propertyLoading && prov.property == null) {
      return const Center(child: Padding(
        padding: EdgeInsets.symmetric(vertical: 80),
        child: CircularProgressIndicator(color: C.violet, strokeWidth: 2),
      ));
    }

    // Error state
    if (prov.propertyError != null && prov.property == null) {
      return Center(child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('⚠', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 16),
          Text('Could not load property data', style: GoogleFonts.syne(fontSize: 18, color: C.text1)),
          const SizedBox(height: 8),
          Text(prov.propertyError!, style: GoogleFonts.inter(fontSize: 13, color: C.text3)),
        ]),
      ));
    }

    final occ    = m?.occupancy   ?? 73.0;
    final adr    = m?.adr         ?? 195.0;
    final revpar = m?.revpar      ?? 142.0;
    final trevpar= m?.trevpar     ?? 168.0;
    final revMtd = m?.revenueMtd  ?? 89400.0;
    final goppar = m?.goppar      ?? 89.0;
    final rooms  = p?.totalRooms  ?? 292;
    final hasReal = m?.hasData == true;

    final urgent = pricingRecs.where((r) =>
      r.urgency == 'high' &&
      !prov.applied.contains(r.id) &&
      !prov.skipped.contains(r.id)).toList();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Setup wizard for new signed-in users
      if (prov.isNewUser) ...[
        _SetupWizard(setTab: setTab),
        const SizedBox(height: 20),
      ],

      // Header
      SectionHeader(
        title: user?.hotelName ?? p?.hotelName ?? 'Hotel IQ Dashboard',
        sub: hasReal
            ? 'Live data · Updated ${_timeAgo(m!.updatedAt!)}'
            : user != null
                ? 'Demo data shown — enter real metrics in Settings'
                : 'Demo data — sign in to connect your property',
        live: hasReal,
        right: user == null
            ? GestureDetector(
                onTap: () => showAuth('register'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 16)],
                  ),
                  child: Text('Connect Property →',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              )
            : null,
      ),
      const SizedBox(height: 24),

      // KPI grid
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 1100 ? 6 : c.maxWidth > 700 ? 3 : 2;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: 1.05,
          children: [
            KpiCard(label: 'Occupancy',   value: '${occ.toInt()}%',
              sub: '${(occ/100*rooms).round()} / $rooms rooms',
              delta: 4.2, accent: C.gold,   icon: '◈', spark: sparks['occupancy']),
            KpiCard(label: 'RevPAR',      value: '\$${revpar.toInt()}',
              sub: 'Revenue per avail. room', delta: 7.8, accent: C.violet, icon: '↗', spark: sparks['revpar']),
            KpiCard(label: 'ADR',         value: '\$${adr.toInt()}',
              sub: 'Avg daily rate',          delta: 2.1, accent: C.blue,   icon: '◆', spark: sparks['adr']),
            KpiCard(label: 'TRevPAR',     value: '\$${trevpar.toInt()}',
              sub: 'Total revenue / room',    delta: 5.4, accent: C.purple, icon: '⊞', spark: sparks['trevpar']),
            KpiCard(label: 'Revenue MTD', value: _fmtK(revMtd),
              sub: 'Month to date',           delta: 11.3, accent: C.green, icon: '▦', spark: sparks['revenueMtd']),
            KpiCard(label: 'GOPPAR',      value: '\$${goppar.toInt()}',
              sub: 'Gross operating profit',  delta: 3.1, accent: C.pink,  icon: '✦', spark: sparks['goppar']),
          ],
        );
      }),
      const SizedBox(height: 20),

      // Charts row
      LayoutBuilder(builder: (_, c) {
        final wide = c.maxWidth > 900;
        return wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(flex: 3, child: _OccupancyChart()),
                const SizedBox(width: 16),
                Expanded(flex: 2, child: _RevenueBarChart()),
              ])
            : Column(children: [_OccupancyChart(), const SizedBox(height: 16), _RevenueBarChart()]);
      }),
      const SizedBox(height: 20),

      // AI Insight + Urgent Pricing
      LayoutBuilder(builder: (_, c) {
        final wide = c.maxWidth > 900;
        return wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(flex: 3, child: _AiInsight(setTab: setTab)),
                const SizedBox(width: 16),
                Expanded(flex: 2, child: _UrgentActions(urgent: urgent, prov: prov, setTab: setTab)),
              ])
            : Column(children: [
                _AiInsight(setTab: setTab),
                const SizedBox(height: 16),
                _UrgentActions(urgent: urgent, prov: prov, setTab: setTab),
              ]);
      }),
      const SizedBox(height: 20),

      // Activity log
      _ActivityLog(),
    ]);
  }
}

String _fmtK(double n) => n >= 1000 ? '\$${(n/1000).toStringAsFixed(1)}K' : '\$${n.toInt()}';

String _timeAgo(String iso) {
  try {
    final d = DateTime.parse(iso);
    final diff = DateTime.now().difference(d);
    if (diff.inMinutes < 2) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  } catch (_) { return 'recently'; }
}

// ── Charts ────────────────────────────────────────────────────────────────────

class _OccupancyChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) => CardContainer(
    title: '12-Month Occupancy',
    subtitle: 'This year vs last year',
    accent: C.violet,
    child: SizedBox(height: 210, child: LineChart(LineChartData(
      gridData: FlGridData(show: true, drawVerticalLine: false,
        getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x0FFFFFFF), strokeWidth: 1)),
      titlesData: FlTitlesData(
        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 36,
          getTitlesWidget: (v, _) => Text('${v.toInt()}%',
            style: GoogleFonts.inter(fontSize: 9, color: C.text3)))),
        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 20, interval: 1,
          getTitlesWidget: (v, _) {
            final i = v.toInt();
            if (i < 0 || i >= months.length) return const SizedBox();
            return Text(months[i], style: GoogleFonts.inter(fontSize: 9, color: C.text3));
          })),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      minX: 0, maxX: 11, minY: 30, maxY: 100,
      lineBarsData: [
        _line(monthlyData.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.occupancy)).toList(),
          C.violet, 2.5, null, true),
        _line(monthlyData.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.lastYear)).toList(),
          C.text3, 1.5, [4, 4], false),
      ],
    ))),
  );

  LineChartBarData _line(List<FlSpot> spots, Color color, double width, List<int>? dash, bool fill) =>
    LineChartBarData(
      spots: spots, isCurved: true, color: color, barWidth: width, dashArray: dash,
      dotData: const FlDotData(show: false),
      belowBarData: fill ? BarAreaData(show: true,
        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [color.withValues(alpha: 0.2), color.withValues(alpha: 0)])) : BarAreaData(show: false),
    );
}

class _RevenueBarChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) => CardContainer(
    title: 'Weekly Revenue',
    subtitle: 'Mon–Sun · weekend highlighted',
    accent: C.gold,
    child: SizedBox(height: 210, child: BarChart(BarChartData(
      gridData: FlGridData(show: true, drawVerticalLine: false,
        getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x0FFFFFFF), strokeWidth: 1)),
      titlesData: FlTitlesData(
        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 22,
          getTitlesWidget: (v, _) {
            final i = v.toInt();
            if (i < 0 || i >= weeklyRevenue.length) return const SizedBox();
            return Text(weeklyRevenue[i].day, style: GoogleFonts.inter(fontSize: 10, color: C.text3));
          })),
        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 42,
          getTitlesWidget: (v, _) => Text('\$${(v/1000).toStringAsFixed(0)}k',
            style: GoogleFonts.inter(fontSize: 9, color: C.text3)))),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      barGroups: weeklyRevenue.asMap().entries.map((e) => BarChartGroupData(
        x: e.key,
        barRods: [BarChartRodData(
          toY: e.value.revenue,
          gradient: e.key >= 4
              ? const LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter,
                  colors: [C.gold, Color(0xFFFBBF24)])
              : LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter,
                  colors: [C.violet.withValues(alpha: 0.4), C.violet.withValues(alpha: 0.6)]),
          width: 28,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
        )],
      )).toList(),
    ))),
  );
}

// ── AI Insight ────────────────────────────────────────────────────────────────

class _AiInsight extends StatelessWidget {
  final void Function(String) setTab;
  const _AiInsight({required this.setTab});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [C.violet.withValues(alpha: 0.1), C.violetDark.withValues(alpha: 0.05)],
      ),
      border: Border.all(color: C.violet.withValues(alpha: 0.25)),
      borderRadius: BorderRadius.circular(24),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 16)],
          ),
          child: const Center(child: Text('✦', style: TextStyle(fontSize: 16, color: Colors.white))),
        ),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('AI Revenue Insight',
            style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 15, color: C.violetLight)),
          Text('Updated in real time',
            style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
        ]),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: C.green.withValues(alpha: 0.1),
            border: Border.all(color: C.green.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(100),
          ),
          child: Text('LIVE', style: GoogleFonts.spaceMono(fontSize: 8, color: C.green, letterSpacing: 1)),
        ),
      ]),
      const SizedBox(height: 20),
      RichText(text: TextSpan(
        style: GoogleFonts.inter(fontSize: 14, color: C.text2, height: 1.8),
        children: [
          const TextSpan(text: 'Demand spike forecast '),
          TextSpan(text: '+34%', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
          const TextSpan(text: ' this weekend — regional tech conference detected. Standard King & Double Queen are '),
          TextSpan(text: '\$16–20 below optimal.', style: GoogleFonts.inter(color: C.orange)),
          const TextSpan(text: ' Applying all open recommendations could generate '),
          TextSpan(text: '\$4,380', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: C.green)),
          const TextSpan(text: ' in additional revenue.'),
        ],
      )),
      const SizedBox(height: 20),
      Row(children: [
        _ActionBtn('Review Pricing →', C.violet, () => setTab('pricing')),
        const SizedBox(width: 10),
        _ActionBtn('Ask AI Analyst', null, () => setTab('ai')),
      ]),
    ]),
  );
}

class _ActionBtn extends StatelessWidget {
  final String label; final Color? color; final VoidCallback onTap;
  const _ActionBtn(this.label, this.color, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      decoration: BoxDecoration(
        gradient: color != null ? LinearGradient(colors: [color!, C.violetDark]) : null,
        color: color != null ? null : C.glass,
        border: color != null ? null : Border.all(color: C.border),
        borderRadius: BorderRadius.circular(10),
        boxShadow: color != null ? [BoxShadow(color: color!.withValues(alpha: 0.4), blurRadius: 16)] : null,
      ),
      child: Text(label, style: GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w600,
        color: color != null ? Colors.white : C.text2,
      )),
    ),
  );
}

// ── Urgent Actions ────────────────────────────────────────────────────────────

class _UrgentActions extends StatelessWidget {
  final List<dynamic> urgent;
  final AppProvider prov;
  final void Function(String) setTab;
  const _UrgentActions({required this.urgent, required this.prov, required this.setTab});

  @override
  Widget build(BuildContext context) => CardContainer(
    title: urgent.isEmpty ? 'Pricing' : 'Urgent Pricing Actions',
    subtitle: urgent.isEmpty ? 'All recommendations reviewed' : '${urgent.length} high-priority rec${urgent.length != 1 ? "s" : ""} open',
    accent: urgent.isEmpty ? C.green : C.red,
    child: urgent.isEmpty
        ? Column(children: [
            const SizedBox(height: 8),
            Row(children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: C.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: Text('✓', style: TextStyle(fontSize: 20, color: C.green))),
              ),
              const SizedBox(width: 14),
              Expanded(child: Text('All urgent pricing recommendations have been reviewed.',
                style: GoogleFonts.inter(fontSize: 13, color: C.text2, height: 1.5))),
            ]),
            const SizedBox(height: 14),
            GestureDetector(
              onTap: () => setTab('pricing'),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  border: Border.all(color: C.border),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(child: Text('View All Pricing →',
                  style: GoogleFonts.inter(fontSize: 13, color: C.text2))),
              ),
            ),
          ])
        : Column(children: [
            for (final r in urgent.take(3)) ...[
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: C.violet.withValues(alpha: 0.06),
                  border: Border.all(color: C.violet.withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(r.room, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.text1)),
                    const SizedBox(height: 3),
                    RichText(text: TextSpan(children: [
                      TextSpan(text: '\$${r.current.toInt()}', style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
                      TextSpan(text: '  →  ', style: GoogleFonts.spaceMono(fontSize: 11, color: C.text4)),
                      TextSpan(text: '\$${r.suggested.toInt()}', style: GoogleFonts.spaceMono(fontSize: 11, color: C.gold, fontWeight: FontWeight.w700)),
                      TextSpan(text: '  +\$${r.impact}', style: GoogleFonts.spaceMono(fontSize: 11, color: C.green)),
                    ])),
                  ])),
                  GestureDetector(
                    onTap: () => prov.applyRec(r.id, roomId: r.roomId, oldRate: r.current, newRate: r.suggested, reason: r.reason),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [C.green, Color(0xFF059669)]),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [BoxShadow(color: C.green.withValues(alpha: 0.4), blurRadius: 10)],
                      ),
                      child: Text('APPLY', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                    ),
                  ),
                ]),
              ),
            ],
            GestureDetector(
              onTap: () => setTab('pricing'),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  color: C.violet.withValues(alpha: 0.08),
                  border: Border.all(color: C.violet.withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(child: Text('View All Recommendations →',
                  style: GoogleFonts.inter(fontSize: 12, color: C.violetLight))),
              ),
            ),
          ]),
  );
}

// ── Activity Log ──────────────────────────────────────────────────────────────

class _ActivityLog extends StatelessWidget {
  @override
  Widget build(BuildContext context) => CardContainer(
    title: 'Activity Feed',
    subtitle: 'Live event log',
    child: LayoutBuilder(builder: (_, c) {
      final cols = c.maxWidth > 700 ? 3 : 1;
      return GridView.count(
        crossAxisCount: cols,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 0, mainAxisSpacing: 0,
        childAspectRatio: cols == 3 ? 3.5 : 5,
        children: activityLog.map((a) {
          final color = a.type == 'positive' || a.type == 'success' ? C.green
              : a.type == 'warning' ? C.orange
              : a.type == 'alert'   ? C.red
              : C.violet;
          return Padding(
            padding: const EdgeInsets.all(10),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  border: Border.all(color: color.withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Center(child: Text(a.icon, style: TextStyle(fontSize: 13, color: color))),
              ),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(a.text, style: GoogleFonts.inter(fontSize: 12, color: C.text2, height: 1.4), maxLines: 2),
                const SizedBox(height: 3),
                Text(a.time, style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4)),
              ])),
            ]),
          );
        }).toList(),
      );
    }),
  );
}

// ── Setup Wizard ──────────────────────────────────────────────────────────────

class _SetupWizard extends StatelessWidget {
  final void Function(String) setTab;
  const _SetupWizard({required this.setTab});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [C.violet.withValues(alpha: 0.12), C.violetDark.withValues(alpha: 0.06)],
        ),
        border: Border.all(color: C.violet.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(children: [
        Container(
          width: 52, height: 52,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 20)],
          ),
          child: const Center(child: Text('🏨', style: TextStyle(fontSize: 24))),
        ),
        const SizedBox(width: 20),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Set up your property',
            style: GoogleFonts.syne(fontSize: 17, fontWeight: FontWeight.w700, color: C.text1)),
          const SizedBox(height: 4),
          Text(
            'Enter your hotel metrics in Settings to unlock live AI pricing recommendations, accurate forecasting, and real comp set analysis.',
            style: GoogleFonts.inter(fontSize: 13, color: C.text2, height: 1.5),
          ),
          const SizedBox(height: 14),
          Row(children: [
            GestureDetector(
              onTap: () => setTab('settings'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.4), blurRadius: 14)],
                ),
                child: Text('Enter My Metrics →',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
            const SizedBox(width: 12),
            Text('Takes 2 minutes', style: GoogleFonts.spaceMono(fontSize: 10, color: C.text3, letterSpacing: 0.5)),
          ]),
        ])),
        const SizedBox(width: 20),
        Column(children: [
          for (final step in [('1', 'Enter KPIs', C.green), ('2', 'AI analyses', C.violet), ('3', 'Get recs', C.gold)])
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  width: 22, height: 22,
                  decoration: BoxDecoration(
                    color: step.$3.withValues(alpha: 0.15),
                    border: Border.all(color: step.$3.withValues(alpha: 0.4)),
                    shape: BoxShape.circle,
                  ),
                  child: Center(child: Text(step.$1,
                    style: GoogleFonts.spaceMono(fontSize: 9, color: step.$3, fontWeight: FontWeight.w700))),
                ),
                const SizedBox(width: 8),
                Text(step.$2, style: GoogleFonts.inter(fontSize: 12, color: C.text2)),
              ]),
            ),
        ]),
      ]),
    );
  }
}
