import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../widgets/dot_grid.dart';
import 'auth_screen.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});
  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final _scroll = ScrollController();
  bool _scrolled = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() => setState(() => _scrolled = _scroll.offset > 40));
  }

  @override
  void dispose() { _scroll.dispose(); super.dispose(); }

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
        child: CustomScrollView(
          controller: _scroll,
          slivers: [
            SliverAppBar(
              pinned: true, floating: false,
              backgroundColor: _scrolled ? C.bg.withValues(alpha: 0.9) : Colors.transparent,
              elevation: 0, surfaceTintColor: Colors.transparent,
              toolbarHeight: 70,
              flexibleSpace: _scrolled
                  ? Container(decoration: BoxDecoration(
                      color: C.bg.withValues(alpha: 0.9),
                      border: const Border(bottom: BorderSide(color: C.border)),
                    ))
                  : null,
              title: _NavLogo(),
              actions: [
                _NavLink('Features', () {}),
                _NavLink('Pricing', () {}),
                _NavLink('About', () {}),
                const SizedBox(width: 8),
                _OutlineBtn('Sign In', () => _showAuth('login')),
                const SizedBox(width: 8),
                _PrimaryBtn('Get Started', () => _showAuth('register')),
                const SizedBox(width: 24),
              ],
            ),
            SliverList(delegate: SliverChildListDelegate([
              _Hero(onSignIn: () => _showAuth('login'), onGetStarted: () => _showAuth('register')),
              _LogoBar(),
              _StatsRow(),
              _Features(),
              _HowItWorks(),
              _Testimonials(),
              _Cta(onGetStarted: () => _showAuth('register'), onSignIn: () => _showAuth('login')),
              _Footer(),
            ])),
          ],
        ),
      ),
    );
  }
}

// ── Nav ──────────────────────────────────────────────────────────────────────

class _NavLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(
      width: 38, height: 38,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [C.violet, C.violetDark],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 16)],
      ),
      child: Center(child: Text('IQ',
        style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white))),
    ),
    const SizedBox(width: 12),
    RichText(text: TextSpan(children: [
      TextSpan(text: 'Hotel', style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -0.5)),
      TextSpan(text: 'IQ', style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w800, color: C.gold, letterSpacing: -0.5)),
    ])),
  ]);
}

class _NavLink extends StatelessWidget {
  final String label; final VoidCallback onTap;
  const _NavLink(this.label, this.onTap);
  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onTap,
    child: Text(label, style: GoogleFonts.inter(color: C.text3, fontSize: 14, fontWeight: FontWeight.w500)),
  );
}

class _PrimaryBtn extends StatelessWidget {
  final String label; final VoidCallback onTap;
  const _PrimaryBtn(this.label, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 20, offset: const Offset(0, 4))],
      ),
      child: Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
    ),
  );
}

class _OutlineBtn extends StatelessWidget {
  final String label; final VoidCallback onTap;
  const _OutlineBtn(this.label, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        border: Border.all(color: C.borderMid),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: C.text2)),
    ),
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _Hero extends StatelessWidget {
  final VoidCallback onSignIn, onGetStarted;
  const _Hero({required this.onSignIn, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final wide = w > 960;
    return Padding(
      padding: EdgeInsets.fromLTRB(wide ? 80 : 24, 100, wide ? 80 : 24, 80),
      child: wide
          ? Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              Expanded(child: _HeroCopy(onSignIn: onSignIn, onGetStarted: onGetStarted)),
              const SizedBox(width: 80),
              Expanded(child: _DashCard()),
            ])
          : Column(children: [
              _HeroCopy(onSignIn: onSignIn, onGetStarted: onGetStarted),
              const SizedBox(height: 60),
              _DashCard(),
            ]),
    );
  }
}

