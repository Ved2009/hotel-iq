import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/dot_grid.dart';
import '../auth_screen.dart';
import 'tabs/overview_tab.dart';
import 'tabs/revenue_tab.dart';
import 'tabs/pricing_tab.dart';
import 'tabs/forecast_tab.dart';
import 'tabs/compset_tab.dart';
import 'tabs/calendar_tab.dart';
import 'tabs/reports_tab.dart';
import 'tabs/settings_tab.dart';
import 'tabs/ai_chat_tab.dart';
import 'tabs/integrations_tab.dart';

const _navGroups = [
  ('CORE', [
    ('overview',      'Overview',      '◈'),
    ('revenue',       'Revenue',       '◆'),
    ('pricing',       'Pricing',       '◇'),
  ]),
  ('INTELLIGENCE', [
    ('forecast',      'Forecast',      '⟁'),
    ('compset',       'Comp Set',      '⊞'),
  ]),
  ('TOOLS', [
    ('calendar',      'Calendar',      '▦'),
    ('reports',       'Reports',       '≡'),
    ('integrations',  'Integrations',  '⊕'),
    ('settings',      'Settings',      '◎'),
  ]),
];

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _tab = 'overview';
  bool _showNotif = false;
  late final Stream<DateTime> _clock;

  @override
  void initState() {
    super.initState();
    _clock = Stream.periodic(const Duration(seconds: 1), (_) => DateTime.now());
  }

  void _setTab(String t) => setState(() => _tab = t);

  void _showAuth(String tab) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.88),
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: AuthScreen(
          isModal: true,
          initialTab: tab,
          onClose: () => Navigator.pop(context),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.bg,
      body: DotGridBackground(
        child: Column(children: [
          _Header(
            tab: _tab,
            showNotif: _showNotif,
            onNotif: () => setState(() => _showNotif = !_showNotif),
            onShowAuth: _showAuth,
            clock: _clock,
          ),
          Expanded(
            child: LayoutBuilder(builder: (ctx, constraints) {
              final wide = constraints.maxWidth > 900;
              final tablet = constraints.maxWidth > 600;
              if (wide) {
                return Row(children: [
                  _Sidebar(active: _tab, setTab: _setTab),
                  Expanded(child: _Content(tab: _tab, setTab: _setTab, showAuth: _showAuth)),
                ]);
              } else {
                return Column(children: [
                  Expanded(child: _Content(tab: _tab, setTab: _setTab, showAuth: _showAuth)),
                  _BottomNav(active: _tab, setTab: _setTab),
                ]);
              }
            }),
          ),
        ]),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String tab;
  final bool showNotif;
  final VoidCallback onNotif;
  final void Function(String) onShowAuth;
  final Stream<DateTime> clock;

  const _Header({
    required this.tab,
    required this.showNotif,
    required this.onNotif,
    required this.onShowAuth,
    required this.clock,
  });

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final user = prov.user;

    return Container(
      height: 60,
      decoration: const BoxDecoration(
        color: Color(0xEB03050A),
        border: Border(bottom: BorderSide(color: C.border)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Row(children: [
          // Logo
          Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
                borderRadius: BorderRadius.circular(9),
                boxShadow: const [BoxShadow(color: Color(0x726366F1), blurRadius: 16)],
              ),
              child: Center(
                child: Text('IQ',
                  style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ),
            const SizedBox(width: 12),
            Text.rich(TextSpan(children: [
              TextSpan(text: 'Hotel',
                style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w700, color: C.text1, letterSpacing: -0.5)),
              TextSpan(text: 'IQ',
                style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF818CF8), letterSpacing: -0.5)),
            ])),
          ]),
          const Spacer(),
          // Hotel name
          if (user != null)
            Text(user.hotelName.toUpperCase(),
              style: GoogleFonts.spaceMono(fontSize: 10, color: C.text4, letterSpacing: 1)),
          const SizedBox(width: 16),
          Container(width: 1, height: 14, color: C.border),
          const SizedBox(width: 16),
          // Clock
          StreamBuilder<DateTime>(
            stream: clock,
            builder: (_, snap) {
              final now = snap.data ?? DateTime.now();
              final h = now.hour.toString().padLeft(2, '0');
              final m = now.minute.toString().padLeft(2, '0');
              final s = now.second.toString().padLeft(2, '0');
              return Text('$h:$m:$s',
                style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3, letterSpacing: 0.5));
            },
          ),
          const SizedBox(width: 16),
          // AI button
          _AiButton(user: user, onShowAuth: onShowAuth),
          const SizedBox(width: 10),
          // User area
          if (user != null) ...[
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.blue, C.purple]),
                shape: BoxShape.circle,
                boxShadow: const [BoxShadow(color: Color(0x666366F1), blurRadius: 10)],
              ),
              child: Center(
                child: Text(user.initials,
                  style: GoogleFonts.syne(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ),
            const SizedBox(width: 8),
            Text('Hi, ${user.firstName}',
              style: GoogleFonts.spaceMono(fontSize: 12, color: C.text3)),
            const SizedBox(width: 10),
            _HeaderBtn(label: 'Sign Out', onTap: () => context.read<AppProvider>().logout()),
          ] else ...[
            _HeaderBtn(
              label: 'Sign In',
              onTap: () => onShowAuth('login'),
              outlined: true,
            ),
            const SizedBox(width: 8),
            _HeaderBtn(
              label: 'Register Free',
              onTap: () => onShowAuth('register'),
              primary: true,
            ),
          ],
        ]),
      ),
    );
  }
}

