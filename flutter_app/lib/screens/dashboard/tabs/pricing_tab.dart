import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../data/mock_data.dart';
import '../../../models/models.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/badge_widget.dart';
import '../../../widgets/card_container.dart';
import '../../../widgets/section_header.dart';

const _strategies = {
  'conservative': ('Conservative', 'Cautious adjustments, prioritize occupancy over rate', 0.6, C.blue),
  'balanced':     ('Balanced',     'AI-optimal mix of rate and occupancy growth',          1.0, C.green),
  'aggressive':   ('Aggressive',   'Maximize RevPAR, accept modest occupancy risk',         1.4, C.orange),
};

class PricingTab extends StatefulWidget {
  final void Function(String) setTab;
  const PricingTab({super.key, required this.setTab});

  @override
  State<PricingTab> createState() => _PricingTabState();
}

class _PricingTabState extends State<PricingTab> {
  String _strategy = 'balanced';
  bool _calView = false;
  RateCalendarDay? _selectedDay;
  Map<String, bool> _restrictions = {'ctaFri': false, 'ctaSat': false, 'ctdSun': true};
  int _minStay = 1;

  List<PricingRec> get _recs {
    final mult = _strategies[_strategy]!.$3;
    final rooms = context.read<AppProvider>().property?.roomRateMap ?? {};
    return pricingRecs.map((r) {
      final cur = rooms[r.roomId] ?? r.current;
      return PricingRec(
        id: r.id, roomId: r.roomId, room: r.room,
        current: cur,
        suggested: (cur + (r.suggested - r.current) * mult).roundToDouble(),
        reason: r.reason,
        impact: (r.impact * mult).round(),
        urgency: r.urgency, minStay: r.minStay,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final recs = _recs;
    final pending = recs.where((r) => !prov.applied.contains(r.id) && !prov.skipped.contains(r.id) && r.impact > 0).toList();
    final totalPending = pending.fold<int>(0, (s, r) => s + r.impact);
    final totalApplied = recs.where((r) => prov.applied.contains(r.id) && r.impact > 0).fold<int>(0, (s, r) => s + r.impact);
    final highRecs = recs.where((r) => r.urgency == 'high');
    final highApplied = highRecs.where((r) => prov.applied.contains(r.id)).length;
    final yieldScore = highRecs.isNotEmpty ? (60 + (highApplied / highRecs.length * 40)).round() : 60;
    final strat = _strategies[_strategy]!;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(
        title: 'Dynamic Pricing',
        sub: 'AI-generated recommendations based on demand, comp set & 90-day history',
        right: Row(children: [
          _YieldScore(score: yieldScore),
          if (totalPending > 0) ...[
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('PENDING OPP.', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
              const SizedBox(height: 3),
              Text('+\$$totalPending', style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.green)),
            ]),
          ],
        ]),
      ),
      const SizedBox(height: 20),
      // Strategy selector
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 700 ? 3 : 1;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: cols == 3 ? 3.5 : 4.5,
          children: _strategies.entries.map((e) {
            final active = _strategy == e.key;
            return GestureDetector(
              onTap: () => setState(() => _strategy = e.key),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: active ? e.value.$4.withValues(alpha: 0.12) : const Color(0x05FFFFFF),
                  border: Border.all(color: active ? e.value.$4.withValues(alpha: 0.3) : const Color(0x0FFFFFFF)),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: active ? [BoxShadow(color: e.value.$4.withValues(alpha: 0.13), blurRadius: 20)] : null,
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text(e.value.$1,
                      style: GoogleFonts.syne(
                        fontSize: 13, fontWeight: FontWeight.w700,
                        color: active ? e.value.$4 : C.text3,
                      )),
                    if (active)
                      Container(
                        width: 7, height: 7,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle, color: e.value.$4,
                          boxShadow: [BoxShadow(color: e.value.$4, blurRadius: 8)],
                        ),
                      ),
                  ]),
                  const SizedBox(height: 4),
                  Text(e.value.$2,
                    style: GoogleFonts.inter(fontSize: 11, color: C.text3, height: 1.4)),
                ]),
              ),
            );
          }).toList(),
        );
      }),
      const SizedBox(height: 16),
      // Toggle recs / calendar
      Row(children: [
        for (final entry in [('Recommendations', false), ('30-Day Calendar', true)])
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _calView = entry.$2),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                decoration: BoxDecoration(
                  color: _calView == entry.$2 ? const Color(0x266366F1) : Colors.transparent,
                  border: Border.all(
                    color: _calView == entry.$2 ? const Color(0x596366F1) : const Color(0x12FFFFFF),
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(entry.$1,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: _calView == entry.$2 ? const Color(0xFFC7D2FE) : C.text3,
                    fontWeight: _calView == entry.$2 ? FontWeight.w600 : FontWeight.w400,
                  )),
              ),
            ),
          ),
      ]),
      const SizedBox(height: 16),
      if (_calView)
        _RateCalendar(selectedDay: _selectedDay, onSelect: (d) => setState(() => _selectedDay = d == _selectedDay ? null : d), strategy: _strategy, strat: strat)
      else
        _RecsList(recs: recs, prov: prov),
      const SizedBox(height: 16),
      // Summary row
      Row(children: [
        if (totalPending > 0)
          Expanded(child: _SummaryCard(
            label: 'REMAINING OPPORTUNITY', value: '+\$$totalPending',
            sub: 'from ${pending.length} open rec${pending.length != 1 ? "s" : ""}',
            color: C.green,
            action: GestureDetector(
              onTap: () { for (final r in pending) prov.applyRec(r.id); },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: C.green.withValues(alpha: 0.14),
                  border: Border.all(color: C.green.withValues(alpha: 0.35)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('APPLY ALL', style: GoogleFonts.spaceMono(fontSize: 11, fontWeight: FontWeight.w700, color: C.green)),
              ),
            ),
          )),
        if (totalPending > 0 && totalApplied > 0) const SizedBox(width: 14),
        if (totalApplied > 0)
          Expanded(child: _SummaryCard(
            label: 'APPLIED REVENUE GAIN', value: '+\$$totalApplied',
            sub: 'from ${prov.applied.length} applied rec${prov.applied.length != 1 ? "s" : ""}',
            color: C.blue,
          )),
      ]),
      const SizedBox(height: 16),
      _RestrictionManager(minStay: _minStay, restrictions: _restrictions,
        onMinStay: (v) => setState(() => _minStay = v),
        onToggle: (k) => setState(() => _restrictions[k] = !_restrictions[k]!)),
    ]);
  }
}

