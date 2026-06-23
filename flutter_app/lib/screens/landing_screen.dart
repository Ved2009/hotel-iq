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
  final _scrollCtrl = ScrollController();
  bool _scrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(() {
      setState(() => _scrolled = _scrollCtrl.offset > 20);
    });
  }

  @override
  void dispose() { _scrollCtrl.dispose(); super.dispose(); }

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
        child: CustomScrollView(
          controller: _scrollCtrl,
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: _scrolled
                  ? const Color(0xF2030712)
                  : Colors.transparent,
              elevation: 0,
              surfaceTintColor: Colors.transparent,
              bottom: _scrolled
                  ? PreferredSize(
                      preferredSize: const Size.fromHeight(1),
                      child: Container(height: 1, color: const Color(0x0FFFFFFF)),
                    )
                  : null,
              title: _NavLogo(),
              actions: [
                _NavLinks(),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: () => _showAuth('login'),
                  child: Text('Sign In',
                    style: GoogleFonts.inter(color: C.text2, fontSize: 13)),
                ),
                const SizedBox(width: 8),
                _GradBtn(
                  label: 'Get Started Free',
                  onTap: () => _showAuth('register'),
                ),
                const SizedBox(width: 24),
              ],
            ),
            SliverList(delegate: SliverChildListDelegate([
              _HeroSection(onSignIn: () => _showAuth('login'), onGetStarted: () => _showAuth('register')),
              _TrustBar(),
              _StatsSection(),
              _FeaturesSection(),
              _HowItWorks(),
              _Testimonials(),
              _CtaSection(onGetStarted: () => _showAuth('register'), onSignIn: () => _showAuth('login')),
              _Footer(),
            ])),
          ],
        ),
      ),
    );
  }
}

class _NavLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [C.blue, Color(0xFF4F46E5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(10),
          boxShadow: const [BoxShadow(color: Color(0x806366F1), blurRadius: 20)],
        ),
        child: Center(
          child: Text('IQ',
            style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white)),
        ),
      ),
      const SizedBox(width: 12),
      Text.rich(TextSpan(children: [
        TextSpan(text: 'Hotel',
          style: GoogleFonts.syne(fontSize: 19, fontWeight: FontWeight.w800, color: C.text1, letterSpacing: -0.5)),
        TextSpan(text: 'IQ',
          style: GoogleFonts.syne(fontSize: 19, fontWeight: FontWeight.w800, color: C.gold, letterSpacing: -0.5)),
      ])),
    ]);
  }
}

class _NavLinks extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      for (final l in ['Platform', 'Features', 'Pricing', 'About'])
        TextButton(
          onPressed: () {},
          child: Text(l,
            style: GoogleFonts.inter(color: C.text3, fontSize: 14, fontWeight: FontWeight.w500)),
        ),
    ]);
  }
}

class _GradBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final double? width;
  const _GradBtn({required this.label, required this.onTap, this.width});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 9),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [C.blue, Color(0xFF4F46E5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(8),
          boxShadow: const [BoxShadow(color: Color(0x666366F1), blurRadius: 20, offset: Offset(0, 4))],
        ),
        child: Center(
          child: Text(label,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
        ),
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  final VoidCallback onSignIn, onGetStarted;
  const _HeroSection({required this.onSignIn, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(64, 100, 64, 80),
      child: LayoutBuilder(builder: (ctx, cst) {
        final wide = cst.maxWidth > 900;
        return wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                Expanded(child: _HeroCopy(onSignIn: onSignIn, onGetStarted: onGetStarted)),
                const SizedBox(width: 80),
                Expanded(child: _DashboardPreview()),
              ])
            : Column(children: [
                _HeroCopy(onSignIn: onSignIn, onGetStarted: onGetStarted),
                const SizedBox(height: 48),
                _DashboardPreview(),
              ]);
      }),
    );
  }
}

