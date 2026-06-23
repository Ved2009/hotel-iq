import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../data/mock_data.dart';
import '../../../models/models.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';

const _prompts = [
  'What is my optimal rate this weekend?',
  'How do I grow RevPAR by 10%?',
  'Analyse my comp set position',
  'Is my ADR competitive right now?',
  'What\'s driving my demand forecast?',
  'How should I price the conference period?',
  'Which room type has the best yield?',
  'Should I adjust my minimum stay restrictions?',
];

class AiAnalystTab extends StatefulWidget {
  const AiAnalystTab({super.key});
  @override
  State<AiAnalystTab> createState() => _AiAnalystTabState();
}

class _AiAnalystTabState extends State<AiAnalystTab> {
  final _inputCtrl  = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _loading = false;
  List<ChatMessage> _msgs = [
    const ChatMessage(
      role: 'assistant',
      text: "I'm your Hotel IQ Revenue Analyst — powered by Claude AI.\n\nI have full context on your property metrics, demand forecast, comp set, and open pricing recommendations. Ask me anything.",
    ),
  ];

  @override
  void dispose() { _inputCtrl.dispose(); _scrollCtrl.dispose(); super.dispose(); }

  void _scroll() => WidgetsBinding.instance.addPostFrameCallback((_) {
    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }
  });

  Future<void> _send([String? preset]) async {
    final txt = (preset ?? _inputCtrl.text).trim();
    if (txt.isEmpty || _loading) return;
    _inputCtrl.clear();
    setState(() { _msgs = [..._msgs, ChatMessage(role: 'user', text: txt)]; _loading = true; });
    _scroll();

    final prov = context.read<AppProvider>();
    final user = prov.user;
    final m    = prov.property?.metrics;
    final p    = prov.property?.profile;

    final ctx = '''You are Hotel IQ Revenue Analyst, an expert hotel revenue management AI.
Property: ${user?.hotelName ?? p?.hotelName ?? 'The Grand Coastal'} | Location: ${p?.location ?? 'Not set'} | Stars: ${p?.stars ?? 4} | Rooms: ${p?.totalRooms ?? 292}
Manager: ${user?.firstName ?? 'Demo User'}

Live Metrics:
- Occupancy: ${m?.occupancy ?? 73}%
- ADR: \$${m?.adr ?? 195}
- RevPAR: \$${m?.revpar ?? 142}
- TRevPAR: \$${m?.trevpar ?? 168}
- GOPPAR: \$${m?.goppar ?? 89}
- Revenue MTD: \$${m?.revenueMtd ?? 89400}
${m?.hasData == true ? '- Data last updated: ${m!.updatedAt}' : '- NOTE: Using demo metrics. User has not connected live data yet.'}

Comp Set (current rates):
- Grand Regency (5★): \$210 ↓1.5%
- The Meridian (5★): \$220 steady
- Blue Harbor (3★): \$175 ↑5.1%
- Harbor View (4★): \$195 ↓0.8%
- Coastal Suites (3★): \$165 ↑2.3%
Your position: #3 of 6 | Avg comp rate: \$193 | AI target rate: \$195

Demand Forecast:
- 7-day avg demand: 81% (HIGH)
- Forecast accuracy: 94.2%
- Event detected: Regional tech conference Day 6-8 (+34% demand spike)
- Projected 7-day revenue: \$41,200

Open Pricing Recommendations:
1. Standard King: \$159 → \$179 (+\$2,400 impact) | HIGH urgency
2. Double Queen: \$139 → \$155 (+\$1,100 impact) | HIGH urgency
3. Junior Suite: \$229 → \$249 (+\$880 impact) | HIGH urgency
4. Ocean View Suite: \$289 → \$269 (-\$800 impact) | MEDIUM urgency (3 comps dropped below)
Total open opportunity: +\$4,380

Instructions: Be concise, data-driven, and specific. Give concrete \$ and % figures. When the user's question is about pricing, reference the specific room types and competitor context. If metrics show demo data, still give useful guidance based on the demo numbers.''';

    final history = _msgs.skip(1)
        .map((m) => {'role': m.role, 'content': m.text})
        .cast<Map<String, String>>().toList();
    history.add({'role': 'user', 'content': txt});

    final res = await prov.api.chat(ctx, history);
    if (!mounted) return;

    setState(() {
      _msgs = [..._msgs, ChatMessage(role: 'assistant', text: res.ok ? res.data! : '⚠ ${res.error}\n\nMake sure you\'re signed in and the API is connected.')];
      _loading = false;
    });
    _scroll();
  }

  void _clear() => setState(() {
    _msgs = [const ChatMessage(role: 'assistant', text: "Conversation cleared. What would you like to analyse?")];
  });

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().user;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Header
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 16)],
              ),
              child: const Center(child: Text('✦', style: TextStyle(fontSize: 16, color: Colors.white))),
            ),
            const SizedBox(width: 14),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('AI Revenue Analyst',
                style: GoogleFonts.syne(fontSize: 24, fontWeight: FontWeight.w700, color: C.text1, letterSpacing: -0.5)),
              Text('Powered by Claude · Full hotel context loaded',
                style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
            ]),
          ]),
        ]),
        Row(children: [
          if (_msgs.length > 1)
            GestureDetector(
              onTap: _clear,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: C.border),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('Clear chat', style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
              ),
            ),
          if (user == null) ...[
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: C.orange.withValues(alpha: 0.1),
                border: Border.all(color: C.orange.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('Sign in to use AI', style: GoogleFonts.spaceMono(fontSize: 10, color: C.orange, letterSpacing: 0.5)),
            ),
          ],
        ]),
      ]),
      const SizedBox(height: 24),

      // Chat area
      LayoutBuilder(builder: (_, c) {
        final wide = c.maxWidth > 900;
        return wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(flex: 3, child: _ChatArea(
                  msgs: _msgs, loading: _loading,
                  scrollCtrl: _scrollCtrl,
                  inputCtrl: _inputCtrl,
                  onSend: _send,
                  hasUser: user != null,
                )),
                const SizedBox(width: 20),
                SizedBox(width: 260, child: _SidePanel(onPrompt: _send)),
              ])
            : Column(children: [
                _ChatArea(msgs: _msgs, loading: _loading, scrollCtrl: _scrollCtrl, inputCtrl: _inputCtrl, onSend: _send, hasUser: user != null),
                const SizedBox(height: 16),
                _SidePanel(onPrompt: _send),
              ]);
      }),
    ]);
  }
}