class _YieldScore extends StatelessWidget {
  final int score;
  const _YieldScore({required this.score});

  @override
  Widget build(BuildContext context) {
    final color = score >= 80 ? C.green : score >= 65 ? C.gold : C.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0x08FFFFFF),
        border: Border.all(color: const Color(0x12FFFFFF)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(children: [
        Text('YIELD SCORE', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
        const SizedBox(height: 3),
        Text('$score', style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
      ]),
    );
  }
}

class _RecsList extends StatelessWidget {
  final List<PricingRec> recs;
  final AppProvider prov;
  const _RecsList({required this.recs, required this.prov});

  @override
  Widget build(BuildContext context) {
    return Column(children: recs.map((r) {
      final isApplied = prov.applied.contains(r.id);
      final isSkipped = prov.skipped.contains(r.id);
      return AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
        decoration: BoxDecoration(
          color: isApplied
              ? const Color(0x0A4ADE80)
              : isSkipped
                  ? const Color(0x03FFFFFF)
                  : const Color(0x08FFFFFF),
          border: Border.all(
            color: isApplied
                ? const Color(0x384ADE80)
                : isSkipped
                    ? const Color(0x0AFFFFFF)
                    : const Color(0x12FFFFFF),
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Opacity(
          opacity: isSkipped ? 0.5 : 1,
          child: LayoutBuilder(builder: (_, c) {
            final wide = c.maxWidth > 600;
            return wide
                ? Row(children: _recChildren(r, isApplied, isSkipped, prov))
                : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(r.room, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                    const SizedBox(height: 4),
                    Text(r.reason, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
                    const SizedBox(height: 12),
                    Row(children: [
                      _RateCell(label: 'CURRENT', value: '\$${r.current.toInt()}', color: Colors.white),
                      const Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('→', style: TextStyle(color: C.text4, fontSize: 20))),
                      _RateCell(label: isApplied ? 'APPLIED' : 'SUGGESTED', value: '\$${r.suggested.toInt()}', color: isApplied ? C.green : C.gold),
                      const SizedBox(width: 12),
                      UrgencyBadge(urgency: r.urgency),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      if (!isApplied && !isSkipped && r.urgency != 'low')
                        _RecBtn(label: 'APPLY', primary: true, onTap: () => prov.applyRec(r.id)),
                      if (isApplied)
                        _RecBtn(label: '✓ APPLIED', primary: false, green: true, onTap: () => prov.applyRec(r.id)),
                      const SizedBox(width: 8),
                      _RecBtn(label: isSkipped ? 'RESTORE' : 'SKIP', primary: false,
                        onTap: () => isSkipped ? prov.restoreRec(r.id) : prov.skipRec(r.id)),
                    ]),
                  ]);
          }),
        ),
      );
    }).toList());
  }