class _HeroCopy extends StatelessWidget {
  final VoidCallback onSignIn, onGetStarted;
  const _HeroCopy({required this.onSignIn, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Live badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0x1F6366F1),
            border: Border.all(color: const Color(0x4D6366F1)),
            borderRadius: BorderRadius.circular(100),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 7, height: 7,
              decoration: const BoxDecoration(
                shape: BoxShape.circle, color: C.blue,
                boxShadow: [BoxShadow(color: C.blue, blurRadius: 10)],
              ),
            ),
            const SizedBox(width: 8),
            Text('Live Revenue Intelligence',
              style: GoogleFonts.spaceMono(
                fontSize: 11, color: Color(0xFF818CF8),
                letterSpacing: 2,
              )),
          ]),
        ),
        const SizedBox(height: 28),
        // Headline
        RichText(
          text: TextSpan(children: [
            TextSpan(text: 'The Revenue Brain\nBehind the World\'s\n',
              style: GoogleFonts.syne(
                fontSize: 58, fontWeight: FontWeight.w800,
                color: Colors.white, height: 1.08, letterSpacing: -2,
              )),
            TextSpan(text: 'Top Hotels.',
              style: GoogleFonts.syne(
                fontSize: 58, fontWeight: FontWeight.w800,
                foreground: Paint()
                  ..shader = const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFF97316)],
                  ).createShader(const Rect.fromLTWH(0, 0, 400, 70)),
                height: 1.08, letterSpacing: -2,
              )),
          ]),
        ),
        const SizedBox(height: 24),
        Text(
          'Hotel IQ combines AI demand forecasting, real-time dynamic pricing, '
          'and competitive intelligence into one platform. Stop guessing. Start outperforming.',
          style: GoogleFonts.inter(fontSize: 17, color: C.text3, height: 1.8),
        ),
        const SizedBox(height: 36),
        Row(children: [
          _GradBtn(label: 'Start Free — No Card →', onTap: onGetStarted),
          const SizedBox(width: 14),
          OutlinedButton(
            onPressed: onSignIn,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0x1FFFFFFF)),
              foregroundColor: C.text2,
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Sign In to Dashboard',
              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500, color: C.text2)),
          ),
        ]),
        const SizedBox(height: 40),
        Row(children: [
          for (final x in [('14-day', 'free trial'), ('2 min', 'setup'), ('24/7', 'AI updates')])
            Padding(
              padding: const EdgeInsets.only(right: 32),
              child: Column(children: [
                Text(x.$1,
                  style: GoogleFonts.syne(
                    fontSize: 22, fontWeight: FontWeight.w800,
                    color: Colors.white, letterSpacing: -0.5,
                  )),
                Text(x.$2,
                  style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3, letterSpacing: 1)),
              ]),
            ),
        ]),
      ],
    );
  }
}