class _AiButton extends StatefulWidget {
  final dynamic user;
  final void Function(String) onShowAuth;
  const _AiButton({required this.user, required this.onShowAuth});

  @override
  State<_AiButton> createState() => _AiButtonState();
}

class _AiButtonState extends State<_AiButton> with SingleTickerProviderStateMixin {
  late final AnimationController _shimmer;

  @override
  void initState() {
    super.initState();
    _shimmer = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat();
  }

  @override
  void dispose() { _shimmer.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final open = prov.aiOpen;

    return GestureDetector(
      onTap: () {
        if (widget.user != null) {
          prov.toggleAi();
        } else {
          widget.onShowAuth('login');
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          gradient: open ? null : const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
          color: open ? const Color(0x1A6366F1) : null,
          border: Border.all(color: const Color(0x4D6366F1)),
          borderRadius: BorderRadius.circular(9),
          boxShadow: open ? null : const [BoxShadow(color: Color(0x596366F1), blurRadius: 20, offset: Offset(0, 4))],
        ),
        child: Text('✦ ASK AI',
          style: GoogleFonts.inter(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: open ? const Color(0xFF818CF8) : Colors.white, letterSpacing: 0.2,
          )),
      ),
    );
  }
}

class _HeaderBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool outlined;
  final bool primary;

  const _HeaderBtn({required this.label, required this.onTap, this.outlined = false, this.primary = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          gradient: primary
              ? const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)])
              : null,
          border: Border.all(
            color: primary
                ? Colors.transparent
                : outlined
                    ? const Color(0x666366F1)
                    : const Color(0x12FFFFFF),
          ),
          borderRadius: BorderRadius.circular(8),
          boxShadow: primary ? const [BoxShadow(color: Color(0x666366F1), blurRadius: 14)] : null,
        ),
        child: Text(label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: primary
                ? Colors.white
                : outlined
                    ? const Color(0xFF818CF8)
                    : C.text3,
            fontWeight: primary ? FontWeight.w700 : FontWeight.w600,
          )),
      ),
    );
  }
}

class _Sidebar extends StatelessWidget {
  final String active;
  final void Function(String) setTab;

  const _Sidebar({required this.active, required this.setTab});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().user;
    final urgentCount = context.watch<AppProvider>().urgentCount;