class _ChatArea extends StatelessWidget {
  final List<ChatMessage> msgs;
  final bool loading, hasUser;
  final ScrollController scrollCtrl;
  final TextEditingController inputCtrl;
  final Future<void> Function([String?]) onSend;

  const _ChatArea({
    required this.msgs, required this.loading, required this.hasUser,
    required this.scrollCtrl, required this.inputCtrl, required this.onSend,
  });

  @override
  Widget build(BuildContext context) => Column(children: [
    // Messages
    Container(
      height: 480,
      decoration: BoxDecoration(
        color: C.surf1.withValues(alpha: 0.5),
        border: Border.all(color: C.border),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: ListView(
        controller: scrollCtrl,
        padding: const EdgeInsets.all(20),
        children: [
          for (final msg in msgs) _Bubble(msg: msg),
          if (loading) _TypingIndicator(),
        ],
      ),
    ),
    // Input
    Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: C.surf2,
        border: Border.all(color: C.border),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
      ),
      child: Row(children: [
        Expanded(
          child: TextField(
            controller: inputCtrl,
            enabled: hasUser,
            onSubmitted: (_) => onSend(),
            style: GoogleFonts.inter(fontSize: 14, color: C.text1),
            maxLines: null,
            decoration: InputDecoration(
              hintText: hasUser
                  ? 'Ask about pricing, demand, competitors, revenue strategy…'
                  : 'Sign in to use the AI Analyst',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              filled: true,
              fillColor: Colors.transparent,
              contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            ),
          ),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: hasUser && !loading ? onSend : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            width: 46, height: 46,
            decoration: BoxDecoration(
              gradient: hasUser && !loading
                  ? const LinearGradient(colors: [C.violet, C.violetDark])
                  : null,
              color: hasUser && !loading ? null : C.glass,
              borderRadius: BorderRadius.circular(12),
              boxShadow: hasUser && !loading
                  ? [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 16)]
                  : null,
            ),
            child: Center(child: Text('↑',
              style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700,
                color: hasUser && !loading ? Colors.white : C.text4))),
          ),
        ),
      ]),
    ),
  ]);
}

