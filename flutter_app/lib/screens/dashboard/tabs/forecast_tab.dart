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

const _dowAbbr = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

class ForecastTab extends StatelessWidget {
  final void Function(String) setTab;
  const ForecastTab({super.key, required this.setTab});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final hasReal = prov.hasRealHistory;
    final forecast14 = prov.forecastNext14Days;
    final totalRooms = prov.property?.profile.totalRooms ?? 292;

    final avg7 = hasReal
        ? _avgDemand(forecast14.take(7).toList())
        : 81.0;
    final accuracy = hasReal ? prov.forecastAccuracyPct : 94.2;
    final projRev = hasReal ? prov.projectedRevenueNext7(totalRooms) : 41200.0;
    final weekendUplift = hasReal ? prov.weekendUpliftPct : 22.0;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(
        title: 'Demand Forecast',
        sub: hasReal
            ? '14-day forecast · day-of-week seasonality from ${prov.dailyHistory.length} days of real history'
            : '14-day AI prediction · 90-day training window · 94% historical accuracy',
      ),
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
            KpiCard(label: '7-Day Avg Demand',
              value: avg7 != null ? '${avg7.toInt()}%' : '—',
              sub: 'Forecasted', accent: C.blue, icon: '▦',
              spark: hasReal ? null : sparks['forecast7']),
            KpiCard(label: 'Forecast Accuracy',
              value: accuracy != null ? '${accuracy.toStringAsFixed(1)}%' : '—',
              sub: hasReal ? 'Backtest, last 30 days' : 'Last 90 days',
              accent: C.green, icon: '◎',
              spark: hasReal ? null : sparks['forecastAcc']),
            KpiCard(label: 'Projected Revenue',
              value: projRev != null ? _fmtK(projRev) : '—',
              sub: 'Next 7 days', accent: C.gold, icon: '◆',
              spark: hasReal ? null : sparks['projRev']),
            KpiCard(label: 'Weekend Uplift',
              value: weekendUplift != null ? '${weekendUplift >= 0 ? "+" : ""}${weekendUplift.toStringAsFixed(0)}%' : '—',
              sub: 'vs weekday demand (14d)', accent: C.purple, icon: '↗'),
          ],
        );
      }),
      const SizedBox(height: 16),
      if (!hasReal)
        // Demo-only illustrative event callout — no real events/calendar data source exists
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0x126366F1),
            border: Border.all(color: const Color(0x336366F1)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            const Text('📍', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Event Detected — Regional Tech Conference (Days 6–8)',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: C.blue)),
              const SizedBox(height: 4),
              Text('Demo data. Expected +34% demand spike · Raise rates 12–18% · Consider 3-night minimum stay restriction',
                style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
            ])),
            const SizedBox(width: 14),
            GestureDetector(
              onTap: () => setTab('pricing'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0x1F6366F1),
                  border: Border.all(color: const Color(0x4D6366F1)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('ADJUST RATES →',
                  style: GoogleFonts.spaceMono(fontSize: 11, fontWeight: FontWeight.w700, color: C.blue)),
              ),
            ),
          ]),
        ),
      if (!hasReal) const SizedBox(height: 16),
      // 14-day chart
      CardContainer(
        title: '14-Day Demand Outlook',
        subtitle: hasReal
            ? 'Historical same-weekday average · no event/calendar data source'
            : 'Confidence intervals modeled on seasonal patterns',
        child: SizedBox(
          height: 250,
          child: hasReal ? _RealForecastChart(forecast: forecast14) : _MockForecastChart(),
        ),
      ),
      const SizedBox(height: 16),
      LayoutBuilder(builder: (_, c) {
        final wide = c.maxWidth > 900;
        return wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(flex: 2, child: _PickupChart()),
                const SizedBox(width: 16),
                Expanded(child: _SevenDayBreakdown()),
              ])
            : Column(children: [_PickupChart(), const SizedBox(height: 16), _SevenDayBreakdown()]);
      }),
    ]);
  }
}

double? _avgDemand(List<Map<String, dynamic>> days) {
  final vals = days.map((d) => d['demand'] as double?).whereType<double>().toList();
  if (vals.isEmpty) return null;
  return vals.reduce((a, b) => a + b) / vals.length;
}

String _fmtK(double n) => n >= 1000 ? '\$${(n / 1000).toStringAsFixed(1)}K' : '\$${n.toInt()}';

// ── Real forecast chart (day-of-week seasonality) ──────────────────────────

