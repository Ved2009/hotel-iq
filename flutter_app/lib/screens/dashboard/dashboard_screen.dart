import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/dot_grid.dart';
import '../auth_screen.dart';
import 'tabs/overview_tab.dart';
import 'tabs/pricing_tab.dart';
import 'tabs/forecast_tab.dart';
import 'tabs/compset_tab.dart';
import 'tabs/calendar_tab.dart';
import 'tabs/reports_tab.dart';
import 'tabs/settings_tab.dart';
import 'tabs/ai_analyst_tab.dart';
import 'tabs/admin_tab.dart';

// Navigation structure
const _navGroups = [
  ('CORE', [
    ('overview',  'Overview',     '◈', 'Revenue at a glance'),
    ('pricing',   'Pricing',      '◇', 'AI rate recommendations'),
    ('forecast',  'Forecast',     '⟁', '14-day demand outlook'),
  ]),
  ('INTELLIGENCE', [
    ('compset',   'Comp Set',     '⊞', 'Competitor rates'),
    ('ai',        'AI Analyst',   '✦', 'Revenue intelligence'),
  ]),
  ('MANAGE', [
    ('calendar',  'Calendar',     '▦', 'Monthly revenue view'),
    ('reports',   'Reports',      '≡', 'Download reports'),
    ('settings',  'Settings',     '◎', 'Property & account'),
    ('admin',     'Admin',        '⊛', 'User management'),
  ]),
];

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _tab = 'overview';
  late final Stream<DateTime> _clock;

  @override
  void initState() {
    super.initState();
    _clock = Stream.periodic(const Duration(seconds: 1), (_) => DateTime.now());
  }

  void _setTab(String t) => setState(() => _tab = t);

  void _showAuth(String tab) => showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.9),
    builder: (_) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(20),
      child: AuthScreen(isModal: true, initialTab: tab, onClose: () => Navigator.pop(context)),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.bg,
      body: DotGridBackground(
        child: Column(children: [
          _Header(clock: _clock, onShowAuth: _showAuth),
          if (context.watch<AppProvider>().view == AppView.demo)
            _DemoBanner(onSignUp: () => _showAuth('register'), onExit: context.read<AppProvider>().exitDemo),
          Expanded(
            child: LayoutBuilder(builder: (_, c) {
              if (c.maxWidth > 900) {
                return Row(children: [
                  _Sidebar(active: _tab, setTab: _setTab),
                  Expanded(child: _Body(tab: _tab, setTab: _setTab, showAuth: _showAuth)),
                ]);
              }
              return Column(children: [
                Expanded(child: _Body(tab: _tab, setTab: _setTab, showAuth: _showAuth)),
                _BottomNav(active: _tab, setTab: _setTab),
              ]);
            }),
          ),
        ]),
      ),
    );
  }
}

// ── Demo Banner ───────────────────────────────────────────────────────────────

