import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../data/mock_data.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/section_header.dart';

class IntegrationsTab extends StatefulWidget {
  const IntegrationsTab({super.key});

  @override
  State<IntegrationsTab> createState() => _IntegrationsTabState();
}

class _IntegrationsTabState extends State<IntegrationsTab> {
  final Set<String> _connected = {};

  void _toggle(String id) {
    setState(() {
      if (_connected.contains(id)) _connected.remove(id);
      else _connected.add(id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().user;
    final totalConnected = _connected.length;
    final totalAvailable = pmsList.length + channelManagers.length + otaConnections.length;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(
        title: 'Integrations',
        sub: 'Connect your PMS, channel manager & OTA accounts to sync live data',
        live: false,
        right: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('CONNECTIONS', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
          const SizedBox(height: 2),
          RichText(text: TextSpan(children: [
            TextSpan(text: '$totalConnected',
              style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800,
                color: totalConnected > 0 ? C.green : C.text3)),
            TextSpan(text: ' / $totalAvailable',
              style: GoogleFonts.syne(fontSize: 14, color: C.text3)),
          ])),
        ]),
      ),
      const SizedBox(height: 20),
      if (user == null)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0x126366F1),
            border: Border.all(color: const Color(0x336366F1)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            const Text('🔒', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 14),
            Expanded(child: RichText(
              text: TextSpan(children: [
                TextSpan(text: 'Sign in ',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13)),
                TextSpan(text: 'to save your integration credentials and enable live data sync.',
                  style: GoogleFonts.inter(color: const Color(0xFF818CF8), fontSize: 13)),
              ]),
            )),
          ]),
        ),
      const SizedBox(height: 16),
      // Data flow
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 700 ? 3 : 1;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: cols == 3 ? 2.5 : 3,
          children: [
            for (final f in [
              ('📥', 'PMS → Hotel IQ', 'Reservations, rates, inventory & room type data sync automatically', C.blue),
              ('🔄', 'Channel Manager Sync', 'Rate changes you apply here push to all OTAs within seconds', C.purple),
              ('📊', 'OTA → Analytics', 'Review scores, rate visibility & pickup trends feed your dashboards', C.orange),
            ])
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [f.$4.withValues(alpha: 0.04), const Color(0xF2080A12)]),
                  border: Border.all(color: f.$4.withValues(alpha: 0.13)),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(f.$1, style: const TextStyle(fontSize: 22)),
                  const SizedBox(height: 8),
                  Text(f.$2, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: C.text1)),
                  const SizedBox(height: 4),
                  Text(f.$3, style: GoogleFonts.inter(fontSize: 11, color: C.text3, height: 1.6)),
                ]),
              ),
          ],
        );
      }),
      const SizedBox(height: 24),
      _IntegSection(
        title: 'Property Management Systems (PMS)',
        desc: 'Connect your PMS to pull live reservations, ADR, RevPAR and inventory',
        items: pmsList, connected: _connected, onToggle: _toggle, accent: C.blue,
      ),
      const SizedBox(height: 24),
      _IntegSection(
        title: 'Channel Managers',
        desc: 'Push rate changes to all OTAs simultaneously via your channel manager',
        items: channelManagers, connected: _connected, onToggle: _toggle, accent: C.purple,
      ),
      const SizedBox(height: 24),
      _IntegSection(
        title: 'OTA Direct Connections',
        desc: 'Connect OTAs directly for review data, rate visibility and booking pickup',
        items: otaConnections, connected: _connected, onToggle: _toggle, accent: C.orange,
      ),
      const SizedBox(height: 24),
      // API section
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [C.teal.withValues(alpha: 0.06), const Color(0xF2080A12)]),
          border: Border.all(color: C.teal.withValues(alpha: 0.2)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [C.teal.withValues(alpha: 0.8), Colors.transparent]),
            )),
          const SizedBox(height: 16),
          Text('Hotel IQ Inbound API',
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: C.text1)),
          const SizedBox(height: 4),
          Text('Push data from your own systems via REST',
            style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
          const SizedBox(height: 16),
          LayoutBuilder(builder: (_, c) {
            final wide = c.maxWidth > 600;
            return wide
                ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(child: _ApiLeft()),
                    const SizedBox(width: 16),
                    Expanded(child: _ApiRight()),
                  ])
                : Column(children: [_ApiLeft(), const SizedBox(height: 12), _ApiRight()]);
          }),
        ]),
      ),
    ]);
  }
}