  List<Widget> _recChildren(PricingRec r, bool isApplied, bool isSkipped, AppProvider prov) {
    return [
      Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(r.room, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white,
          decoration: isSkipped ? TextDecoration.lineThrough : null)),
        const SizedBox(height: 3),
        Text(r.reason, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
        if (r.minStay != null && !isSkipped)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text('MIN STAY ${r.minStay}N RECOMMENDED',
              style: GoogleFonts.spaceMono(fontSize: 10, color: C.blue, letterSpacing: 0.5)),
          ),
        if (isApplied)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text('✓ RATE UPDATED',
              style: GoogleFonts.spaceMono(fontSize: 10, color: C.green, letterSpacing: 0.5)),
          ),
      ])),
      _RateCell(label: 'CURRENT', value: '\$${r.current.toInt()}', color: Colors.white),
      const Padding(padding: EdgeInsets.symmetric(horizontal: 12),
        child: Text('→', style: TextStyle(color: C.text4, fontSize: 20, fontWeight: FontWeight.w200))),
      _RateCell(label: isApplied ? 'APPLIED' : 'SUGGESTED', value: '\$${r.suggested.toInt()}',
        color: isApplied ? C.green : C.gold),
      SizedBox(width: 70, child: Column(children: [
        Text('IMPACT', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
        const SizedBox(height: 4),
        Text(r.impact > 0 ? '+\$${r.impact}' : r.impact < 0 ? '-\$${r.impact.abs()}' : '—',
          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700,
            color: r.impact > 0 ? C.green : r.impact < 0 ? C.red : C.text3)),
      ])),
      UrgencyBadge(urgency: r.urgency),
      const SizedBox(width: 12),
      Row(children: [
        if (!isApplied && !isSkipped && r.urgency != 'low')
          _RecBtn(label: 'APPLY', primary: true, onTap: () => prov.applyRec(r.id)),
        if (isApplied)
          _RecBtn(label: '✓ APPLIED', primary: false, green: true, onTap: () => prov.applyRec(r.id)),
        const SizedBox(width: 8),
        _RecBtn(label: isSkipped ? 'RESTORE' : 'SKIP', primary: false,
          onTap: () => isSkipped ? prov.restoreRec(r.id) : prov.skipRec(r.id)),
      ]),
    ];
  }
}

class _RateCell extends StatelessWidget {
  final String label, value;
  final Color color;
  const _RateCell({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text(label, style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
      const SizedBox(height: 4),
      Text(value, style: GoogleFonts.syne(fontSize: 26, fontWeight: FontWeight.w800, color: color, letterSpacing: -1)),
    ]);
  }
}

