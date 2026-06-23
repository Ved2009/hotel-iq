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

String _fmtK(double n) => n >= 1000 ? '\$${(n / 1000).toStringAsFixed(1)}K' : '\$${n.toInt()}';

class RevenueTab extends StatelessWidget {
  const RevenueTab({super.key});

  @override
  Widget build(BuildContext context) {
    final m = context.watch<AppProvider>().property?.metrics;
    final roomRev   = m?.roomRevenueMtd ?? 89400.0;
    final fbRev     = m?.fbRevenueMtd ?? 18200.0;
    final profit    = m?.profitMtd ?? 47300.0;
    final totalRev  = m?.revenueMtd ?? 115400.0;
    final ancillary = (totalRev - roomRev - fbRev).clamp(0, double.infinity);
    final gopMargin = totalRev > 0 ? (profit / totalRev * 100).toStringAsFixed(1) : '44.7';

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionHeader(title: 'Revenue Analysis', sub: 'Breakdown by segment, channel & performance metrics'),
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
            KpiCard(label: 'Room Revenue',    value: _fmtK(roomRev),   sub: 'Month to date',              delta: 11.3, accent: C.gold,   icon: '◆', spark: sparks['roomRev']),
            KpiCard(label: 'F&B Revenue',     value: _fmtK(fbRev),     sub: 'Month to date',              delta: 6.4,  accent: C.orange, icon: '◇', spark: sparks['fbRev']),
            KpiCard(label: 'Spa & Ancillary', value: _fmtK(ancillary as double), sub: 'Month to date',   delta: 14.2, accent: C.blue,   icon: '⊕', spark: sparks['trevpar']),
            KpiCard(label: 'Gross Profit',    value: _fmtK(profit),    sub: '$gopMargin% GOP margin',    delta: 8.1,  accent: C.green,  icon: '↗', spark: sparks['profit']),
          ],
        );
      }),
      const SizedBox(height: 16),
      LayoutBuilder(builder: (_, c) {
        final wide = c.maxWidth > 900;
        return wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(flex: 3, child: _ChannelChart()),
                const SizedBox(width: 16),
                Expanded(flex: 2, child: _SegmentPie()),
              ])
            : Column(children: [
                _ChannelChart(),
                const SizedBox(height: 16),
                _SegmentPie(),
              ]);
      }),
      const SizedBox(height: 16),
      _AdrRevparChart(),
    ]);
  }
}

class _ChannelChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final channelColors = [C.gold, C.blue, C.purple, C.green];
    final keys = ['direct', 'booking', 'expedia', 'phoneEmail'];
    final labels = ['Direct', 'Booking.com', 'Expedia', 'Phone/Email'];

    return CardContainer(
      title: 'Revenue by Channel',
      subtitle: 'Last 6 months — stacked',
      child: Column(children: [
        SizedBox(
          height: 220,
          child: BarChart(BarChartData(
            gridData: FlGridData(
              show: true, drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1),
            ),
            titlesData: FlTitlesData(
              bottomTitles: AxisTitles(sideTitles: SideTitles(
                showTitles: true, reservedSize: 22,
                getTitlesWidget: (v, _) {
                  final i = v.toInt();
                  if (i < 0 || i >= channelData.length) return const SizedBox();
                  return Text(channelData[i].month,
                    style: GoogleFonts.inter(fontSize: 10, color: C.text3));
                },
              )),
              leftTitles: AxisTitles(sideTitles: SideTitles(
                showTitles: true, reservedSize: 44,
                getTitlesWidget: (v, _) => Text('\$${(v/1000).toStringAsFixed(0)}k',
                  style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
              )),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            barGroups: channelData.asMap().entries.map((e) {
              final d = e.value;
              final vals = [d.direct, d.booking, d.expedia, d.phoneEmail];
              return BarChartGroupData(
                x: e.key,
                barRods: [BarChartRodData(
                  toY: vals.reduce((a, b) => a + b),
                  rodStackItems: List.generate(4, (i) => BarChartRodStackItem(
                    i == 0 ? 0 : vals.take(i).reduce((a, b) => a + b),
                    vals.take(i + 1).reduce((a, b) => a + b),
                    channelColors[i],
                  )),
                  width: 30,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                )],
              );
            }).toList(),
          )),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 16, runSpacing: 6,
          children: List.generate(4, (i) => Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 8, height: 8,
              decoration: BoxDecoration(color: channelColors[i], borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 6),
            Text(labels[i], style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
          ])),
        ),
      ]),
    );
  }
}

class _SegmentPie extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: 'Guest Segment Mix',
      subtitle: 'Current month',
      child: Column(children: [
        SizedBox(
          height: 160,
          child: PieChart(PieChartData(
            sectionsSpace: 3,
            centerSpaceRadius: 48,
            sections: segmentData.map((s) => PieChartSectionData(
              color: Color(s.color),
              value: s.value,
              title: '',
              radius: 24,
            )).toList(),
          )),
        ),
        const SizedBox(height: 12),
        for (final s in segmentData)
          Padding(
            padding: const EdgeInsets.only(bottom: 7),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(children: [
                  Container(width: 8, height: 8,
                    decoration: BoxDecoration(color: Color(s.color), borderRadius: BorderRadius.circular(2))),
                  const SizedBox(width: 8),
                  Text(s.name, style: GoogleFonts.inter(fontSize: 12, color: C.text2)),
                ]),
                Text('${s.value.toInt()}%',
                  style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.white)),
              ],
            ),
          ),
      ]),
    );
  }
}

class _AdrRevparChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: 'ADR & RevPAR Trend',
      subtitle: '12 months',
      child: Column(children: [
        SizedBox(
          height: 200,
          child: LineChart(LineChartData(
            gridData: FlGridData(
              show: true, drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1),
            ),
            titlesData: FlTitlesData(
              bottomTitles: AxisTitles(sideTitles: SideTitles(
                showTitles: true, reservedSize: 20, interval: 1,
                getTitlesWidget: (v, _) {
                  final i = v.toInt();
                  if (i < 0 || i >= months.length) return const SizedBox();
                  return Text(months[i], style: GoogleFonts.inter(fontSize: 9, color: C.text3));
                },
              )),
              leftTitles: AxisTitles(sideTitles: SideTitles(
                showTitles: true, reservedSize: 40,
                getTitlesWidget: (v, _) => Text('\$${v.toInt()}',
                  style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
              )),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            minX: 0, maxX: 11,
            lineBarsData: [
              LineChartBarData(
                spots: monthlyData.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.adr)).toList(),
                isCurved: true, color: C.gold, barWidth: 2.5,
                dotData: const FlDotData(show: false),
              ),
              LineChartBarData(
                spots: monthlyData.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.revpar)).toList(),
                isCurved: true, color: C.blue, barWidth: 2.5,
                dotData: const FlDotData(show: false),
              ),
            ],
          )),
        ),
        const SizedBox(height: 10),
        Row(children: [
          _Legend(color: C.gold, label: 'ADR'),
          const SizedBox(width: 20),
          _Legend(color: C.blue, label: 'RevPAR'),
        ]),
      ]),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 20, height: 2, color: color),
    const SizedBox(width: 6),
    Text(label, style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
  ]);
}
