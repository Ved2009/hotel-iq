import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
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
  final _hotelName  = TextEditingController();
  final _location   = TextEditingController();
  final _stars      = TextEditingController();
  final _totalRooms = TextEditingController();
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _sync());
  }

  void _sync() {
    final prov = context.read<AppProvider>();
    final prof = prov.property?.profile;
    final met  = prov.property?.metrics;
    if (prof != null) {
      _hotelName.text  = prof.hotelName;
      _location.text   = prof.location;
      _stars.text      = '${prof.stars}';
      _totalRooms.text = '${prof.totalRooms}';
    }
    if (met != null) {
      if (met.occupancy != null) _occupancy.text  = '${met.occupancy!.toInt()}';
      if (met.adr != null)       _adr.text        = '${met.adr!.toInt()}';
      if (met.revpar != null)    _revpar.text     = '${met.revpar!.toInt()}';
      if (met.trevpar != null)   _trevpar.text    = '${met.trevpar!.toInt()}';
      if (met.goppar != null)    _goppar.text     = '${met.goppar!.toInt()}';
      if (met.revenueMtd != null) _revMtd.text   = '${met.revenueMtd!.toInt()}';
      if (met.roomRevenueMtd != null) _roomRevMtd.text = '${met.roomRevenueMtd!.toInt()}';
      if (met.fbRevenueMtd != null) _fbRevMtd.text    = '${met.fbRevenueMtd!.toInt()}';
      if (met.profitMtd != null) _profitMtd.text  = '${met.profitMtd!.toInt()}';
    }
  }

  @override
  void dispose() {
    for (final c in [_hotelName, _location, _stars, _totalRooms, _occupancy,
      _adr, _revpar, _trevpar, _goppar, _revMtd, _roomRevMtd, _fbRevMtd, _profitMtd]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _saveProfile() async {
    final prov = context.read<AppProvider>();
    if (prov.user == null) return;
    setState(() { _savingProfile = true; _profileMsg = null; });
    // TODO: call api.updateProfile
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) setState(() { _savingProfile = false; _profileMsg = 'saved'; });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _profileMsg = null);
    });
  }

  Future<void> _saveMetrics() async {
    final prov = context.read<AppProvider>();
    if (prov.user == null) return;
    setState(() { _savingMetrics = true; _metricsMsg = null; });
    // TODO: call api.updateMetrics
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) setState(() { _savingMetrics = false; _metricsMsg = 'saved'; });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _metricsMsg = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final user = prov.user;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionHeader(title: 'Settings', sub: 'Manage your account, property and data', live: false),
      const SizedBox(height: 20),
      // Account
      CardContainer(
        title: 'Account',
        child: Row(children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.blue, C.purple]),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [BoxShadow(color: Color(0x666366F1), blurRadius: 24)],
            ),
            child: Center(
              child: Text((user?.initials ?? 'H'),
                style: GoogleFonts.syne(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
            ),
          ),
          const SizedBox(width: 22),
          Expanded(child: LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth > 400 ? 2 : 1;
            return GridView.count(
              crossAxisCount: cols,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16, mainAxisSpacing: 8,
              childAspectRatio: 3.5,
              children: [
                for (final x in [
                  ('Name', '${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim().isEmpty ? '—' : '${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim()),
                  ('Hotel', user?.hotelName ?? '—'),
                  ('Email', user?.email ?? '—'),
                  ('Member Since', user?.createdAt != null ? _formatDate(user!.createdAt!) : '—'),
                ])
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(x.$1.toUpperCase(),
                      style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1.5)),
                    const SizedBox(height: 5),
                    Text(x.$2, style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFDDDDDD), fontWeight: FontWeight.w500)),
                  ]),
              ],
            );
          })),
        ]),
      ),
      const SizedBox(height: 16),
      // Property setup
      CardContainer(
        title: 'Property Setup',
        subtitle: 'Configure your hotel details',
        child: Column(children: [
          LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth > 500 ? 2 : 1;
            return GridView.count(
              crossAxisCount: cols,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 14, mainAxisSpacing: 14,
              childAspectRatio: cols == 2 ? 4 : 5,
              children: [
                _SettingsField(label: 'Hotel Name',  ctrl: _hotelName,  hint: 'e.g. Grand Coastal Hotel'),
                _SettingsField(label: 'Location',    ctrl: _location,   hint: 'e.g. Miami Beach, FL'),
                _SettingsField(label: 'Star Rating', ctrl: _stars,      hint: '4', type: TextInputType.number),
                _SettingsField(label: 'Total Rooms', ctrl: _totalRooms, hint: '292', type: TextInputType.number),
              ],
            );
          }),
          _SaveBtn(saving: _savingProfile, msg: _profileMsg, hasUser: user != null, onSave: _saveProfile),
        ]),
      ),
      const SizedBox(height: 16),
      // KPI entry
      CardContainer(
        title: "Today's KPIs",
        subtitle: 'Enter your current metrics to power the dashboard',
        child: Column(children: [
          LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth > 600 ? 3 : 2;
            return GridView.count(
              crossAxisCount: cols,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 14, mainAxisSpacing: 14,
              childAspectRatio: cols == 3 ? 3.5 : 3,
              children: [
                _SettingsField(label: 'Occupancy (%)',    ctrl: _occupancy,  hint: '73',    type: TextInputType.number),
                _SettingsField(label: 'ADR (\$)',         ctrl: _adr,        hint: '195',   type: TextInputType.number),
                _SettingsField(label: 'RevPAR (\$)',      ctrl: _revpar,     hint: '142',   type: TextInputType.number),
                _SettingsField(label: 'TRevPAR (\$)',     ctrl: _trevpar,    hint: '168',   type: TextInputType.number),
                _SettingsField(label: 'GOPPAR (\$)',      ctrl: _goppar,     hint: '89',    type: TextInputType.number),
                _SettingsField(label: 'Revenue MTD (\$)', ctrl: _revMtd,    hint: '89400', type: TextInputType.number),
                _SettingsField(label: 'Room Rev MTD (\$)',ctrl: _roomRevMtd, hint: '71500', type: TextInputType.number),
                _SettingsField(label: 'F&B Rev MTD (\$)', ctrl: _fbRevMtd,  hint: '17900', type: TextInputType.number),
                _SettingsField(label: 'Profit MTD (\$)',  ctrl: _profitMtd, hint: '47000', type: TextInputType.number),
              ],
            );
          }),
          _SaveBtn(saving: _savingMetrics, msg: _metricsMsg, hasUser: user != null, onSave: _saveMetrics),
        ]),
      ),
      const SizedBox(height: 16),
      // Sign out
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: const Color(0x0AF87171),
          border: Border.all(color: const Color(0x26F87171)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Sign Out', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.red)),
            const SizedBox(height: 2),
            Text('End your current session', style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
          ]),
          GestureDetector(
            onTap: () => context.read<AppProvider>().logout(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
              decoration: BoxDecoration(
                color: const Color(0x1AF87171),
                border: Border.all(color: const Color(0x4DF87171)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('Sign Out',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: C.red)),
            ),
          ),
        ]),
      ),
    ]);
  }
}

