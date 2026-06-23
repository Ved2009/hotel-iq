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

class CompSetTab extends StatefulWidget {
  const CompSetTab({super.key});

  @override
  State<CompSetTab> createState() => _CompSetTabState();
}

class _CompSetTabState extends State<CompSetTab> {
  bool _loading = false;
  List<CompHotel> _customComps = [];
  final _newCompCtrl = TextEditingController();
  bool _showAddComp = false;

  @override
  void dispose() { _newCompCtrl.dispose(); super.dispose(); }

  String get _yourName => context.read<AppProvider>().property?.profile.hotelName ?? 'Your Hotel';
  double get _yourRate => context.read<AppProvider>().property?.rooms.isNotEmpty == true
      ? context.read<AppProvider>().property!.rooms.map((r) => r.rate).reduce((a, b) => a + b) /
          context.read<AppProvider>().property!.rooms.length
      : 189;

  @override
  Widget build(BuildContext context) {
    final yourName = _yourName;
    final yourRate = _yourRate;
    final yourEntry = CompHotel(yourName, yourRate, 3.2, 4, 4.4);
    final allHotels = [yourEntry, ...competitors.where((c) => c.name != yourName), ..._customComps];
    final sorted = [...allHotels]..sort((a, b) => b.rate.compareTo(a.rate));
    final avgComp = competitors.where((c) => c.name != yourName).map((c) => c.rate).reduce((a, b) => a + b) /
        competitors.where((c) => c.name != yourName).length;
    final suggestion = (avgComp * 1.02).roundToDouble();
    final position = sorted.indexWhere((h) => h.name == yourName) + 1;
    final rateMin = sorted.map((h) => h.rate).reduce((a, b) => a < b ? a : b) - 20;
    final rateMax = sorted.map((h) => h.rate).reduce((a, b) => a > b ? a : b) + 20;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(
        title: 'Comp Set Intelligence',
        sub: 'Fetched just now',
        right: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0x1A6366F1),
            border: Border.all(color: const Color(0x406366F1)),
            borderRadius: BorderRadius.circular(100),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 5, height: 5,
              decoration: const BoxDecoration(shape: BoxShape.circle, color: C.blue,
                boxShadow: [BoxShadow(color: C.blue, blurRadius: 6)])),
            const SizedBox(width: 6),
            Text('DEMO DATA', style: GoogleFonts.spaceMono(fontSize: 9, color: const Color(0xFF818CF8), letterSpacing: 1)),
          ]),
        ),
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
            KpiCard(label: 'Market Position', value: '#$position', sub: 'of ${sorted.length} properties', accent: C.gold, icon: '🏆'),
            KpiCard(label: 'Your Rate',       value: '\$${yourRate.toInt()}', sub: 'vs \$${avgComp.toInt()} comp avg',
              delta: yourRate > avgComp ? 2 : -2, accent: C.blue, icon: '💰'),
            KpiCard(label: 'AI Target Rate',  value: '\$${suggestion.toInt()}', sub: 'Optimal based on comp + demand', accent: C.green, icon: '🎯'),
            KpiCard(label: 'Rate Parity',
              value: yourRate <= avgComp + 10 && yourRate >= avgComp - 15 ? 'On Par' : yourRate > avgComp + 10 ? 'Premium' : 'Low',
              sub: '\$${(yourRate - avgComp).abs().toInt()} vs comp avg', delta: yourRate > avgComp ? 3 : -5, accent: C.purple, icon: '⭐'),
          ],
        );
      }),
      const SizedBox(height: 16),
      // Add competitor
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0x08FFFFFF),
          border: Border.all(color: const Color(0x12FFFFFF)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(children: [
          Row(children: [
            const Text('➕', style: TextStyle(fontSize: 18)),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Track a Competitor', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.text1)),
              Text('Manually add hotels to your comp set', style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
            ])),
            GestureDetector(
              onTap: () => setState(() => _showAddComp = !_showAddComp),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: const Color(0x0AFFFFFF),
                  border: Border.all(color: const Color(0x1AFFFFFF)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_showAddComp ? 'Cancel' : '+ Add',
                  style: GoogleFonts.spaceMono(fontSize: 11, color: C.text2)),
              ),
            ),
          ]),
          if (_showAddComp) ...[
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _newCompCtrl,
                  style: GoogleFonts.inter(fontSize: 12, color: C.text1),
                  decoration: const InputDecoration(hintText: 'Hotel name (e.g. The Meridian)'),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  if (_newCompCtrl.text.trim().isEmpty) return;
                  final rate = 180 + (DateTime.now().millisecondsSinceEpoch % 60).toDouble();
                  setState(() {
                    _customComps.add(CompHotel(_newCompCtrl.text.trim(), rate, 0, 4, 4.1));
                    _newCompCtrl.clear();
                    _showAddComp = false;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('Track', style: GoogleFonts.spaceMono(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
            ]),
          ],
        ]),
      ),
      const SizedBox(height: 16),
      // Competitors list
      if (_loading)
        const Center(child: CircularProgressIndicator(color: C.blue))
      else
        Column(children: sorted.asMap().entries.map((entry) {
          final i = entry.key;
          final c = entry.value;
          final isYou = c.name == yourName;
          final pct = ((c.rate - rateMin) / (rateMax - rateMin) * 100).clamp(5.0, 100.0);
          final vsAvg = (c.rate - avgComp).round();

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.fromLTRB(22, 16, 22, 16),
            decoration: BoxDecoration(
              color: isYou ? const Color(0x146366F1) : const Color(0x06FFFFFF),
              border: Border.all(color: isYou ? const Color(0x4D6366F1) : const Color(0x0FFFFFFF)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(children: [
              // Rank
              SizedBox(width: 26,
                child: Text('#${i + 1}',
                  style: GoogleFonts.spaceMono(fontSize: 12, color: i == 0 ? C.gold : C.text3, fontWeight: FontWeight.w700))),
              // Name
              Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(c.name,
                    style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w600,
                      color: isYou ? const Color(0xFFC7D2FE) : C.text1,
                    )),
                  if (isYou) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0x336366F1), borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text('YOU', style: GoogleFonts.spaceMono(fontSize: 9, color: const Color(0xFF818CF8), letterSpacing: 1)),
                    ),
                  ],
                ]),
                const SizedBox(height: 3),
                Text('${'★' * c.stars.toInt()}${'☆' * (5 - c.stars.toInt())} · ${c.score}',
                  style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
              ])),
              // Rate
              SizedBox(width: 90, child: Column(children: [
                Text('\$${c.rate.toInt()}',
                  style: GoogleFonts.syne(
                    fontSize: 28, fontWeight: FontWeight.w800,
                    color: isYou ? const Color(0xFF818CF8) : Colors.white, letterSpacing: -1,
                  )),
                Text(c.change > 0 ? '▲ ${c.change}%' : c.change < 0 ? '▼ ${c.change.abs()}%' : '— steady',
                  style: GoogleFonts.spaceMono(fontSize: 10,
                    color: c.change > 0 ? C.green : c.change < 0 ? C.red : C.text3)),
              ])),
              // vs avg
              SizedBox(width: 70, child: Column(children: [
                Text('VS AVG', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
                const SizedBox(height: 3),
                Text(vsAvg > 0 ? '+\$$vsAvg' : vsAvg < 0 ? '-\$${vsAvg.abs()}' : '—',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700,
                    color: vsAvg > 0 ? C.green : vsAvg < 0 ? C.red : C.text3)),
              ])),
              // AI target (your hotel)
              if (isYou)
                Container(
                  margin: const EdgeInsets.only(left: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: const Color(0x146366F1),
                    border: Border.all(color: const Color(0x386366F1)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(children: [
                    Text('AI TARGET', style: GoogleFonts.spaceMono(fontSize: 9, color: const Color(0xFF818CF8), letterSpacing: 1)),
                    const SizedBox(height: 3),
                    Text('\$${suggestion.toInt()}',
                      style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w800, color: const Color(0xFF818CF8))),
                  ]),
                ),
              // Rate bar
              Expanded(child: Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: pct / 100,
                      minHeight: 6,
                      backgroundColor: const Color(0x0FFFFFFF),
                      valueColor: AlwaysStoppedAnimation(
                        isYou ? C.blue : const Color(0x26FFFFFF),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('\$${rateMin.toInt()}', style: GoogleFonts.spaceMono(fontSize: 8, color: C.text4)),
                    Text('\$${rateMax.toInt()}', style: GoogleFonts.spaceMono(fontSize: 8, color: C.text4)),
                  ]),
                ]),
              )),
            ]),
          );
        }).toList()),
      const SizedBox(height: 16),
      // Rate trend chart
      CardContainer(
        title: 'Rate Trend — Last 7 Days',
        subtitle: 'Your hotel vs top competitors',
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
                    if (i < 0 || i >= rateHistory.length) return const SizedBox();
                    return Text(rateHistory[i].day, style: GoogleFonts.inter(fontSize: 10, color: C.text3));
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
              minX: 0, maxX: 6, minY: 140, maxY: 260,
              lineBarsData: [
                _line(rateHistory.map((d) => d.yourHotel).toList(), const Color(0xFF818CF8), 2.5, null),
                _line(rateHistory.map((d) => d.grandRegency).toList(), C.gold, 1.5, [4, 4]),
                _line(rateHistory.map((d) => d.meridian).toList(), C.purple, 1.5, [4, 4]),
                _line(rateHistory.map((d) => d.blueHarbor).toList(), C.orange, 1.5, [4, 4]),
              ],
            )),
          ),
          const SizedBox(height: 10),
          Wrap(spacing: 20, runSpacing: 6, children: [
            for (final x in [('Your Hotel', const Color(0xFF818CF8)), ('Grand Regency', C.gold),
              ('The Meridian', C.purple), ('Blue Harbor', C.orange)])
              Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 20, height: 2, color: x.$2),
                const SizedBox(width: 6),
                Text(x.$1, style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
              ]),
          ]),
        ]),
      ),
    ]);
  }

  LineChartBarData _line(List<double> data, Color color, double width, List<int>? dash) =>
      LineChartBarData(
        spots: data.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value)).toList(),
        isCurved: true, color: color, barWidth: width,
        dashArray: dash,
        dotData: const FlDotData(show: false),
      );
}