class _HeroCopy extends StatelessWidget {
  final VoidCallback onSignIn, onGetStarted;
  const _HeroCopy({required this.onSignIn, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Badge
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [
            C.violet.withValues(alpha: 0.15),
            C.gold.withValues(alpha: 0.08),
          ]),
          border: Border.all(color: C.violet.withValues(alpha: 0.35)),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          _PulseDot(color: C.violetLight),
          const SizedBox(width: 8),
          Text('AI-Powered Revenue Intelligence',
            style: GoogleFonts.spaceMono(fontSize: 10, color: C.violetLight, letterSpacing: 1.5)),
        ]),
      ),
      const SizedBox(height: 32),
      // Headline
      RichText(
        text: TextSpan(children: [
          TextSpan(
            text: 'The Revenue\nBrain Behind\n',
            style: GoogleFonts.syne(
              fontSize: 62, fontWeight: FontWeight.w800,
              color: Colors.white, height: 1.05, letterSpacing: -2.5,
            ),
          ),
          TextSpan(
            text: 'Top Hotels.',
            style: GoogleFonts.syne(
              fontSize: 62, fontWeight: FontWeight.w800,
              height: 1.05, letterSpacing: -2.5,
              foreground: Paint()..shader = const LinearGradient(
                colors: [C.gold, C.orange],
              ).createShader(const Rect.fromLTWH(0, 0, 420, 70)),
            ),
          ),
        ]),
      ),
      const SizedBox(height: 28),
      Text(
        'Hotel IQ combines AI demand forecasting, real-time dynamic pricing, '
        'and competitive intelligence. Stop guessing. Start outperforming.',
        style: GoogleFonts.inter(fontSize: 17, color: C.text2, height: 1.8),
      ),
      const SizedBox(height: 40),
      Row(children: [
        GestureDetector(
          onTap: onGetStarted,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.6), blurRadius: 30, offset: const Offset(0, 8))],
            ),
            child: Text('Start Free Trial →', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ),
        const SizedBox(width: 16),
        GestureDetector(
          onTap: onSignIn,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(color: C.borderMid),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text('Sign In', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500, color: C.text2)),
          ),
        ),
      ]),
      const SizedBox(height: 48),
      Row(children: [
        for (final x in [('14-day', 'free trial'), ('2 min', 'setup'), ('No card', 'required')])
          Padding(
            padding: const EdgeInsets.only(right: 36),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(x.$1, style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -0.5)),
              Text(x.$2, style: GoogleFonts.spaceMono(fontSize: 10, color: C.text3, letterSpacing: 1)),
            ]),
          ),
      ]),
    ]);
  }
}

class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});
  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.4, end: 1).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Container(
      width: 7, height: 7,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: widget.color.withValues(alpha: _anim.value),
        boxShadow: [BoxShadow(color: widget.color.withValues(alpha: _anim.value * 0.7), blurRadius: 8)],
      ),
    ),
  );
}