class _SettingsField extends StatelessWidget {
  final String label;
  final TextEditingController ctrl;
  final String hint;
  final TextInputType? type;

  const _SettingsField({required this.label, required this.ctrl, required this.hint, this.type});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label.toUpperCase(),
        style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1.5)),
      const SizedBox(height: 6),
      TextField(
        controller: ctrl,
        keyboardType: type,
        style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
        decoration: InputDecoration(hintText: hint),
      ),
    ]);
  }
}

class _SaveBtn extends StatelessWidget {
  final bool saving, hasUser;
  final String? msg;
  final VoidCallback onSave;

  const _SaveBtn({required this.saving, required this.msg, required this.hasUser, required this.onSave});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Row(children: [
        GestureDetector(
          onTap: hasUser && !saving ? onSave : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
            decoration: BoxDecoration(
              gradient: hasUser
                  ? const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)])
                  : null,
              color: hasUser ? null : const Color(0x0DFFFFFF),
              borderRadius: BorderRadius.circular(8),
              boxShadow: hasUser ? const [BoxShadow(color: Color(0x666366F1), blurRadius: 14)] : null,
            ),
            child: Text(saving ? 'SAVING…' : 'SAVE CHANGES',
              style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ),
        const SizedBox(width: 12),
        if (msg == 'saved')
          Text('✓ Saved', style: GoogleFonts.spaceMono(fontSize: 12, color: C.green)),
        if (msg == 'error')
          Text('✕ Error', style: GoogleFonts.spaceMono(fontSize: 12, color: C.red)),
        if (!hasUser)
          Text('Sign in to save', style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
      ]),
    );
  }
}

String _formatDate(String iso) {
  try {
    final d = DateTime.parse(iso);
    const months = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    return '${months[d.month-1]} ${d.day}, ${d.year}';
  } catch (_) { return '—'; }
}