class _DemoBanner extends StatelessWidget {
  final VoidCallback onSignUp, onExit;
  const _DemoBanner({required this.onSignUp, required this.onExit});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
    decoration: const BoxDecoration(
      gradient: LinearGradient(colors: [Color(0xFF2D1B69), Color(0xFF1A0D3D)]),
      border: Border(bottom: BorderSide(color: Color(0x4D7C3AED))),
    ),
    child: Row(children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
          color: C.gold.withValues(alpha: 0.15),
          border: Border.all(color: C.gold.withValues(alpha: 0.4)),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text('LIVE DEMO', style: GoogleFonts.spaceMono(fontSize: 9, color: C.gold, letterSpacing: 1.5, fontWeight: FontWeight.w700)),
      ),
      const SizedBox(width: 14),
      Expanded(
        child: Text(
          'You\'re viewing a live demo with sample data. Sign up to connect your property and get real AI pricing recommendations.',
          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFD4C6FF)),
        ),
      ),
      const SizedBox(width: 14),
      GestureDetector(
        onTap: onSignUp,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 12)],
          ),
          child: Text('Get My Account →', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
        ),
      ),
      const SizedBox(width: 10),
      GestureDetector(
        onTap: onExit,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(border: Border.all(color: const Color(0x337C3AED)), borderRadius: BorderRadius.circular(8)),
          child: Text('← Back', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF9F8FEF))),
        ),
      ),
    ]),
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final Stream<DateTime> clock;
  final void Function(String) onShowAuth;
  const _Header({required this.clock, required this.onShowAuth});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final user = prov.user;

    return LayoutBuilder(builder: (_, c) {
      final narrow = c.maxWidth < 640;
      return Container(
        height: 62,
        decoration: BoxDecoration(
          color: C.bg.withValues(alpha: 0.95),
          border: const Border(bottom: BorderSide(color: C.border)),
        ),
        padding: EdgeInsets.symmetric(horizontal: narrow ? 12 : 24),
        child: Row(children: [
          // Logo
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
              borderRadius: BorderRadius.circular(10),
              boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 14)],
            ),
            child: Center(child: Text('IQ',
              style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white))),
          ),
          const SizedBox(width: 12),
          if (!narrow)
            RichText(text: TextSpan(children: [
              TextSpan(text: 'Hotel', style: GoogleFonts.syne(fontSize: 17, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -0.5)),
              TextSpan(text: 'IQ', style: GoogleFonts.syne(fontSize: 17, fontWeight: FontWeight.w800, color: C.gold, letterSpacing: -0.5)),
            ])),
          if (user != null && !narrow) ...[
            const SizedBox(width: 16),
            Container(width: 1, height: 16, color: C.border),
            const SizedBox(width: 16),
            Flexible(child: Text(user.hotelName.toUpperCase(),
              maxLines: 1, overflow: TextOverflow.ellipsis,
              style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4, letterSpacing: 2))),
          ],
          const Spacer(),
          // Clock — hidden on narrow screens, not essential
          if (!narrow) ...[
            StreamBuilder<DateTime>(
              stream: clock,
              builder: (_, s) {
                final t = s.data ?? DateTime.now();
                return Text(
                  '${t.hour.toString().padLeft(2,'0')}:${t.minute.toString().padLeft(2,'0')}:${t.second.toString().padLeft(2,'0')}',
                  style: GoogleFonts.spaceMono(fontSize: 11, color: C.text4, letterSpacing: 0.5),
                );
              },
            ),
            const SizedBox(width: 20),
          ],
          // User area
          if (user != null) ...[
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.violet, C.purple]),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.4), blurRadius: 10)],
              ),
              child: Center(child: Text(user.initials,
                style: GoogleFonts.syne(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white))),
            ),
            if (!narrow) ...[
              const SizedBox(width: 10),
              Text(user.firstName,
                style: GoogleFonts.inter(fontSize: 13, color: C.text2, fontWeight: FontWeight.w500)),
            ],
            const SizedBox(width: 10),
            narrow
                ? GestureDetector(
                    onTap: () => context.read<AppProvider>().logout(),
                    child: Text('↩', style: GoogleFonts.inter(fontSize: 16, color: C.text3)),
                  )
                : _HeaderBtn('Sign Out', () => context.read<AppProvider>().logout()),
          ] else ...[
            _HeaderBtn('Sign In', () => onShowAuth('login'), outlined: true),
            const SizedBox(width: 8),
            narrow ? _HeaderBtn('Start', () => onShowAuth('register')) : _PrimaryHeaderBtn('Get Started', () => onShowAuth('register')),
          ],
        ]),
      );
    });
  }
}

class _HeaderBtn extends StatelessWidget {
  final String label; final VoidCallback onTap; final bool outlined;
  const _HeaderBtn(this.label, this.onTap, {this.outlined = false});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        border: Border.all(color: C.border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
    ),
  );
}

class _PrimaryHeaderBtn extends StatelessWidget {
  final String label; final VoidCallback onTap;
  const _PrimaryHeaderBtn(this.label, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.4), blurRadius: 12)],
      ),
      child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
    ),
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

class _Sidebar extends StatelessWidget {
  final String active;
  final void Function(String) setTab;
  const _Sidebar({required this.active, required this.setTab});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final user = prov.user;
    final urgentCount = prov.urgentCount;

    return Container(
      width: 232,
      decoration: BoxDecoration(
        color: C.surf1.withValues(alpha: 0.6),
        border: const Border(right: BorderSide(color: C.border)),
      ),
      child: Column(children: [
        // Property card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: C.border))),
          child: Row(children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [C.violet.withValues(alpha: 0.8), C.violetDark.withValues(alpha: 0.8)],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.3), blurRadius: 12)],
              ),
              child: Center(child: Text(
                (user?.hotelName.isNotEmpty == true ? user!.hotelName[0] : 'H').toUpperCase(),
                style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
              )),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(user?.hotelName ?? 'Demo Property',
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.text1)),
              const SizedBox(height: 3),
              Row(children: [
                Container(width: 6, height: 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: user != null ? C.green : C.text4,
                    boxShadow: user != null ? [BoxShadow(color: C.green.withValues(alpha: 0.7), blurRadius: 6)] : null,
                  )),
                const SizedBox(width: 6),
                Text(user != null ? 'Connected' : 'Demo mode',
                  style: GoogleFonts.spaceMono(fontSize: 9, color: user != null ? C.green : C.text4, letterSpacing: 0.5)),
              ]),
            ])),
          ]),
        ),
        // Nav items
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              for (int gi = 0; gi < _navGroups.length; gi++) ...[
                Padding(
                  padding: EdgeInsets.only(top: gi == 0 ? 8 : 20, left: 10, bottom: 6),
                  child: Text(_navGroups[gi].$1,
                    style: GoogleFonts.spaceMono(fontSize: 8, color: C.text4, letterSpacing: 2.5)),
                ),
                for (final n in _navGroups[gi].$2)
                  if (n.$1 != 'admin' || (prov.user?.isAdmin == true))
                    _NavItem(
                      id: n.$1, label: n.$2, icon: n.$3,
                      isActive: active == n.$1,
                      badge: n.$1 == 'pricing' && urgentCount > 0 ? urgentCount : null,
                      onTap: () => setTab(n.$1),
                    ),
              ],
            ]),
          ),
        ),
        // Footer
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(border: Border(top: BorderSide(color: C.border))),
          child: Row(children: [
            Container(width: 6, height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: C.violet.withValues(alpha: 0.6),
                boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 6)],
              )),
            const SizedBox(width: 8),
            Text('Hotel IQ  ·  Revenue OS',
              style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4, letterSpacing: 0.5)),
          ]),
        ),
      ]),
    );
  }
}