class _RealForecastChart extends StatelessWidget {
  final List<Map<String, dynamic>> forecast;
  const _RealForecastChart({required this.forecast});

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[];
    for (var i = 0; i < forecast.length; i++) {
      final d = forecast[i]['demand'] as double?;
      if (d != null) spots.add(FlSpot(i.toDouble(), d));
    }
    return LineChart(LineChartData(
      gridData: FlGridData(show: true, drawVerticalLine: false,
        getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1)),
      titlesData: FlTitlesData(
        bottomTitles: AxisTitles(sideTitles: SideTitles(
          showTitles: true, reservedSize: 24, interval: 2,
          getTitlesWidget: (v, _) {
            final i = v.toInt();
            if (i < 0 || i >= forecast.length) return const SizedBox();
            final date = forecast[i]['date'] as DateTime;
            return Text('${date.month}/${date.day}', style: GoogleFonts.inter(fontSize: 9, color: C.text3));
          },
        )),
        leftTitles: AxisTitles(sideTitles: SideTitles(
          showTitles: true, reservedSize: 36,
          getTitlesWidget: (v, _) => Text('${v.toInt()}%', style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
        )),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      minX: 0, maxX: 13, minY: 0, maxY: 100,
      lineBarsData: [
        LineChartBarData(
          spots: spots, isCurved: true, color: C.blue, barWidth: 2.5,
          belowBarData: BarAreaData(show: true,
            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [C.blue.withValues(alpha: 0.28), C.blue.withValues(alpha: 0)])),
          dotData: const FlDotData(show: true),
        ),
      ],
    ));
  }
}

class _MockForecastChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) => LineChart(LineChartData(
    gridData: FlGridData(show: true, drawVerticalLine: false,
      getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1)),
    titlesData: FlTitlesData(
      bottomTitles: AxisTitles(sideTitles: SideTitles(
        showTitles: true, reservedSize: 24, interval: 2,
        getTitlesWidget: (v, _) {
          final i = v.toInt();
          if (i < 0 || i >= forecastData.length) return const SizedBox();
          return Text(forecastData[i].date, style: GoogleFonts.inter(fontSize: 9, color: C.text3));
        },
      )),
      leftTitles: AxisTitles(sideTitles: SideTitles(
        showTitles: true, reservedSize: 36,
        getTitlesWidget: (v, _) => Text('${v.toInt()}%', style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
      )),
      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
    ),
    borderData: FlBorderData(show: false),
    minX: 0, maxX: 13, minY: 0, maxY: 100,
    lineBarsData: [
      LineChartBarData(
        spots: forecastData.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.demand)).toList(),
        isCurved: true, color: C.blue, barWidth: 2.5,
        belowBarData: BarAreaData(show: true,
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [C.blue.withValues(alpha: 0.28), C.blue.withValues(alpha: 0)])),
        dotData: FlDotData(show: true, getDotPainter: (spot, _, __, i) {
          final d = forecastData[i];
          if (d.event == null) return FlDotCirclePainter(radius: 0, color: Colors.transparent);
          return FlDotCirclePainter(radius: 5,
            color: d.event == 'Conference' ? C.purple : C.green, strokeColor: Colors.white, strokeWidth: 1.5);
        }),
      ),
    ],
  ));
}

// ── Booking Pickup / Net Room Change ────────────────────────────────────────

class _PickupChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final hasReal = prov.hasRealHistory;
    final deltas = hasReal ? prov.roomsSoldDelta7 : <Map<String, dynamic>>[];

    return CardContainer(
      title: hasReal ? 'Net Room Count Change' : 'Booking Pickup',
      subtitle: hasReal
          ? 'Day-over-day change in rooms sold (last 7 days) · not booking-level data'
          : 'New bookings made per day (last 7 days)',
      child: Column(children: [
        SizedBox(
          height: 180,
          child: hasReal && deltas.isNotEmpty ? _RealDeltaChart(deltas: deltas) : _MockPickupChart(),
        ),
        const SizedBox(height: 10),
        if (hasReal && deltas.isNotEmpty)
          Row(children: [
            _Legend(color: C.green, label: 'Rooms gained'),
            const SizedBox(width: 16),
            _Legend(color: C.red, label: 'Rooms lost'),
          ])
        else
          Row(children: [
            _Legend(color: C.green, label: 'New Bookings'),
            const SizedBox(width: 16),
            _Legend(color: C.red, label: 'Cancellations'),
          ]),
      ]),
    );
  }
}

class _RealDeltaChart extends StatelessWidget {
  final List<Map<String, dynamic>> deltas;
  const _RealDeltaChart({required this.deltas});