class _DashCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [C.surf2, C.surf1.withValues(alpha: 0.8)],
        ),
        border: Border.all(color: C.borderMid),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.6), blurRadius: 80, offset: const Offset(0, 40)),
          BoxShadow(color: C.violet.withValues(alpha: 0.08), blurRadius: 60, spreadRadius: -10),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(children: [
          // Header row
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('The Grand Coastal', style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 14, color: C.text1)),
              Text('Live dashboard', style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: C.green.withValues(alpha: 0.1),
                border: Border.all(color: C.green.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 6, height: 6,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: C.green,
                    boxShadow: [BoxShadow(color: C.green, blurRadius: 6)])),
                const SizedBox(width: 6),
                Text('LIVE', style: GoogleFonts.spaceMono(fontSize: 9, color: C.green, letterSpacing: 1)),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          // KPI row
          Row(children: [
            for (final k in [
              ('Occupancy', '78%', '+4.2%', C.gold),
              ('RevPAR', r'$147', '+8.1%', C.violet),
              ('ADR', r'$188', '+2.4%', C.green),
            ])
              Expanded(child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: C.glass,
                    border: Border.all(color: C.border),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(k.$1, style: GoogleFonts.spaceMono(fontSize: 8, color: C.text3, letterSpacing: 1.5)),
                    const SizedBox(height: 6),
                    Text(k.$2, style: GoogleFonts.syne(fontSize: 24, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -0.5)),
                    const SizedBox(height: 2),
                    Text(k.$3, style: GoogleFonts.inter(fontSize: 10, color: C.green, fontWeight: FontWeight.w600)),
                  ]),
                ),
              )),
          ]),
          const SizedBox(height: 16),
          // AI Rec
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                C.violet.withValues(alpha: 0.12), C.violetDark.withValues(alpha: 0.06),
              ]),
              border: Border.all(color: C.violet.withValues(alpha: 0.3)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('✦  AI Recommendation',
                  style: GoogleFonts.spaceMono(fontSize: 10, color: C.violetLight, letterSpacing: 0.5)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: C.red.withValues(alpha: 0.15),
                    border: Border.all(color: C.red.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('HIGH PRIORITY', style: GoogleFonts.spaceMono(fontSize: 8, color: C.red, letterSpacing: 0.5)),
                ),
              ]),
              const SizedBox(height: 10),
              RichText(text: TextSpan(children: [
                TextSpan(text: 'Standard King: raise to ', style: GoogleFonts.inter(fontSize: 13, color: C.text2, height: 1.6)),
                TextSpan(text: r'$179', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: C.text1, height: 1.6)),
                TextSpan(text: ' — conference demand +34%', style: GoogleFonts.inter(fontSize: 13, color: C.text2, height: 1.6)),
              ])),
              const SizedBox(height: 12),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.4), blurRadius: 12)],
                  ),
                  child: Text('APPLY +\$2,400', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(border: Border.all(color: C.border), borderRadius: BorderRadius.circular(8)),
                  child: Text('SKIP', style: GoogleFonts.spaceMono(fontSize: 10, color: C.text3)),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ── Logo bar ──────────────────────────────────────────────────────────────────

class _LogoBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border.symmetric(horizontal: BorderSide(color: C.border)),
        color: Color(0x05FFFFFF),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 24),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('TRUSTED BY LEADING HOTELS',
          style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4, letterSpacing: 2)),
        for (final n in ['Meridian Hotels', 'Grand Pacific', 'Coastal Suites', 'Azure Resorts'])
          Text(n, style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w600, color: C.text4, letterSpacing: -0.3)),
      ]),
    );
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 100),
      child: LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 800 ? 4 : 2;
        return Wrap(spacing: 20, runSpacing: 20, children: [
          for (final s in [
            ('2,400+', 'Hotels Worldwide',  'across 40 countries',   C.violet),
            ('94%',    'Forecast Accuracy', '14-day demand model',    C.green),
            ('18%',    'RevPAR Lift',       'avg in first 90 days',   C.gold),
            (r'$4.2M', 'Annual Gain',       'avg per property',       C.pink),
          ])
            SizedBox(
              width: (c.maxWidth - 20 * (cols - 1)) / cols,
              child: _StatCard(val: s.$1, label: s.$2, sub: s.$3, color: s.$4),
            ),
        ]);
      }),
    );
  }
}

class _StatCard extends StatefulWidget {
  final String val, label, sub; final Color color;
  const _StatCard({required this.val, required this.label, required this.sub, required this.color});
  @override State<_StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<_StatCard> {
  bool _hov = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) => setState(() => _hov = true),
    onExit: (_) => setState(() => _hov = false),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      transform: Matrix4.translationValues(0, _hov ? -4 : 0, 0),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: _hov ? C.surf2 : C.glass,
        border: Border.all(color: _hov ? widget.color.withValues(alpha: 0.4) : C.border),
        borderRadius: BorderRadius.circular(24),
        boxShadow: _hov ? [BoxShadow(color: widget.color.withValues(alpha: 0.1), blurRadius: 40)] : null,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(height: 2, width: 40,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [widget.color, widget.color.withValues(alpha: 0)]),
            borderRadius: BorderRadius.circular(1),
          )),
        const SizedBox(height: 20),
        Text(widget.val, style: GoogleFonts.syne(fontSize: 52, fontWeight: FontWeight.w800, color: widget.color, letterSpacing: -2, height: 1)),
        const SizedBox(height: 10),
        Text(widget.label, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: C.text1)),
        const SizedBox(height: 4),
        Text(widget.sub, style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
      ]),
    ),
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