class _Bubble extends StatelessWidget {
  final ChatMessage msg;
  const _Bubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(child: Text('✦', style: TextStyle(fontSize: 11, color: Colors.white))),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: isUser
                    ? LinearGradient(colors: [C.violet.withValues(alpha: 0.2), C.violetDark.withValues(alpha: 0.1)])
                    : null,
                color: isUser ? null : C.glass,
                border: Border.all(
                  color: isUser ? C.violet.withValues(alpha: 0.35) : C.border,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(msg.text,
                style: GoogleFonts.inter(
                  fontSize: 14, height: 1.7,
                  color: isUser ? const Color(0xFFD4C6FF) : C.text2,
                )),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(child: Text('✦', style: TextStyle(fontSize: 11, color: Colors.white))),
      ),
      const SizedBox(width: 10),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(color: C.glass, border: Border.all(color: C.border), borderRadius: BorderRadius.circular(16)),
        child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) => AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) {
            final v = ((_ctrl.value - i * 0.2) % 1.0).clamp(0.0, 1.0);
            final a = v < 0.5 ? v * 2 : (1 - v) * 2;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: 7, height: 7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: C.violetLight.withValues(alpha: a.clamp(0.2, 1.0)),
              ),
            );
          },
        ))),
      ),
    ]),
  );
}

class _SidePanel extends StatelessWidget {
  final Future<void> Function([String?]) onPrompt;
  const _SidePanel({required this.onPrompt});

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text('Quick Prompts',
      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: C.text1)),
    const SizedBox(height: 4),
    Text('Tap to ask instantly',
      style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
    const SizedBox(height: 16),
    for (final p in _prompts)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: _PromptChip(text: p, onTap: () => onPrompt(p)),
      ),
    const SizedBox(height: 24),
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: C.violet.withValues(alpha: 0.06),
        border: Border.all(color: C.violet.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Context Loaded', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: C.violetLight)),
        const SizedBox(height: 12),
        for (final item in [
          ('✓', 'Live metrics'),
          ('✓', 'Comp set rates'),
          ('✓', '14-day forecast'),
          ('✓', 'Open pricing recs'),
          ('✓', 'Hotel profile'),
        ])
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(children: [
              Text(item.$1, style: const TextStyle(fontSize: 11, color: C.green)),
              const SizedBox(width: 8),
              Text(item.$2, style: GoogleFonts.inter(fontSize: 12, color: C.text2)),
            ]),
          ),
      ]),
    ),
  ]);
}

class _PromptChip extends StatefulWidget {
  final String text; final VoidCallback onTap;
  const _PromptChip({required this.text, required this.onTap});
  @override State<_PromptChip> createState() => _PromptChipState();
}

class _PromptChipState extends State<_PromptChip> {
  bool _hov = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) => setState(() => _hov = true),
    onExit: (_) => setState(() => _hov = false),
    child: GestureDetector(
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: _hov ? C.violet.withValues(alpha: 0.1) : C.glass,
          border: Border.all(color: _hov ? C.violet.withValues(alpha: 0.35) : C.border),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Expanded(child: Text(widget.text,
            style: GoogleFonts.inter(fontSize: 12, color: _hov ? C.violetLight : C.text2, height: 1.4))),
          Text('→', style: TextStyle(color: _hov ? C.violetLight : C.text4, fontSize: 14)),
        ]),
      ),
    ),
  );
}