class _NavItem extends StatefulWidget {
  final String id, label, icon;
  final bool isActive;
  final int? badge;
  final VoidCallback onTap;
  const _NavItem({required this.id, required this.label, required this.icon, required this.isActive, this.badge, required this.onTap});
  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> {
  bool _hov = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) => setState(() => _hov = true),
    onExit: (_) => setState(() => _hov = false),
    child: GestureDetector(
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.symmetric(vertical: 1),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        decoration: BoxDecoration(
          color: widget.isActive
              ? C.violet.withValues(alpha: 0.12)
              : _hov ? C.glassStrong : Colors.transparent,
          border: Border.all(
            color: widget.isActive ? C.violet.withValues(alpha: 0.3) : Colors.transparent,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color: widget.isActive
                  ? C.violet.withValues(alpha: 0.2)
                  : C.glass,
              border: Border.all(
                color: widget.isActive ? C.violet.withValues(alpha: 0.4) : C.border,
              ),
              borderRadius: BorderRadius.circular(8),
              boxShadow: widget.isActive ? [BoxShadow(color: C.violet.withValues(alpha: 0.3), blurRadius: 8)] : null,
            ),
            child: Center(child: Text(widget.icon,
              style: TextStyle(fontSize: 13, color: widget.isActive ? C.violetLight : C.text3))),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(widget.label,
            style: GoogleFonts.inter(
              fontSize: 13, fontWeight: widget.isActive ? FontWeight.w600 : FontWeight.w400,
              color: widget.isActive ? C.violetLight : _hov ? C.text2 : C.text3,
            ))),
          if (widget.badge != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: C.red,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [BoxShadow(color: C.red.withValues(alpha: 0.5), blurRadius: 8)],
              ),
              child: Text('${widget.badge}',
                style: GoogleFonts.spaceMono(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w700)),
            ),
        ]),
      ),
    ),
  );
}

// ── Bottom Nav (mobile) ───────────────────────────────────────────────────────

class _BottomNav extends StatelessWidget {
  final String active;
  final void Function(String) setTab;
  const _BottomNav({required this.active, required this.setTab});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('overview', '◈', 'Overview'),
      ('pricing',  '◇', 'Pricing'),
      ('ai',       '✦', 'AI'),
      ('forecast', '⟁', 'Forecast'),
      ('settings', '◎', 'Settings'),
    ];
    return Container(
      decoration: const BoxDecoration(
        color: C.surf1,
        border: Border(top: BorderSide(color: C.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(children: items.map((n) {
          final on = active == n.$1;
          return Expanded(child: GestureDetector(
            onTap: () => setTab(n.$1),
            child: Container(
              color: Colors.transparent,
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Column(children: [
                Text(n.$2, style: TextStyle(fontSize: 18, color: on ? C.violetLight : C.text4)),
                const SizedBox(height: 3),
                Text(n.$3, style: GoogleFonts.inter(fontSize: 9, color: on ? C.violetLight : C.text4,
                  fontWeight: on ? FontWeight.w600 : FontWeight.w400)),
              ]),
            ),
          ));
        }).toList()),
      ),
    );
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _Body extends StatelessWidget {
  final String tab;
  final void Function(String) setTab;
  final void Function(String) showAuth;
  const _Body({required this.tab, required this.setTab, required this.showAuth});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (_, c) {
      final narrow = c.maxWidth < 640;
      return SingleChildScrollView(
        padding: EdgeInsets.all(narrow ? 14 : 28),
        child: Column(children: [
          _buildTab(),
          const SizedBox(height: 60),
        ]),
      );
    });
  }

  Widget _buildTab() {
    switch (tab) {
      case 'overview':  return OverviewTab(setTab: setTab, showAuth: showAuth);
      case 'pricing':   return PricingTab(setTab: setTab);
      case 'forecast':  return ForecastTab(setTab: setTab);
      case 'compset':   return const CompSetTab();
      case 'ai':        return const AiAnalystTab();
      case 'admin':     return const AdminTab();
      case 'calendar':  return const CalendarTab();
      case 'reports':   return const ReportsTab();
      case 'settings':  return const SettingsTab();
      default:          return OverviewTab(setTab: setTab, showAuth: showAuth);
    }
  }
}