class _Features extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final feats = [
      ('◈', 'AI PRICING', 'Dynamic Rates, 24/7',
        'AI adjusts every room type hourly based on demand signals, competitor moves, and booking pace.',
        C.violet, C.violet),
      ('⌖', 'FORECASTING', '14-Day Vision',
        'Trained on 90 days of history. Detects events, patterns, and gives confidence-graded predictions.',
        C.green, C.green),
      ('⊞', 'COMP INTEL', 'Know Your Competition',
        'Real-time rate tracking across all major OTAs. AI recommendations to win on price.',
        C.gold, C.gold),
      ('▦', 'REV CALENDAR', 'Spot Gaps Instantly',
        'Color-coded daily view of occupancy, ADR, and revenue. Identify soft dates before they hurt.',
        C.pink, C.pink),
      ('≋', 'CHANNEL MIX', 'Where Profit Lives',
        'Break down revenue by segment and channel. Understand what drives margin, not just volume.',
        C.teal, C.teal),
      ('⌇', 'REPORTS', 'Boardroom Ready',
        'Monthly summaries, pickup reports, and comp analyses — generated overnight.',
        C.blue, C.blue),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(80, 0, 80, 100),
      child: Column(children: [
        _SectionLabel('PLATFORM', C.violet),
        const SizedBox(height: 20),
        Text('One platform.\nReplace your entire revenue stack.',
          textAlign: TextAlign.center,
          style: GoogleFonts.syne(fontSize: 48, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -2, height: 1.1)),
        const SizedBox(height: 80),
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth > 960 ? 3 : c.maxWidth > 600 ? 2 : 1;
          return Wrap(spacing: 16, runSpacing: 16, children: feats.map((f) => SizedBox(
            width: (c.maxWidth - 16 * (cols - 1)) / cols,
            child: _FeatureCard(icon: f.$1, tag: f.$2, title: f.$3, desc: f.$4, color: f.$5),
          )).toList());
        }),
      ]),
    );
  }
}

class _FeatureCard extends StatefulWidget {
  final String icon, tag, title, desc; final Color color;
  const _FeatureCard({required this.icon, required this.tag, required this.title, required this.desc, required this.color});
  @override State<_FeatureCard> createState() => _FeatureCardState();
}

class _FeatureCardState extends State<_FeatureCard> {
  bool _hov = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) => setState(() => _hov = true),
    onExit: (_) => setState(() => _hov = false),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      transform: Matrix4.translationValues(0, _hov ? -6 : 0, 0),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: _hov
              ? [widget.color.withValues(alpha: 0.1), C.surf2]
              : [C.glass, C.surf1.withValues(alpha: 0.3)],
        ),
        border: Border.all(color: _hov ? widget.color.withValues(alpha: 0.5) : C.border),
        borderRadius: BorderRadius.circular(24),
        boxShadow: _hov ? [BoxShadow(color: widget.color.withValues(alpha: 0.15), blurRadius: 40)] : null,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 52, height: 52,
          decoration: BoxDecoration(
            color: widget.color.withValues(alpha: 0.12),
            border: Border.all(color: widget.color.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(16),
            boxShadow: _hov ? [BoxShadow(color: widget.color.withValues(alpha: 0.3), blurRadius: 20)] : null,
          ),
          child: Center(child: Text(widget.icon, style: TextStyle(fontSize: 24, color: widget.color))),
        ),
        const SizedBox(height: 24),
        Text(widget.tag, style: GoogleFonts.spaceMono(fontSize: 9, color: widget.color, letterSpacing: 2)),
        const SizedBox(height: 8),
        Text(widget.title, style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w700, color: C.text1, letterSpacing: -0.3)),
        const SizedBox(height: 12),
        Text(widget.desc, style: GoogleFonts.inter(fontSize: 14, color: C.text3, height: 1.8)),
      ]),
    ),
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