  @override
  Widget build(BuildContext context) => BarChart(BarChartData(
    gridData: FlGridData(show: true, drawVerticalLine: false,
      getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1)),
    titlesData: FlTitlesData(
      bottomTitles: AxisTitles(sideTitles: SideTitles(
        showTitles: true, reservedSize: 22,
        getTitlesWidget: (v, _) {
          final i = v.toInt();
          if (i < 0 || i >= deltas.length) return const SizedBox();
          final date = DateTime.parse(deltas[i]['date'] as String);
          return Text('${date.month}/${date.day}', style: GoogleFonts.inter(fontSize: 9, color: C.text3));
        },
      )),
      leftTitles: AxisTitles(sideTitles: SideTitles(
        showTitles: true, reservedSize: 26,
        getTitlesWidget: (v, _) => Text('${v.toInt()}', style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
      )),
      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
    ),
    borderData: FlBorderData(show: false),
    barGroups: deltas.asMap().entries.map((e) {
      final delta = (e.value['delta'] as int).toDouble();
      return BarChartGroupData(x: e.key, barRods: [
        BarChartRodData(toY: delta, color: delta >= 0 ? C.green : C.red, width: 20,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
      ]);
    }).toList(),
  ));
}

class _MockPickupChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) => BarChart(BarChartData(
    gridData: FlGridData(show: true, drawVerticalLine: false,
      getDrawingHorizontalLine: (_) => const FlLine(color: Color(0x126E6E6E), strokeWidth: 1)),
    titlesData: FlTitlesData(
      bottomTitles: AxisTitles(sideTitles: SideTitles(
        showTitles: true, reservedSize: 22,
        getTitlesWidget: (v, _) {
          final i = v.toInt();
          if (i < 0 || i >= pickupData.length) return const SizedBox();
          return Text(pickupData[i].date, style: GoogleFonts.inter(fontSize: 9, color: C.text3));
        },
      )),
      leftTitles: AxisTitles(sideTitles: SideTitles(
        showTitles: true, reservedSize: 26,
        getTitlesWidget: (v, _) => Text('${v.toInt()}', style: GoogleFonts.inter(fontSize: 9, color: C.text3)),
      )),
      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
    ),
    borderData: FlBorderData(show: false),
    barGroups: pickupData.asMap().entries.map((e) => BarChartGroupData(
      x: e.key,
      barRods: [
        BarChartRodData(toY: e.value.bookings, color: C.green, width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
        BarChartRodData(toY: e.value.cancellations, color: C.red, width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
      ],
    )).toList(),
  ));
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 8, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 6),
    Text(label, style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
  ]);
}

// ── 7-Day Breakdown ──────────────────────────────────────────────────────────

class _SevenDayBreakdown extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final hasReal = prov.hasRealHistory;

    return CardContainer(
      title: '7-Day Breakdown',
      child: Row(
        children: hasReal
            ? prov.forecastNext14Days.take(7).map((d) {
                final demand = d['demand'] as double?;
                final isHigh = (demand ?? 0) > 85;
                final date = d['date'] as DateTime;
                final n = d['sampleCount'] as int;
                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                    decoration: BoxDecoration(
                      color: isHigh ? const Color(0x1210B981) : const Color(0x08FFFFFF),
                      border: Border.all(color: isHigh ? const Color(0x4010B981) : Colors.transparent),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(children: [
                      Text('${_dowAbbr[d['weekday'] as int]} ${date.month}/${date.day}',
                        style: GoogleFonts.spaceMono(fontSize: 8, color: C.text3), textAlign: TextAlign.center),
                      const SizedBox(height: 6),
                      Text(demand != null ? '${demand.toInt()}%' : '—',
                        style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w800,
                          color: isHigh ? C.green : C.text3)),
                      const SizedBox(height: 4),
                      Text('n=$n', style: GoogleFonts.spaceMono(fontSize: 7, color: C.text4)),
                    ]),
                  ),
                );
              }).toList()
            : forecastData.take(7).map((d) {
                final isHigh = d.demand > 85;
                final isEvent = d.event == 'Conference';
                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                    decoration: BoxDecoration(
                      color: isEvent ? const Color(0x1A6366F1) : isHigh ? const Color(0x1210B981) : const Color(0x08FFFFFF),
                      border: Border.all(
                        color: isEvent ? const Color(0x596366F1) : isHigh ? const Color(0x4010B981) : Colors.transparent),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(children: [
                      Text(d.date, style: GoogleFonts.spaceMono(fontSize: 8, color: C.text3), textAlign: TextAlign.center),
                      const SizedBox(height: 6),
                      Text('${d.demand.toInt()}%',
                        style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w800,
                          color: isEvent ? const Color(0xFF818CF8) : isHigh ? C.green : C.text3)),
                      if (d.event != null)
                        Text(d.event!.toUpperCase(),
                          style: GoogleFonts.spaceMono(fontSize: 7, color: isEvent ? const Color(0xFF818CF8) : C.green),
                          textAlign: TextAlign.center),
                      const SizedBox(height: 4),
                      Text('${d.confidence.toInt()}%', style: GoogleFonts.spaceMono(fontSize: 7, color: C.text4)),
                    ]),
                  ),
                );
              }).toList(),
      ),
    );
  }
}