class _DashboardPreview extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x096E6E6E),
        border: Border.all(color: const Color(0x1AFFFFFF)),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(color: Color(0x80000000), blurRadius: 80, offset: Offset(0, 40)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(children: [
          // Header
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('The Grand Coastal — Live',
                style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 13, color: Colors.white)),
              Text('Updated just now',
                style: GoogleFonts.spaceMono(fontSize: 11, color: C.text3)),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0x1A10B981),
                border: Border.all(color: const Color(0x4010B981)),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 6, height: 6,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle, color: Color(0xFF10B981),
                    boxShadow: [BoxShadow(color: Color(0xFF10B981), blurRadius: 6)],
                  )),
                const SizedBox(width: 6),
                Text('LIVE',
                  style: GoogleFonts.spaceMono(fontSize: 10, color: Color(0xFF10B981), letterSpacing: 1)),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          // KPI row
          Row(children: [
            for (final k in [
              ('Occupancy', '78%', '+4.2%', 0xFFF59E0B),
              ('RevPAR',    '\$147', '+8.1%', 0xFF6366F1),
              ('ADR',       '\$188', '+2.4%', 0xFF10B981),
            ])
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0x0AFFFFFF),
                      border: Border.all(color: const Color(0x12FFFFFF)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(k.$1,
                        style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1.5)),
                      const SizedBox(height: 6),
                      Text(k.$2,
                        style: GoogleFonts.syne(
                          fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5,
                        )),
                      Text(k.$3,
                        style: GoogleFonts.spaceMono(fontSize: 10, color: Color(0xFF10B981))),
                    ]),
                  ),
                ),
              ),
          ]),
          const SizedBox(height: 18),
          // AI Rec
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0x1F6366F1), Color(0x146E46E5)],
              ),
              border: Border.all(color: const Color(0x406366F1)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('✦ AI Recommendation',
                  style: GoogleFonts.spaceMono(fontSize: 11, color: Color(0xFF818CF8), letterSpacing: 1)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0x26EF4444),
                    border: Border.all(color: const Color(0x40EF4444)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('HIGH',
                    style: GoogleFonts.spaceMono(fontSize: 9, color: Color(0xFFF87171), letterSpacing: 1)),
                ),
              ]),
              const SizedBox(height: 10),
              RichText(
                text: TextSpan(
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFC7D2FE), height: 1.6),
                  children: [
                    const TextSpan(text: 'Standard King: raise to '),
                    TextSpan(text: '\$179',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
                    const TextSpan(text: ' (was \$159). Conference demand spike +34% this weekend.'),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(children: [
                _MiniBtn(label: 'APPLY +\$2,400', primary: true),
                const SizedBox(width: 8),
                _MiniBtn(label: 'SKIP', primary: false),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _MiniBtn extends StatelessWidget {
  final String label;
  final bool primary;
  const _MiniBtn({required this.label, required this.primary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        gradient: primary
            ? const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)])
            : null,
        color: primary ? null : Colors.transparent,
        border: primary ? null : Border.all(color: const Color(0x1AFFFFFF)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
        style: GoogleFonts.spaceMono(
          fontSize: 11, fontWeight: FontWeight.w700,
          color: primary ? Colors.white : C.text3,
        )),
    );
  }
}

class _TrustBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: Color(0x0FFFFFFF)),
          bottom: BorderSide(color: Color(0x0FFFFFFF)),
        ),
        color: Color(0x04FFFFFF),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 22),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('TRUSTED BY HOTELS WORLDWIDE',
            style: GoogleFonts.spaceMono(fontSize: 11, color: C.text4, letterSpacing: 1.5)),
          for (final n in ['Meridian Hotels', 'Grand Pacific', 'Coastal Suites', 'Harborview Group'])
            Text(n,
              style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w600, color: C.text4, letterSpacing: -0.3)),
        ],
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 90),
      child: LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 800 ? 4 : 2;
        return Wrap(
          spacing: 24, runSpacing: 24,
          children: [
            for (final s in [
              ('2400+', 'Hotels Worldwide',    'across 40 countries',    C.blue),
              ('94%',   'Forecast Accuracy',   '14-day demand model',    C.green),
              ('18%',   'Avg RevPAR Lift',     'in first 90 days',       C.gold),
              ('\$4.2M','Avg Annual Gain',     'per property',           C.pink),
            ])
              SizedBox(
                width: (c.maxWidth - 24 * (cols - 1)) / cols,
                child: _StatCard(val: s.$1, label: s.$2, sub: s.$3, color: s.$4),
              ),
          ],
        );
      }),
    );
  }
}

class _StatCard extends StatefulWidget {
  final String val, label, sub;
  final Color color;
  const _StatCard({required this.val, required this.label, required this.sub, required this.color});