class _RecBtn extends StatelessWidget {
  final String label;
  final bool primary, green;
  final VoidCallback onTap;
  const _RecBtn({required this.label, required this.primary, this.green = false, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: primary ? const LinearGradient(colors: [C.green, Color(0xFF059669)]) : null,
          color: green
              ? C.green.withValues(alpha: 0.1)
              : primary ? null : Colors.transparent,
          border: primary ? null : Border.all(
            color: green ? C.green.withValues(alpha: 0.3) : const Color(0x14FFFFFF),
          ),
          borderRadius: BorderRadius.circular(8),
          boxShadow: primary ? const [BoxShadow(color: Color(0x5910B981), blurRadius: 12)] : null,
        ),
        child: Text(label,
          style: GoogleFonts.spaceMono(
            fontSize: 11, fontWeight: FontWeight.w700,
            color: primary ? Colors.white : green ? C.green : C.text3,
          )),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label, value, sub;
  final Color color;
  final Widget? action;
  const _SummaryCard({required this.label, required this.value, required this.sub, required this.color, this.action});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        border: Border.all(color: color.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: GoogleFonts.spaceMono(fontSize: 10, color: color, letterSpacing: 1)),
          Text(value, style: GoogleFonts.syne(fontSize: 28, fontWeight: FontWeight.w800, color: color)),
          Text(sub, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
        ])),
        if (action != null) action!,
      ]),
    );
  }
}

class _RateCalendar extends StatelessWidget {
  final RateCalendarDay? selectedDay;
  final void Function(RateCalendarDay) onSelect;
  final String strategy;
  final (String, String, double, Color) strat;

  const _RateCalendar({required this.selectedDay, required this.onSelect, required this.strategy, required this.strat});

  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: '30-Day Rate Optimization Calendar',
      subtitle: 'Strategy: ${strat.$1} — tap any day to see details',
      accent: strat.$4,
      child: Column(children: [
        // Day headers
        Row(children: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) =>
          Expanded(child: Center(
            child: Text(d, style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3)),
          ))).toList()),
        const SizedBox(height: 8),
        // Grid
        Wrap(
          children: [
            ...List.generate((DateTime.now().weekday - 1) % 7, (_) => const SizedBox(width: 0)),
            ...rateCalendar.map((d) {
              final isSelected = selectedDay?.day == d.day;
              final hasBigGap = d.gap > 20;
              return SizedBox(
                width: 1 / 7,
                child: LayoutBuilder(builder: (_, c) => SizedBox(
                  width: c.maxWidth,
                  child: GestureDetector(
                    onTap: () => onSelect(d),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      margin: const EdgeInsets.all(2),
                      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? strat.$4.withValues(alpha: 0.13)
                            : d.hasEvent
                                ? C.purple.withValues(alpha: 0.12)
                                : d.isWknd
                                    ? C.blue.withValues(alpha: 0.08)
                                    : hasBigGap
                                        ? C.green.withValues(alpha: 0.07)
                                        : const Color(0x05FFFFFF),
                        border: Border.all(
                          color: isSelected
                              ? strat.$4
                              : d.isToday
                                  ? C.blue.withValues(alpha: 0.6)
                                  : d.hasEvent
                                      ? C.purple.withValues(alpha: 0.35)
                                      : hasBigGap
                                          ? C.green.withValues(alpha: 0.3)
                                          : const Color(0x0FFFFFFF),
                          width: isSelected || d.isToday ? 1.5 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: isSelected ? [BoxShadow(color: strat.$4.withValues(alpha: 0.27), blurRadius: 12)] : null,
                      ),
                      child: Column(children: [
                        Text('${d.dow}${d.isToday ? "●" : ""}',
                          style: GoogleFonts.spaceMono(fontSize: 7, color: C.text3)),
                        Text('${d.day}', style: GoogleFonts.inter(fontSize: 10, color: C.text3)),
                        Text('\$${d.optimal.toInt()}',
                          style: GoogleFonts.syne(
                            fontSize: 12, fontWeight: FontWeight.w800,
                            color: d.hasEvent ? C.purple : hasBigGap ? C.green : C.text3,
                          )),
                        if (hasBigGap)
                          Text('+\$${d.gap.toInt()}',
                            style: GoogleFonts.spaceMono(fontSize: 7, color: C.green)),
                        if (d.hasEvent)
                          Text('EVT', style: GoogleFonts.spaceMono(fontSize: 7, color: C.purple)),
                      ]),
                    ),
                  ),
                )),
              );
            }),
          ],
        ),
        if (selectedDay != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [strat.$4.withValues(alpha: 0.1), const Color(0x4D000000)]),
              border: Border.all(color: strat.$4.withValues(alpha: 0.3)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(children: [
              for (final x in [
                ('DATE', selectedDay!.label, const Color(0xFFE2E8F0)),
                ('DEMAND', '${selectedDay!.demand.toInt()}%', selectedDay!.demand >= 80 ? C.green : C.gold),
                ('CURRENT', '\$${selectedDay!.current.toInt()}', const Color(0xFFE2E8F0)),
                ('OPTIMAL', '\$${selectedDay!.optimal.toInt()}', strat.$4),
                ('OPP.', '+\$${selectedDay!.gap.toInt()}', C.green),
              ])
                Expanded(child: Column(children: [
                  Text(x.$1, style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
                  const SizedBox(height: 3),
                  Text(x.$2, style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w800, color: x.$3)),
                ])),
              if (selectedDay!.hasEvent)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: C.purple.withValues(alpha: 0.12),
                    border: Border.all(color: C.purple.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('📍 EVENT', style: GoogleFonts.spaceMono(fontSize: 11, color: C.purple)),
                ),
            ]),
          ),
        ],
      ]),
    );
  }
}