class _IntegSection extends StatelessWidget {
  final String title, desc;
  final List<PmsItem> items;
  final Set<String> connected;
  final void Function(String) onToggle;
  final Color accent;

  const _IntegSection({
    required this.title, required this.desc,
    required this.items, required this.connected,
    required this.onToggle, required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final connectedCount = items.where((i) => connected.contains(i.id)).length;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 15, color: C.text1)),
          const SizedBox(height: 2),
          Text(desc, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.15),
            border: Border.all(color: accent.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(100),
          ),
          child: Text('$connectedCount/${items.length} CONNECTED',
            style: GoogleFonts.spaceMono(fontSize: 9, color: accent, letterSpacing: 1)),
        ),
      ]),
      const SizedBox(height: 12),
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 700 ? 2 : 1;
        return GridView.count(
          crossAxisCount: cols,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10, mainAxisSpacing: 10,
          childAspectRatio: cols == 2 ? 3.5 : 3.2,
          children: items.map((item) => _IntegCard(
            item: item,
            isConnected: connected.contains(item.id),
            onToggle: () => onToggle(item.id),
          )).toList(),
        );
      }),
    ]);
  }
}

class _IntegCard extends StatefulWidget {
  final PmsItem item;
  final bool isConnected;
  final VoidCallback onToggle;
  const _IntegCard({required this.item, required this.isConnected, required this.onToggle});

  @override
  State<_IntegCard> createState() => _IntegCardState();
}