  @override
  State<_StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<_StatCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        transform: Matrix4.translationValues(0, _hovered ? -3 : 0, 0),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: const Color(0x08FFFFFF),
          border: Border.all(
            color: _hovered ? widget.color.withValues(alpha: 0.4) : const Color(0x12FFFFFF),
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(children: [
          Positioned(top: -10, left: 0, right: 0, child: Container(
            height: 2,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [widget.color, Colors.transparent]),
            ),
          )),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(widget.val,
              style: GoogleFonts.syne(
                fontSize: 48, fontWeight: FontWeight.w800,
                color: widget.color, letterSpacing: -2, height: 1,
              )),
            const SizedBox(height: 8),
            Text(widget.label,
              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: C.text1)),
            const SizedBox(height: 4),
            Text(widget.sub,
              style: GoogleFonts.spaceMono(fontSize: 12, color: C.text3)),
          ]),
        ]),
      ),
    );
  }
}

class _FeaturesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final features = [
      ('◈', 'AI PRICING ENGINE',    'Dynamic Rates, 24/7',
        'AI adjusts every room type every hour based on demand signals, competitor moves, and booking pace.',
        C.blue, const Color(0x266366F1)),
      ('⌖', 'DEMAND FORECASTING',   '14-Day Demand Vision',
        'Trained on 90 days of your history. Detects events, weekday vs weekend patterns, and gives confidence-graded predictions.',
        C.green, const Color(0x1F10B981)),
      ('⊞', 'COMP INTELLIGENCE',    'Know Your Competition',
        'Real-time rate tracking across all major OTAs. See exactly where you stand and get AI recommendations to win on price.',
        C.gold, const Color(0x1FF59E0B)),
      ('▦', 'REVENUE CALENDAR',     'Spot Gaps Instantly',
        'Color-coded monthly view of occupancy, ADR, and revenue per day. Identify soft dates before they cost you.',
        C.pink, const Color(0x1FEC4899)),
      ('≋', 'CHANNEL & SEGMENT',    'Where Profit Lives',
        'Break down revenue by Leisure, Business, Group, and OTA. Understand which channels are driving margin.',
        C.teal, const Color(0x1F14B8A6)),
      ('⌇', 'AUTOMATED REPORTS',    'Boardroom-Ready Reports',
        'Monthly revenue summaries, pickup reports, and comp analyses — generated overnight and ready to share.',
        C.purple, const Color(0x1F8B5CF6)),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(64, 80, 64, 100),
      child: Column(children: [
        Text('WHAT HOTEL IQ DOES',
          style: GoogleFonts.spaceMono(fontSize: 11, color: C.blue, letterSpacing: 3)),
        const SizedBox(height: 16),
        Text('One platform to replace\nyour entire revenue stack.',
          textAlign: TextAlign.center,
          style: GoogleFonts.syne(
            fontSize: 42, fontWeight: FontWeight.w800,
            color: Colors.white, letterSpacing: -1.5, height: 1.1,
          )),
        const SizedBox(height: 72),
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth > 900 ? 3 : c.maxWidth > 600 ? 2 : 1;
          return Wrap(
            spacing: 20, runSpacing: 20,
            children: [
              for (final f in features)
                SizedBox(
                  width: (c.maxWidth - 20 * (cols - 1)) / cols,
                  child: _FeatureCard(
                    icon: f.$1, label: f.$2, title: f.$3,
                    desc: f.$4, color: f.$5, glow: f.$6,
                  ),
                ),
            ],
          );
        }),
      ]),
    );
  }
}

class _FeatureCard extends StatefulWidget {
  final String icon, label, title, desc;
  final Color color, glow;
  const _FeatureCard({required this.icon, required this.label, required this.title, required this.desc, required this.color, required this.glow});

  @override
  State<_FeatureCard> createState() => _FeatureCardState();
}