class _RestrictionManager extends StatelessWidget {
  final int minStay;
  final Map<String, bool> restrictions;
  final void Function(int) onMinStay;
  final void Function(String) onToggle;

  const _RestrictionManager({
    required this.minStay,
    required this.restrictions,
    required this.onMinStay,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return CardContainer(
      title: 'Restriction Manager',
      subtitle: 'Control length-of-stay & arrival/departure rules',
      accent: C.purple,
      child: LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 600 ? 4 : 2;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: 2,
          children: [
            // Min Stay
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0x08FFFFFF),
                border: Border.all(color: const Color(0x12FFFFFF)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('MIN STAY (NIGHTS)',
                  style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
                const SizedBox(height: 10),
                Row(children: [
                  _StepBtn(label: '−', onTap: () => onMinStay((minStay - 1).clamp(1, 7))),
                  const SizedBox(width: 10),
                  Text('$minStay',
                    style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800,
                      color: minStay > 1 ? C.purple : C.text3)),
                  const SizedBox(width: 10),
                  _StepBtn(label: '+', onTap: () => onMinStay((minStay + 1).clamp(1, 7))),
                ]),
              ]),
            ),
            // Toggle switches
            for (final entry in [('ctaFri', 'CTA FRIDAY', 'Close to arrivals'),
              ('ctaSat', 'CTA SATURDAY', 'Close to arrivals'),
              ('ctdSun', 'CTD SUNDAY',  'Close to departures')])
              GestureDetector(
                onTap: () => onToggle(entry.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: restrictions[entry.$1] == true ? C.purple.withValues(alpha: 0.08) : const Color(0x05FFFFFF),
                    border: Border.all(
                      color: restrictions[entry.$1] == true ? C.purple.withValues(alpha: 0.3) : const Color(0x0FFFFFFF),
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(entry.$2,
                      style: GoogleFonts.spaceMono(fontSize: 9, letterSpacing: 1,
                        color: restrictions[entry.$1] == true ? C.purple : C.text3)),
                    const SizedBox(height: 4),
                    Text(entry.$3, style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
                    const SizedBox(height: 8),
                    _Toggle(on: restrictions[entry.$1] == true),
                  ]),
                ),
              ),
          ],
        );
      }),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _StepBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 28, height: 28,
      decoration: BoxDecoration(
        color: const Color(0x0DFFFFFF),
        border: Border.all(color: const Color(0x14FFFFFF)),
        borderRadius: BorderRadius.circular(7),
      ),
      child: Center(
        child: Text(label, style: const TextStyle(fontSize: 14, color: Colors.white)),
      ),
    ),
  );
}

class _Toggle extends StatelessWidget {
  final bool on;
  const _Toggle({required this.on});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 36, height: 20,
      decoration: BoxDecoration(
        gradient: on
            ? const LinearGradient(colors: [C.purple, C.blue])
            : null,
        color: on ? null : const Color(0x14FFFFFF),
        border: Border.all(color: on ? C.purple.withValues(alpha: 0.5) : const Color(0x1AFFFFFF)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Stack(children: [
        AnimatedPositioned(
          duration: const Duration(milliseconds: 200),
          top: 2, left: on ? 18 : 2,
          child: Container(
            width: 14, height: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: on ? Colors.white : const Color(0xFF334155),
            ),
          ),
        ),
      ]),
    );
  }
}
