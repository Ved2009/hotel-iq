import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../models/models.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/card_container.dart';
import '../../../widgets/section_header.dart';

class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key});
  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  // Profile
  final _hotelName  = TextEditingController();
  final _location   = TextEditingController();
  final _stars      = TextEditingController();
  final _totalRooms = TextEditingController();

  // Metrics
  final _occupancy  = TextEditingController();
  final _adr        = TextEditingController();
  final _revpar     = TextEditingController();
  final _trevpar    = TextEditingController();
  final _goppar     = TextEditingController();
  final _revMtd     = TextEditingController();
  final _roomRevMtd = TextEditingController();
  final _fbRevMtd   = TextEditingController();
  final _profitMtd  = TextEditingController();

  bool _savingProfile = false;
  bool _savingMetrics = false;
  String? _profileMsg;
  String? _metricsMsg;
  bool _synced = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _sync());
  }

  void _sync() {
    if (_synced) return;
    final prov = context.read<AppProvider>();
    final prof = prov.property?.profile;
    final met  = prov.property?.metrics;
    if (prof != null) {
      _hotelName.text  = prof.hotelName;
      _location.text   = prof.location;
      _stars.text      = '${prof.stars}';
      _totalRooms.text = '${prof.totalRooms}';
    } else if (prov.user != null) {
      _hotelName.text = prov.user!.hotelName;
    }
    if (met != null) {
      _occupancy.text  = met.occupancy  != null ? '${met.occupancy!.toStringAsFixed(1)}' : '';
      _adr.text        = met.adr        != null ? '${met.adr!.toInt()}' : '';
      _revpar.text     = met.revpar     != null ? '${met.revpar!.toInt()}' : '';
      _trevpar.text    = met.trevpar    != null ? '${met.trevpar!.toInt()}' : '';
      _goppar.text     = met.goppar     != null ? '${met.goppar!.toInt()}' : '';
      _revMtd.text     = met.revenueMtd != null ? '${met.revenueMtd!.toInt()}' : '';
      _roomRevMtd.text = met.roomRevenueMtd != null ? '${met.roomRevenueMtd!.toInt()}' : '';
      _fbRevMtd.text   = met.fbRevenueMtd   != null ? '${met.fbRevenueMtd!.toInt()}' : '';
      _profitMtd.text  = met.profitMtd      != null ? '${met.profitMtd!.toInt()}' : '';
    }
    _synced = true;
  }

  @override
  void dispose() {
    for (final c in [_hotelName, _location, _stars, _totalRooms,
      _occupancy, _adr, _revpar, _trevpar, _goppar, _revMtd, _roomRevMtd, _fbRevMtd, _profitMtd]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _saveProfile() async {
    final prov = context.read<AppProvider>();
    if (prov.user == null) return;

    setState(() { _savingProfile = true; _profileMsg = null; });

    final profile = HotelProfile(
      hotelName:  _hotelName.text.trim().isEmpty ? prov.user!.hotelName : _hotelName.text.trim(),
      location:   _location.text.trim(),
      stars:      int.tryParse(_stars.text.trim()) ?? 4,
      totalRooms: int.tryParse(_totalRooms.text.trim()) ?? 100,
    );

    final res = await prov.api.updateProfile(profile);
    if (!mounted) return;

    if (res.ok) {
      prov.updatePropertyProfile(profile);
      setState(() { _savingProfile = false; _profileMsg = 'saved'; });
    } else {
      setState(() { _savingProfile = false; _profileMsg = 'error:${res.error}'; });
    }
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _profileMsg = null);
    });
  }

  Future<void> _saveMetrics() async {
    final prov = context.read<AppProvider>();
    if (prov.user == null) return;

    setState(() { _savingMetrics = true; _metricsMsg = null; });

    final body = <String, dynamic>{};
    double? tryParse(String s) => s.trim().isEmpty ? null : double.tryParse(s.trim());

    if (tryParse(_occupancy.text)  != null) body['occupancy']      = tryParse(_occupancy.text);
    if (tryParse(_adr.text)        != null) body['adr']            = tryParse(_adr.text);
    if (tryParse(_revpar.text)     != null) body['revpar']         = tryParse(_revpar.text);
    if (tryParse(_trevpar.text)    != null) body['trevpar']        = tryParse(_trevpar.text);
    if (tryParse(_goppar.text)     != null) body['goppar']         = tryParse(_goppar.text);
    if (tryParse(_revMtd.text)     != null) body['revenueMtd']     = tryParse(_revMtd.text);
    if (tryParse(_roomRevMtd.text) != null) body['roomRevenueMtd'] = tryParse(_roomRevMtd.text);
    if (tryParse(_fbRevMtd.text)   != null) body['fbRevenueMtd']   = tryParse(_fbRevMtd.text);
    if (tryParse(_profitMtd.text)  != null) body['profitMtd']      = tryParse(_profitMtd.text);

    if (body.isEmpty) {
      setState(() { _savingMetrics = false; _metricsMsg = 'empty'; });
      return;
    }

    final res = await prov.api.updateMetrics(body);
    if (!mounted) return;

    if (res.ok) {
      prov.updatePropertyMetrics(res.data!);
      setState(() { _savingMetrics = false; _metricsMsg = 'saved'; });
    } else {
      setState(() { _savingMetrics = false; _metricsMsg = 'error:${res.error}'; });
    }
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _metricsMsg = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final user = prov.user;
    final met  = prov.property?.metrics;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionHeader(title: 'Settings', sub: 'Property profile, KPIs & account', live: false),
      const SizedBox(height: 24),

      // Account card
      CardContainer(
        title: 'Account',
        child: Row(children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.violet, C.purple]),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 24)],
            ),
            child: Center(child: Text(user?.initials ?? 'H',
              style: GoogleFonts.syne(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white))),
          ),
          const SizedBox(width: 24),
          Expanded(child: LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth > 400 ? 2 : 1;
            return GridView.count(
              crossAxisCount: cols, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16, mainAxisSpacing: 10,
              childAspectRatio: 4,
              children: [
                _InfoCell('Name', '${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim().isEmpty ? '—' : '${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim()),
                _InfoCell('Hotel', user?.hotelName ?? '—'),
                _InfoCell('Email', user?.email ?? '—'),
                _InfoCell('Member since', _fmtDate(user?.createdAt)),
              ],
            );
          })),
        ]),
      ),
      const SizedBox(height: 16),

      // Property profile
      CardContainer(
        title: 'Property Profile',
        subtitle: 'Basic hotel information',
        accent: C.violet,
        child: Column(children: [
          LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth > 500 ? 2 : 1;
            return GridView.count(
              crossAxisCount: cols, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16, mainAxisSpacing: 14,
              childAspectRatio: cols == 2 ? 4.5 : 5,
              children: [
                _Field('Hotel Name',   _hotelName,  'The Grand Coastal'),
                _Field('Location',     _location,   'Miami Beach, FL'),
                _Field('Star Rating',  _stars,      '4', type: TextInputType.number),
                _Field('Total Rooms',  _totalRooms, '120', type: TextInputType.number),
              ],
            );
          }),
          const SizedBox(height: 20),
          _SaveRow(saving: _savingProfile, msg: _profileMsg, hasUser: user != null, onSave: _saveProfile),
        ]),
      ),
      const SizedBox(height: 16),

      // KPIs
      CardContainer(
        title: "Today's KPIs",
        subtitle: met?.hasData == true
            ? 'Last updated ${_timeAgo(met!.updatedAt!)} — changes update your dashboard immediately'
            : 'Enter your current numbers to power AI recommendations',
        accent: C.green,
        child: Column(children: [
          if (met?.hasData != true)
            Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: C.violet.withValues(alpha: 0.08),
                border: Border.all(color: C.violet.withValues(alpha: 0.2)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Text('💡', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 12),
                Expanded(child: Text(
                  'Filling in these numbers unlocks real AI pricing recommendations for your property.',
                  style: GoogleFonts.inter(fontSize: 13, color: C.text2, height: 1.5),
                )),
              ]),
            ),
          LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth > 600 ? 3 : 2;
            return GridView.count(
              crossAxisCount: cols, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 14, mainAxisSpacing: 14,
              childAspectRatio: cols == 3 ? 3.8 : 3.2,
              children: [
                _Field('Occupancy (%)',     _occupancy,  '73',    type: TextInputType.number),
                _Field('ADR (\$)',          _adr,        '195',   type: TextInputType.number),
                _Field('RevPAR (\$)',       _revpar,     '142',   type: TextInputType.number),
                _Field('TRevPAR (\$)',      _trevpar,    '168',   type: TextInputType.number),
                _Field('GOPPAR (\$)',       _goppar,     '89',    type: TextInputType.number),
                _Field('Revenue MTD (\$)',  _revMtd,     '89400', type: TextInputType.number),
                _Field('Room Rev MTD (\$)', _roomRevMtd, '71500', type: TextInputType.number),
                _Field('F&B Rev MTD (\$)',  _fbRevMtd,   '17900', type: TextInputType.number),
                _Field('Profit MTD (\$)',   _profitMtd,  '47000', type: TextInputType.number),
              ],
            );
          }),
          const SizedBox(height: 20),
          _SaveRow(saving: _savingMetrics, msg: _metricsMsg, hasUser: user != null, onSave: _saveMetrics),
        ]),
      ),
      const SizedBox(height: 16),

      // Sign out
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: C.red.withValues(alpha: 0.04),
          border: Border.all(color: C.red.withValues(alpha: 0.15)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Sign Out', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: C.red)),
            const SizedBox(height: 2),
            Text('You will be returned to the landing page',
              style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
          ]),
          GestureDetector(
            onTap: () => context.read<AppProvider>().logout(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
              decoration: BoxDecoration(
                color: C.red.withValues(alpha: 0.1),
                border: Border.all(color: C.red.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('Sign Out',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.red)),
            ),
          ),
        ]),
      ),
    ]);
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _InfoCell extends StatelessWidget {
  final String label, value;
  const _InfoCell(this.label, this.value);
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Text(label.toUpperCase(),
        style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4, letterSpacing: 1.5)),
      const SizedBox(height: 4),
      Text(value, style: GoogleFonts.inter(fontSize: 14, color: C.text1, fontWeight: FontWeight.w500),
        overflow: TextOverflow.ellipsis),
    ],
  );
}