class _IntegCardState extends State<_IntegCard> {
  bool _expanded = false;
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final statusColor  = widget.isConnected ? C.green  : C.text3;
    final statusBg     = widget.isConnected ? C.green.withValues(alpha: 0.1)  : const Color(0x08FFFFFF);
    final statusBorder = widget.isConnected ? C.green.withValues(alpha: 0.25) : const Color(0x12FFFFFF);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: const Alignment(-0.5, -1),
          end: const Alignment(0.5, 1),
          colors: widget.isConnected
              ? [const Color(0x0D10B981), const Color(0xF2080A12)]
              : [const Color(0xF20C0E16), const Color(0xF2080A12)],
        ),
        border: Border.all(color: statusBorder),
        borderRadius: BorderRadius.circular(14),
        boxShadow: widget.isConnected
            ? [BoxShadow(color: C.green.withValues(alpha: 0.08), blurRadius: 20)]
            : const [BoxShadow(color: Color(0x4D000000), blurRadius: 16)],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: widget.isConnected ? C.green.withValues(alpha: 0.12) : const Color(0x0DFFFFFF),
                border: Border.all(color: widget.isConnected ? C.green.withValues(alpha: 0.2) : const Color(0x0FFFFFFF)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(child: Text(widget.item.icon, style: const TextStyle(fontSize: 20))),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(widget.item.name,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: C.text1)),
              const SizedBox(height: 2),
              Text(widget.item.desc, style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
            ])),
            const SizedBox(width: 10),
            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusBg, border: Border.all(color: statusBorder),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 5, height: 5,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle, color: statusColor,
                    boxShadow: widget.isConnected ? [BoxShadow(color: C.green, blurRadius: 6)] : null,
                  )),
                const SizedBox(width: 5),
                Text(widget.isConnected ? 'CONNECTED' : 'NOT CONNECTED',
                  style: GoogleFonts.spaceMono(fontSize: 9, color: statusColor, letterSpacing: 1)),
              ]),
            ),
            const SizedBox(width: 8),
            // Connect btn
            GestureDetector(
              onTap: widget.isConnected
                  ? widget.onToggle
                  : () => setState(() => _expanded = !_expanded),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  gradient: widget.isConnected ? null : const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
                  border: widget.isConnected ? Border.all(color: const Color(0x14FFFFFF)) : null,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: widget.isConnected ? null : const [BoxShadow(color: Color(0x596366F1), blurRadius: 12)],
                ),
                child: Text(
                  widget.isConnected ? 'Disconnect' : _expanded ? 'Cancel ✕' : 'Connect →',
                  style: GoogleFonts.spaceMono(
                    fontSize: 11, fontWeight: FontWeight.w700,
                    color: widget.isConnected ? C.text3 : Colors.white,
                  ),
                ),
              ),
            ),
          ]),
          if (_expanded && !widget.isConnected) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0x33000000),
                border: Border(top: BorderSide(color: const Color(0x0FFFFFFF))),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('ENTER CREDENTIALS',
                  style: GoogleFonts.spaceMono(fontSize: 10, color: C.text3, letterSpacing: 1)),
                const SizedBox(height: 12),
                ...widget.item.fields.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(f.toUpperCase(),
                      style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
                    const SizedBox(height: 5),
                    TextField(
                      obscureText: f.toLowerCase().contains('password') ||
                          f.toLowerCase().contains('token') ||
                          f.toLowerCase().contains('key'),
                      style: GoogleFonts.inter(fontSize: 12, color: C.text1),
                      decoration: InputDecoration(hintText: f),
                    ),
                  ]),
                )),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: _saving ? null : () async {
                    setState(() => _saving = true);
                    await Future.delayed(const Duration(milliseconds: 1200));
                    if (mounted) { setState(() => _saving = false); widget.onToggle(); }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
                    decoration: BoxDecoration(
                      gradient: _saving
                          ? null
                          : const LinearGradient(colors: [C.green, Color(0xFF059669)]),
                      color: _saving ? C.green.withValues(alpha: 0.1) : null,
                      border: _saving ? Border.all(color: C.green.withValues(alpha: 0.3)) : null,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: _saving ? null : const [BoxShadow(color: Color(0x5910B981), blurRadius: 14)],
                    ),
                    child: Text(
                      _saving ? 'Testing connection…' : 'Test & Connect',
                      style: GoogleFonts.spaceMono(
                        fontSize: 11, fontWeight: FontWeight.w700,
                        color: _saving ? C.green : Colors.white,
                      ),
                    ),
                  ),
                ),
              ]),
            ),
          ],
        ]),
      ),
    );
  }
}

class _ApiLeft extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(
        'Use our inbound API to push occupancy, revenue and ADR from any source — custom PMS, spreadsheet automation, or internal BI.',
        style: GoogleFonts.inter(fontSize: 11, color: C.text3, height: 1.6),
      ),
      const SizedBox(height: 12),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0x4D000000),
          border: Border.all(color: const Color(0x12FFFFFF)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text('POST /api/property/metrics\nAuthorization: Bearer <your-jwt>',
          style: GoogleFonts.spaceMono(fontSize: 10, color: C.teal, letterSpacing: 0.5, height: 1.6)),
      ),
    ]);
  }
}

class _ApiRight extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('PAYLOAD EXAMPLE',
        style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
      const SizedBox(height: 8),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0x4D000000),
          border: Border.all(color: const Color(0x12FFFFFF)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          '{\n  "occupancy": 78,\n  "adr": 195,\n  "revpar": 152,\n  "revenueMtd": 89400\n}',
          style: GoogleFonts.spaceMono(fontSize: 10, color: C.text3, height: 1.8),
        ),
      ),
    ]);
  }
}
