import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../data/mock_data.dart';
import '../../../models/models.dart';
import '../../../providers/app_provider.dart';
import '../../../services/api_service.dart';
import '../../../theme/app_theme.dart';

class AiChatPanel extends StatefulWidget {
  final VoidCallback onClose;
  const AiChatPanel({super.key, required this.onClose});

  @override
  State<AiChatPanel> createState() => _AiChatPanelState();
}

class _AiChatPanelState extends State<AiChatPanel> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _loading = false;
  List<ChatMessage> _msgs = [
    const ChatMessage(
      role: 'assistant',
      text: 'Hello! I\'m your Hotel IQ revenue analyst. Ask me anything — pricing strategy, demand outlook, competitor positioning, or revenue optimization.',
    ),
  ];

  @override
  void dispose() { _inputCtrl.dispose(); _scrollCtrl.dispose(); super.dispose(); }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send([String? text]) async {
    final txt = (text ?? _inputCtrl.text).trim();
    if (txt.isEmpty || _loading) return;
    _inputCtrl.clear();
    setState(() {
      _msgs = [..._msgs, ChatMessage(role: 'user', text: txt)];
      _loading = true;
    });
    _scrollToBottom();

    final prov = context.read<AppProvider>();
    final user = prov.user;
    final m = prov.property?.metrics;
    final p = prov.property?.profile;

    final context_ = '''You are Hotel IQ, an expert hotel revenue management AI analyst.
Hotel: ${user?.hotelName ?? p?.hotelName ?? 'The Coastal Grand'} | Location: ${p?.location ?? 'N/A'} | Manager: ${user?.firstName ?? ''}
Current Metrics: Occupancy ${m?.occupancy ?? 73}%, RevPAR \$${m?.revpar ?? 142}, ADR \$${m?.adr ?? 195}, TRevPAR \$${m?.trevpar ?? 168}, GOPPAR \$${m?.goppar ?? 89}, Revenue MTD \$${m?.revenueMtd ?? 89400}.
Comp set: Grand Regency \$210, The Meridian \$220, Harbor View \$195, Blue Harbor \$175, Coastal Suites \$165.
Open recs: Standard King \$159→\$179 (+\$2,400), Double Queen \$139→\$155 (+\$1,100), Junior Suite \$229→\$249 (+\$880).
Weekend demand spike +34% (conference). Forecast accuracy 94.2%.
Be concise, data-driven, give specific actionable advice with \$ and % figures.''';

    final history = _msgs.skip(1).map((m) => {'role': m.role, 'content': m.text}).toList();
    history.add({'role': 'user', 'content': txt});

    final res = await prov.api.chat(context_, history.cast<Map<String, String>>());
    if (!mounted) return;

    setState(() {
      _msgs = [..._msgs, ChatMessage(role: 'assistant', text: res.ok ? res.data! : '⚠ ${res.error}')];
      _loading = false;
    });
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 420,
      height: 580,
      decoration: BoxDecoration(
        color: C.surf1,
        border: Border.all(color: const Color(0x4D6366F1)),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Color(0xD9000000), blurRadius: 80, offset: Offset(0, 32))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: const BoxDecoration(
              color: Color(0x146366F1),
              border: Border(bottom: BorderSide(color: Color(0x12FFFFFF))),
            ),
            child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [C.blue, C.purple]),
                  borderRadius: BorderRadius.circular(9),
                  boxShadow: const [BoxShadow(color: Color(0x806366F1), blurRadius: 12)],
                ),
                child: const Center(child: Text('✦', style: TextStyle(fontSize: 14, color: Colors.white))),
              ),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('AI Revenue Analyst',
                  style: GoogleFonts.syne(fontWeight: FontWeight.w700, fontSize: 14, color: C.text1)),
                Text('POWERED BY CLAUDE',
                  style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
              ])),
              GestureDetector(
                onTap: widget.onClose,
                child: Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0x0DFFFFFF),
                    border: Border.all(color: const Color(0x14FFFFFF)),
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Center(
                    child: Text('✕', style: GoogleFonts.inter(fontSize: 14, color: C.text3)),
                  ),
                ),
              ),
            ]),
          ),
          // Messages
          Expanded(
            child: ListView(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(14),
              children: [
                for (final msg in _msgs)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: msg.role == 'user' ? MainAxisAlignment.end : MainAxisAlignment.start,
                      children: [
                        if (msg.role == 'assistant') ...[
                          Container(
                            width: 24, height: 24,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [C.blue, C.purple]),
                              borderRadius: BorderRadius.circular(7),
                            ),
                            child: const Center(child: Text('✦', style: TextStyle(fontSize: 10, color: Colors.white))),
                          ),
                          const SizedBox(width: 8),
                        ],
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: msg.role == 'user'
                                  ? const Color(0x266366F1)
                                  : const Color(0x0AFFFFFF),
                              border: Border.all(
                                color: msg.role == 'user'
                                    ? const Color(0x596366F1)
                                    : const Color(0x0FFFFFFF),
                              ),
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(14),
                                topRight: const Radius.circular(14),
                                bottomLeft: Radius.circular(msg.role == 'user' ? 14 : 4),
                                bottomRight: Radius.circular(msg.role == 'user' ? 4 : 14),
                              ),
                            ),
                            child: Text(msg.text,
                              style: GoogleFonts.inter(
                                fontSize: 13, height: 1.65,
                                color: msg.role == 'user'
                                    ? const Color(0xFFE0E0FF)
                                    : const Color(0xFFCBD5E1),
                              )),
                          ),
                        ),
                      ],
                    ),
                  ),
                // Quick prompts
                if (_msgs.length == 1 && !_loading)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('SUGGESTED',
                        style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 1)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6, runSpacing: 6,
                        children: quickPrompts.map((q) => GestureDetector(
                          onTap: () => _inputCtrl.text = q,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0x146366F1),
                              border: Border.all(color: const Color(0x336366F1)),
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(q,
                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF818CF8))),
                          ),
                        )).toList(),
                      ),
                    ]),
                  ),
                // Loading
                if (_loading)
                  Row(children: [
                    Container(
                      width: 24, height: 24,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [C.blue, C.purple]),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: const Center(child: Text('✦', style: TextStyle(fontSize: 10, color: Colors.white))),
                    ),
                    const SizedBox(width: 8),
                    _LoadingDots(),
                  ]),
              ],
            ),
          ),
          // Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0x4D000000),
              border: Border(top: BorderSide(color: Color(0x0FFFFFFF))),
            ),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _inputCtrl,
                  onSubmitted: (_) => _send(),
                  style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Ask about pricing, demand, strategy…',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: true,
                    fillColor: Color(0x0DFFFFFF),
                    contentPadding: EdgeInsets.symmetric(horizontal: 13, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _loading ? null : _send,
                child: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    gradient: _loading
                        ? null
                        : const LinearGradient(colors: [C.blue, Color(0xFF4F46E5)]),
                    color: _loading ? const Color(0x4D6366F1) : null,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text('→',
                      style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _LoadingDots extends StatefulWidget {
  @override
  State<_LoadingDots> createState() => _LoadingDotsState();
}

class _LoadingDotsState extends State<_LoadingDots> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Row(children: List.generate(3, (i) => AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final offset = ((_ctrl.value - i * 0.2) % 1.0).clamp(0.0, 1.0);
        final alpha = (offset < 0.5 ? offset * 2 : (1 - offset) * 2).clamp(0.2, 1.0);
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: 6, height: 6,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: C.blue.withValues(alpha: alpha),
          ),
        );
      },
    )));
  }
}