    return Container(
      width: 240,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [C.surf1, C.bg],
        ),
        border: Border(right: BorderSide(color: C.border)),
      ),
      child: Column(
        children: [
          // Property card
          Container(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: C.border)),
            ),
            child: Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Color(0x666366F1), blurRadius: 12)],
                ),
                child: Center(
                  child: Text((user?.hotelName.isNotEmpty == true ? user!.hotelName[0] : 'C').toUpperCase(),
                    style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user?.hotelName ?? 'The Coastal Grand',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.text1)),
                  const SizedBox(height: 3),
                  Row(children: [
                    Container(
                      width: 5, height: 5,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle, color: C.green,
                        boxShadow: [BoxShadow(color: Color(0x8010B981), blurRadius: 6)],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text('Live',
                      style: GoogleFonts.spaceMono(fontSize: 10, color: const Color(0xFF34D399), letterSpacing: 0.5)),
                  ]),
                ]),
              ),
            ]),
          ),
          // Nav
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (int gi = 0; gi < _navGroups.length; gi++) ...[
                    Padding(
                      padding: EdgeInsets.only(top: gi == 0 ? 6 : 18, left: 10, bottom: 4),
                      child: Text(_navGroups[gi].$1,
                        style: GoogleFonts.spaceMono(
                          fontSize: 9, color: C.text4,
                          letterSpacing: 2, fontWeight: FontWeight.w700,
                        )),
                    ),
                    for (final n in _navGroups[gi].$2)
                      _NavItem(
                        id: n.$1, label: n.$2, icon: n.$3,
                        active: active == n.$1,
                        badge: n.$1 == 'pricing' && urgentCount > 0 ? urgentCount : null,
                        onTap: () => setTab(n.$1),
                      ),
                  ],
                ],
              ),
            ),
          ),
          // Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(border: Border(top: BorderSide(color: C.border))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Hotel IQ · v2.2',
                style: GoogleFonts.spaceMono(fontSize: 10, color: C.text4, letterSpacing: 0.3)),
              const SizedBox(height: 2),
              Text('AI Revenue Intelligence',
                style: GoogleFonts.spaceMono(fontSize: 10, color: C.text4)),
            ]),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  final String id, label, icon;
  final bool active;
  final int? badge;
  final VoidCallback onTap;

  const _NavItem({
    required this.id, required this.label, required this.icon,
    required this.active, this.badge, required this.onTap,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.symmetric(vertical: 1),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: widget.active
                ? const Color(0x1F6366F1)
                : _hovered
                    ? const Color(0x0AFFFFFF)
                    : Colors.transparent,
            border: Border.all(
              color: widget.active ? const Color(0x336366F1) : Colors.transparent,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(children: [
            Container(
              width: 26, height: 26,
              decoration: BoxDecoration(
                color: widget.active
                    ? const Color(0x2E6366F1)
                    : const Color(0x0AFFFFFF),
                border: Border.all(
                  color: widget.active
                      ? const Color(0x406366F1)
                      : const Color(0x0AFFFFFF),
                ),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Center(
                child: Text(widget.icon,
                  style: TextStyle(
                    fontSize: 12,
                    color: widget.active ? const Color(0xFFA5B4FC) : C.text3,
                  )),
              ),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: Text(widget.label,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: widget.active ? const Color(0xFFA5B4FC) : _hovered ? C.text2 : C.text3,
                  fontWeight: widget.active ? FontWeight.w500 : FontWeight.w400,
                )),
            ),
            if (widget.badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: C.red,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Color(0x66EF4444), blurRadius: 8)],
                ),
                child: Text('${widget.badge}',
                  style: GoogleFonts.spaceMono(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w700)),
              ),
          ]),
        ),
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final String active;
  final void Function(String) setTab;
  const _BottomNav({required this.active, required this.setTab});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('overview', '◈', 'Overview'),
      ('revenue',  '◆', 'Revenue'),
      ('pricing',  '◇', 'Pricing'),
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
        child: Row(
          children: items.map((n) {
            final isActive = active == n.$1;
            return Expanded(
              child: GestureDetector(
                onTap: () => setTab(n.$1),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  color: Colors.transparent,
                  child: Column(children: [
                    Text(n.$2,
                      style: TextStyle(
                        fontSize: 18,
                        color: isActive ? C.blue : C.text4,
                      )),
                    const SizedBox(height: 3),
                    Text(n.$3,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: isActive ? C.blue : C.text4,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                      )),
                  ]),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _Content extends StatelessWidget {
  final String tab;
  final void Function(String) setTab;
  final void Function(String) showAuth;

  const _Content({required this.tab, required this.setTab, required this.showAuth});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();

    return Stack(children: [
      SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            _buildTab(tab, setTab, showAuth, prov),
            const SizedBox(height: 60),
          ],
        ),
      ),
      if (prov.aiOpen)
        Positioned(
          right: 24, bottom: 24,
          child: AiChatPanel(onClose: prov.closeAi),
        ),
    ]);
  }

  Widget _buildTab(String tab, void Function(String) setTab, void Function(String) showAuth, AppProvider prov) {
    switch (tab) {
      case 'overview':     return OverviewTab(setTab: setTab, showAuth: showAuth);
      case 'revenue':      return const RevenueTab();
      case 'pricing':      return PricingTab(setTab: setTab);
      case 'forecast':     return ForecastTab(setTab: setTab);
      case 'compset':      return const CompSetTab();
      case 'calendar':     return const CalendarTab();
      case 'reports':      return const ReportsTab();
      case 'integrations': return const IntegrationsTab();
      case 'settings':     return const SettingsTab();
      default:             return OverviewTab(setTab: setTab, showAuth: showAuth);
    }
  }
}