class _Field extends StatelessWidget {
  final String label, hint;
  final TextEditingController ctrl;
  final TextInputType? type;
  const _Field(this.label, this.ctrl, this.hint, {this.type});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Text(label.toUpperCase(),
        style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1.5)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl, keyboardType: type,
        style: GoogleFonts.inter(fontSize: 13, color: C.text1),
        decoration: InputDecoration(hintText: hint),
      ),
    ],
  );
}

class _SaveRow extends StatelessWidget {
  final bool saving, hasUser;
  final String? msg;
  final VoidCallback onSave;
  const _SaveRow({required this.saving, required this.msg, required this.hasUser, required this.onSave});

  @override
  Widget build(BuildContext context) {
    final isSaved  = msg == 'saved';
    final isEmpty  = msg == 'empty';
    final isError  = msg != null && msg!.startsWith('error');
    final errText  = isError ? msg!.replaceFirst('error:', '') : null;

    return Row(children: [
      GestureDetector(
        onTap: hasUser && !saving ? onSave : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 11),
          decoration: BoxDecoration(
            gradient: hasUser && !saving
                ? const LinearGradient(colors: [C.violet, C.violetDark])
                : null,
            color: hasUser && !saving ? null : C.glass,
            borderRadius: BorderRadius.circular(10),
            boxShadow: hasUser && !saving
                ? [BoxShadow(color: C.violet.withValues(alpha: 0.4), blurRadius: 16)]
                : null,
          ),
          child: Text(saving ? 'Saving…' : 'Save Changes',
            style: GoogleFonts.inter(
              fontSize: 13, fontWeight: FontWeight.w600,
              color: hasUser && !saving ? Colors.white : C.text4,
            )),
        ),
      ),
      const SizedBox(width: 14),
      if (isSaved)
        Row(children: [
          Container(width: 20, height: 20,
            decoration: BoxDecoration(shape: BoxShape.circle, color: C.green.withValues(alpha: 0.15)),
            child: const Center(child: Text('✓', style: TextStyle(fontSize: 11, color: C.green)))),
          const SizedBox(width: 6),
          Text('Saved — dashboard updated',
            style: GoogleFonts.inter(fontSize: 13, color: C.green, fontWeight: FontWeight.w500)),
        ])
      else if (isEmpty)
        Text('Enter at least one value', style: GoogleFonts.inter(fontSize: 13, color: C.orange))
      else if (isError)
        Text('Error: ${errText ?? 'Try again'}', style: GoogleFonts.inter(fontSize: 13, color: C.red))
      else if (!hasUser)
        Text('Sign in to save', style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
    ]);
  }
}

String _fmtDate(String? iso) {
  if (iso == null) return '—';
  try {
    final d = DateTime.parse(iso);
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${m[d.month-1]} ${d.day}, ${d.year}';
  } catch (_) { return '—'; }
}

String _timeAgo(String iso) {
  try {
    final diff = DateTime.now().difference(DateTime.parse(iso));
    if (diff.inMinutes < 2) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  } catch (_) { return 'recently'; }
}