class _HowItWorks extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final steps = [
      ('01', 'Connect Your PMS', 'Sync your property management system in minutes. Hotel IQ pulls historical bookings, rates, and channel data automatically.'),
      ('02', 'AI Learns Your Patterns', 'Our models train on your hotel\'s seasonality, comp set, and booking windows within 48 hours of connection.'),
      ('03', 'Approve & Earn More', 'Review AI pricing recommendations daily. One click to apply — track the revenue impact in real time.'),
    ];

    return Container(
      decoration: const BoxDecoration(
        border: Border.symmetric(horizontal: BorderSide(color: C.border)),
        color: Color(0x05FFFFFF),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 100),
      child: Column(children: [
        _SectionLabel('HOW IT WORKS', C.gold),
        const SizedBox(height: 20),
        Text('Up and earning in 48 hours.',
          style: GoogleFonts.syne(fontSize: 48, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -2, height: 1.1)),
        const SizedBox(height: 80),
        LayoutBuilder(builder: (_, c) => Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: steps.asMap().entries.map((e) => Expanded(child: Padding(
            padding: EdgeInsets.only(right: e.key < 2 ? 48 : 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e.value.$1,
                style: GoogleFonts.syne(fontSize: 56, fontWeight: FontWeight.w800,
                  foreground: Paint()..shader = LinearGradient(
                    colors: [C.violet.withValues(alpha: 0.5), C.violet.withValues(alpha: 0.1)],
                  ).createShader(const Rect.fromLTWH(0, 0, 80, 70)),
                  letterSpacing: -2, height: 1)),
              const SizedBox(height: 20),
              Text(e.value.$2, style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w700, color: C.text1, letterSpacing: -0.3)),
              const SizedBox(height: 12),
              Text(e.value.$3, style: GoogleFonts.inter(fontSize: 14, color: C.text3, height: 1.8)),
            ]),
          ))).toList(),
        )),
      ]),
    );
  }
}

// ── Testimonials ──────────────────────────────────────────────────────────────

class _Testimonials extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 100),
      child: Column(children: [
        _SectionLabel('RESULTS', C.green),
        const SizedBox(height: 20),
        Text('Revenue results,\nnot promises.',
          textAlign: TextAlign.center,
          style: GoogleFonts.syne(fontSize: 48, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -2, height: 1.1)),
        const SizedBox(height: 80),
        LayoutBuilder(builder: (_, c) {
          final wide = c.maxWidth > 720;
          final cards = [
            _TestCard(
              quote: '"Hotel IQ increased our RevPAR by 22% in the first quarter. The AI demand forecasting is eerily accurate — it predicted a local event we didn\'t even know about."',
              name: 'Sarah Mitchell', role: 'Director of Revenue, The Grand Coastal',
              metric: '+22% RevPAR', color: C.green,
            ),
            _TestCard(
              quote: '"We replaced three separate tools with Hotel IQ. The comp set intelligence alone saved us 10 hours a week. The ROI was clear within the first 30 days."',
              name: 'James Thornton', role: 'VP Revenue Management, Meridian Hotels',
              metric: '3 tools → 1', color: C.violet,
            ),
          ];
          return wide
              ? Row(children: cards.map((c) => Expanded(child: Padding(
                  padding: EdgeInsets.only(right: cards.indexOf(c) == 0 ? 20 : 0), child: c))).toList())
              : Column(children: cards.map((c) => Padding(padding: const EdgeInsets.only(bottom: 20), child: c)).toList());
        }),
      ]),
    );
  }
}

class _TestCard extends StatelessWidget {
  final String quote, name, role, metric; final Color color;
  const _TestCard({required this.quote, required this.name, required this.role, required this.metric, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(36),
    decoration: BoxDecoration(
      gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [C.surf2, C.surf1.withValues(alpha: 0.5)]),
      border: Border.all(color: C.borderMid),
      borderRadius: BorderRadius.circular(24),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(height: 2, decoration: BoxDecoration(
        gradient: LinearGradient(colors: [color, Colors.transparent]),
        borderRadius: BorderRadius.circular(1),
      )),
      const SizedBox(height: 28),
      Row(children: List.generate(5, (_) => const Text('★', style: TextStyle(color: C.gold, fontSize: 16)))),
      const SizedBox(height: 20),
      Text(quote, style: GoogleFonts.inter(fontSize: 16, color: C.text2, height: 1.9, fontStyle: FontStyle.italic)),
      const SizedBox(height: 32),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: C.text1)),
          const SizedBox(height: 3),
          Text(role, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
        ]),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            border: Border.all(color: color.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(metric, style: GoogleFonts.spaceMono(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ),
      ]),
    ]),
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