class _FeatureCardState extends State<_FeatureCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        transform: Matrix4.translationValues(0, _hovered ? -4 : 0, 0),
        padding: const EdgeInsets.fromLTRB(30, 32, 30, 36),
        decoration: BoxDecoration(
          color: _hovered ? widget.glow : const Color(0x06FFFFFF),
          border: Border.all(
            color: _hovered
                ? widget.color.withValues(alpha: 0.5)
                : const Color(0x12FFFFFF),
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 50, height: 50,
            decoration: BoxDecoration(
              color: widget.color.withValues(alpha: 0.15),
              border: Border.all(color: widget.color.withValues(alpha: 0.35)),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: widget.color.withValues(alpha: 0.25), blurRadius: 20)],
            ),
            child: Center(
              child: Text(widget.icon, style: TextStyle(fontSize: 22, color: widget.color)),
            ),
          ),
          const SizedBox(height: 22),
          Text(widget.label,
            style: GoogleFonts.spaceMono(fontSize: 9, color: widget.color, letterSpacing: 2)),
          const SizedBox(height: 10),
          Text(widget.title,
            style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -0.3)),
          const SizedBox(height: 12),
          Text(widget.desc,
            style: GoogleFonts.inter(fontSize: 14, color: C.text3, height: 1.8)),
        ]),
      ),
    );
  }
}

class _HowItWorks extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final steps = [
      ('01', 'Connect Your Property', 'Sync your PMS in minutes. Hotel IQ pulls historical bookings, rates, and channel data automatically.'),
      ('02', 'AI Learns Your Patterns', 'Our models train on your hotel\'s seasonality, events, and comp set within 48 hours of connection.'),
      ('03', 'Approve & Earn More', 'Review AI pricing recommendations daily. One click to apply. Track the revenue impact in real time.'),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Color(0x04FFFFFF),
        border: Border.symmetric(
          horizontal: BorderSide(color: Color(0x0FFFFFFF)),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 90),
      child: Column(children: [
        Text('HOW IT WORKS', style: GoogleFonts.spaceMono(fontSize: 11, color: C.gold, letterSpacing: 3)),
        const SizedBox(height: 16),
        Text('Up and earning in 48 hours.',
          style: GoogleFonts.syne(fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
        const SizedBox(height: 60),
        LayoutBuilder(builder: (_, c) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: List.generate(steps.length, (i) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < 2 ? 40 : 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(steps[i].$1,
                    style: GoogleFonts.syne(
                      fontSize: 48, fontWeight: FontWeight.w800,
                      color: const Color(0x336366F1), letterSpacing: -2, height: 1,
                    )),
                  const SizedBox(height: 20),
                  Text(steps[i].$2,
                    style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -0.3)),
                  const SizedBox(height: 12),
                  Text(steps[i].$3,
                    style: GoogleFonts.inter(fontSize: 14, color: C.text3, height: 1.8)),
                ]),
              ),
            )),
          );
        }),
      ]),
    );
  }
}

class _Testimonials extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final testimonials = [
      (
        '"Hotel IQ increased our RevPAR by 22% in the first quarter. The AI demand forecasting is eerily accurate — it predicted a local event we didn\'t even know about."',
        'Sarah Mitchell', 'Director of Revenue, The Grand Coastal', '+22% RevPAR', C.green,
      ),
      (
        '"We replaced three separate tools with Hotel IQ. The comp set intelligence alone saved us 10 hours a week. The ROI was clear within the first 30 days."',
        'James Thornton', 'VP Revenue Management, Meridian Hotels', '3 tools replaced', C.blue,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 90),
      child: Column(children: [
        Text('WHAT HOTELS SAY', style: GoogleFonts.spaceMono(fontSize: 11, color: C.pink, letterSpacing: 3)),
        const SizedBox(height: 16),
        Text('Revenue results, not promises.',
          style: GoogleFonts.syne(fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
        const SizedBox(height: 60),
        LayoutBuilder(builder: (_, c) {
          return c.maxWidth > 700
              ? Row(children: testimonials.map((t) => Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: testimonials.indexOf(t) == 0 ? 24 : 0),
                    child: _TestimonialCard(quote: t.$1, name: t.$2, role: t.$3, metric: t.$4, color: t.$5),
                  ),
                )).toList())
              : Column(children: testimonials.map((t) => Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: _TestimonialCard(quote: t.$1, name: t.$2, role: t.$3, metric: t.$4, color: t.$5),
                )).toList());
        }),
      ]),
    );
  }
}