class _Cta extends StatelessWidget {
  final VoidCallback onGetStarted, onSignIn;
  const _Cta({required this.onGetStarted, required this.onSignIn});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      gradient: RadialGradient(
        center: Alignment.center, radius: 1.2,
        colors: [C.violet.withValues(alpha: 0.12), Colors.transparent],
      ),
      border: const Border(top: BorderSide(color: C.border)),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 120),
    child: Column(children: [
      _SectionLabel('GET STARTED', C.violet),
      const SizedBox(height: 24),
      RichText(textAlign: TextAlign.center, text: TextSpan(children: [
        TextSpan(text: 'Your competitors are already\n',
          style: GoogleFonts.syne(fontSize: 52, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -2, height: 1.1)),
        TextSpan(text: 'using AI pricing.',
          style: GoogleFonts.syne(
            fontSize: 52, fontWeight: FontWeight.w800, letterSpacing: -2, height: 1.1,
            foreground: Paint()..shader = const LinearGradient(
              colors: [C.gold, C.orange],
            ).createShader(const Rect.fromLTWH(0, 0, 500, 60)),
          )),
      ])),
      const SizedBox(height: 24),
      Text('Join 2,400+ hotels using Hotel IQ to make smarter revenue decisions.\nFree 14-day trial. No credit card required.',
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(fontSize: 17, color: C.text2, height: 1.75)),
      const SizedBox(height: 48),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        GestureDetector(
          onTap: onGetStarted,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 44, vertical: 18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.6), blurRadius: 40, offset: const Offset(0, 10))],
            ),
            child: Text('Create Free Account →', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ),
        const SizedBox(width: 16),
        GestureDetector(
          onTap: onSignIn,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 18),
            decoration: BoxDecoration(border: Border.all(color: C.borderMid), borderRadius: BorderRadius.circular(14)),
            child: Text('Sign In', style: GoogleFonts.inter(fontSize: 16, color: C.text2)),
          ),
        ),
      ]),
      const SizedBox(height: 28),
      Text('No credit card · Cancel anytime · Full access from day 1',
        style: GoogleFonts.spaceMono(fontSize: 11, color: C.text4, letterSpacing: 0.5)),
    ]),
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

class _Footer extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    decoration: const BoxDecoration(border: Border(top: BorderSide(color: C.border))),
    padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 40),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(child: Text('IQ', style: GoogleFonts.syne(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white))),
        ),
        const SizedBox(width: 10),
        RichText(text: TextSpan(children: [
          TextSpan(text: 'Hotel', style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w700, color: C.text1)),
          TextSpan(text: 'IQ', style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w700, color: C.gold)),
        ])),
        const SizedBox(width: 16),
        Text('© ${DateTime.now().year} Hotel IQ', style: GoogleFonts.inter(fontSize: 12, color: C.text4)),
      ]),
      Row(children: [
        for (final l in ['Privacy', 'Terms', 'Contact'])
          Padding(
            padding: const EdgeInsets.only(left: 28),
            child: Text(l, style: GoogleFonts.inter(fontSize: 13, color: C.text4)),
          ),
      ]),
    ]),
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text; final Color color;
  const _SectionLabel(this.text, this.color);
  @override
  Widget build(BuildContext context) => Row(mainAxisAlignment: MainAxisAlignment.center, children: [
    Container(width: 20, height: 1, color: color.withValues(alpha: 0.5)),
    const SizedBox(width: 10),
    Text(text, style: GoogleFonts.spaceMono(fontSize: 11, color: color, letterSpacing: 3)),
    const SizedBox(width: 10),
    Container(width: 20, height: 1, color: color.withValues(alpha: 0.5)),
  ]);
}