class _TestimonialCard extends StatelessWidget {
  final String quote, name, role, metric;
  final Color color;
  const _TestimonialCard({required this.quote, required this.name, required this.role, required this.metric, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(36, 36, 36, 32),
      decoration: BoxDecoration(
        color: const Color(0x08FFFFFF),
        border: Border.all(color: const Color(0x14FFFFFF)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Stack(children: [
        Positioned(top: -1, left: 0, right: 0, child: Container(
          height: 2,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [color.withValues(alpha: 0.8), Colors.transparent]),
          ),
        )),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: List.generate(5, (_) => const Text('★', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 14)))),
          const SizedBox(height: 20),
          Text(quote,
            style: GoogleFonts.inter(fontSize: 16, color: C.text2, height: 1.85, fontStyle: FontStyle.italic)),
          const SizedBox(height: 28),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: C.text1)),
              const SizedBox(height: 3),
              Text(role, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                border: Border.all(color: color.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(metric,
                style: GoogleFonts.spaceMono(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
            ),
          ]),
        ]),
      ]),
    );
  }
}

class _CtaSection extends StatelessWidget {
  final VoidCallback onGetStarted, onSignIn;
  const _CtaSection({required this.onGetStarted, required this.onSignIn});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 100),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0x0FFFFFFF))),
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1,
          colors: [Color(0x1A6366F1), Colors.transparent],
        ),
      ),
      child: Column(children: [
        Text('GET STARTED TODAY',
          style: GoogleFonts.spaceMono(fontSize: 11, color: C.blue, letterSpacing: 3)),
        const SizedBox(height: 20),
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(children: [
            TextSpan(text: 'Your competitors are already\n',
              style: GoogleFonts.syne(fontSize: 48, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -2, height: 1.1)),
            TextSpan(text: 'using AI pricing.',
              style: GoogleFonts.syne(
                fontSize: 48, fontWeight: FontWeight.w800, letterSpacing: -2, height: 1.1,
                foreground: Paint()
                  ..shader = const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFF97316)],
                  ).createShader(const Rect.fromLTWH(0, 0, 500, 60)),
              )),
          ]),
        ),
        const SizedBox(height: 20),
        Text(
          'Join 2,400+ hotels using Hotel IQ to make smarter revenue decisions every single day.\nFree 14-day trial. No credit card.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 17, color: C.text3, height: 1.75),
        ),
        const SizedBox(height: 40),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _GradBtn(label: 'Create Free Account →', onTap: onGetStarted),
          const SizedBox(width: 14),
          OutlinedButton(
            onPressed: onSignIn,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0x1FFFFFFF)),
              foregroundColor: C.text3,
              padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Sign In', style: GoogleFonts.inter(fontSize: 16, color: C.text3)),
          ),
        ]),
        const SizedBox(height: 24),
        Text('No credit card · Cancel anytime · Full dashboard access from day 1',
          style: GoogleFonts.spaceMono(fontSize: 12, color: C.text4, letterSpacing: 0.5)),
      ]),
    );
  }
}

class _Footer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0x0FFFFFFF))),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 64, vertical: 36),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Row(children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text('IQ', style: GoogleFonts.syne(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white)),
            ),
          ),
          const SizedBox(width: 10),
          Text.rich(TextSpan(children: [
            TextSpan(text: 'Hotel', style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 15, color: Colors.white)),
            TextSpan(text: 'IQ', style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 15, color: C.gold)),
          ])),
          const SizedBox(width: 12),
          Text('© ${DateTime.now().year} Hotel IQ. All rights reserved.',
            style: GoogleFonts.inter(fontSize: 12, color: C.text4)),
        ]),
        Row(children: [
          for (final l in ['Privacy', 'Terms', 'Security', 'Contact'])
            Padding(
              padding: const EdgeInsets.only(left: 28),
              child: Text(l, style: GoogleFonts.inter(fontSize: 13, color: C.text4)),
            ),
        ]),
      ]),
    );
  }
}
