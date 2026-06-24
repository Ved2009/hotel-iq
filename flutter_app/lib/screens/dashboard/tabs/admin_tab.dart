import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../providers/app_provider.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/section_header.dart';

class AdminTab extends StatefulWidget {
  const AdminTab({super.key});
  @override
  State<AdminTab> createState() => _AdminTabState();
}

class _AdminTabState extends State<AdminTab> {
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _invites = [];
  bool _loading = true;
  String? _error;
  final Set<String> _acting = {};
  String? _newInviteLink;
  bool _generatingInvite = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    final api = context.read<AppProvider>().api;
    final usersRes  = await api.listUsers();
    final invitesRes = await api.listInvites();
    if (!mounted) return;
    if (usersRes.ok) {
      setState(() {
        _users   = (usersRes.data  as List).cast<Map<String, dynamic>>();
        _invites = invitesRes.ok ? (invitesRes.data as List).cast<Map<String, dynamic>>() : [];
        _loading = false;
      });
    } else {
      setState(() { _error = usersRes.error; _loading = false; });
    }
  }

  Future<void> _generateInvite() async {
    setState(() { _generatingInvite = true; _newInviteLink = null; });
    final res = await context.read<AppProvider>().api.generateInvite();
    if (!mounted) return;
    setState(() {
      _generatingInvite = false;
      _newInviteLink = res.ok ? res.data!['link'] as String : null;
    });
    if (res.ok) await _load();
  }

  Future<void> _approve(String id) async {
    setState(() => _acting.add(id));
    await context.read<AppProvider>().api.approveUser(id);
    await _load();
    _acting.remove(id);
  }

  Future<void> _deactivate(String id) async {
    setState(() => _acting.add(id));
    await context.read<AppProvider>().api.deactivateUser(id);
    await _load();
    _acting.remove(id);
  }

  @override
  Widget build(BuildContext context) {
    final pending     = _users.where((u) => u['status'] == 'pending').toList();
    final active      = _users.where((u) => u['isApproved'] == true).toList();
    final deactivated = _users.where((u) => u['status'] == 'deactivated').toList();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SectionHeader(
        title: 'Admin Panel',
        sub: 'Manage user access — only visible to you',
        live: false,
        right: GestureDetector(
          onTap: _load,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(border: Border.all(color: C.border), borderRadius: BorderRadius.circular(8)),
            child: Text('↻ Refresh', style: GoogleFonts.inter(fontSize: 12, color: C.text2)),
          ),
        ),
      ),
      const SizedBox(height: 24),

      // Stats
      LayoutBuilder(builder: (_, c) {
        final cols = c.maxWidth > 700 ? 3 : 1;
        return GridView.count(
          crossAxisCount: cols, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12,
          childAspectRatio: cols == 3 ? 3 : 4,
          children: [
            _StatCard('Pending Approval', '${pending.length}', C.orange, '⏳'),
            _StatCard('Active Users',     '${active.length}',  C.green,  '✓'),
            _StatCard('Total Accounts',   '${_users.length}',  C.violet, '◈'),
          ],
        );
      }),
      const SizedBox(height: 28),

      if (_loading)
        const Center(child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(color: C.violet, strokeWidth: 2),
        ))
      else if (_error != null)
        _ErrorCard(_error!, onRetry: _load)
      else ...[

        // ── Invite clients ──────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [C.violet.withValues(alpha: 0.08), C.violetDark.withValues(alpha: 0.04)]),
            border: Border.all(color: C.violet.withValues(alpha: 0.2)),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(child: Text('✉', style: TextStyle(fontSize: 16, color: Colors.white))),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Invite a Client', style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w700, color: C.text1)),
                Text('Generate a one-time link — client registers and gets instant access', style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
              ])),
              GestureDetector(
                onTap: _generatingInvite ? null : _generateInvite,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: _generatingInvite ? null : const LinearGradient(colors: [C.violet, C.violetDark]),
                    color: _generatingInvite ? C.glass : null,
                    border: _generatingInvite ? Border.all(color: C.border) : null,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: _generatingInvite ? null : [BoxShadow(color: C.violet.withValues(alpha: 0.4), blurRadius: 14)],
                  ),
                  child: Text(_generatingInvite ? 'Generating…' : '+ New Invite Link',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700,
                      color: _generatingInvite ? C.text3 : Colors.white)),
                ),
              ),
            ]),

            // New link display
            if (_newInviteLink != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: C.green.withValues(alpha: 0.06),
                  border: Border.all(color: C.green.withValues(alpha: 0.25)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    const Text('✓ ', style: TextStyle(color: C.green, fontSize: 14)),
                    Text('Invite link generated — valid for 7 days, single use',
                      style: GoogleFonts.inter(fontSize: 12, color: C.green, fontWeight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: C.glass, border: Border.all(color: C.border), borderRadius: BorderRadius.circular(8)),
                    child: SelectableText(_newInviteLink!,
                      style: GoogleFonts.spaceMono(fontSize: 11, color: C.violetLight, letterSpacing: 0.3)),
                  ),
                  const SizedBox(height: 8),
                  Text('Copy this link and send it to your client. They click it, register, and get immediate access.',
                    style: GoogleFonts.inter(fontSize: 12, color: C.text3, height: 1.4)),
                ]),
              ),
            ],

            // Recent invites
            if (_invites.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Recent Invites', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4, letterSpacing: 2)),
              const SizedBox(height: 8),
              for (final inv in _invites.take(5))
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(children: [
                    Container(width: 6, height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: inv['usedAt'] != null ? C.green : new DateTime.now().isAfter(DateTime.parse(inv['expiresAt'])) ? C.red : C.orange,
                      )),
                    const SizedBox(width: 8),
                    Expanded(child: Text(
                      inv['usedAt'] != null
                          ? 'Used by ${inv['usedBy'] ?? "someone"} on ${_fmtDate(inv['usedAt'])}'
                          : 'Pending · expires ${_fmtDate(inv['expiresAt'])}',
                      style: GoogleFonts.inter(fontSize: 11, color: C.text3),
                    )),
                    Text(_fmtDate(inv['createdAt']), style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4)),
                  ]),
                ),
            ],
          ]),
        ),
        const SizedBox(height: 28),

        // Pending approvals
        if (pending.isNotEmpty) ...[
          _SectionLabel('PENDING APPROVAL', C.orange),
          const SizedBox(height: 12),
          for (final u in pending)
            _UserCard(
              user: u,
              acting: _acting.contains(u['id']),
              actions: [
                _UserAction('Approve', C.green, () => _approve(u['id'])),
              ],
            ),
          const SizedBox(height: 24),
        ],

        // Active users
        _SectionLabel('ACTIVE USERS (${active.length})', C.green),
        const SizedBox(height: 12),
        if (active.isEmpty)
          _EmptyState('No approved users yet')
        else
          for (final u in active)
            _UserCard(
              user: u,
              acting: _acting.contains(u['id']),
              actions: u['isAdmin'] == true
                  ? [] // can't deactivate admin
                  : [_UserAction('Deactivate', C.red, () => _deactivate(u['id']))],
            ),

        // Deactivated
        if (deactivated.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionLabel('DEACTIVATED', C.text4),
          const SizedBox(height: 12),
          for (final u in deactivated)
            _UserCard(
              user: u,
              acting: _acting.contains(u['id']),
              actions: [_UserAction('Re-activate', C.violet, () => _approve(u['id']))],
            ),
        ],
      ],
    ]);
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label, value; final Color color; final String icon;
  const _StatCard(this.label, this.value, this.color, this.icon);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: C.glass,
      border: Border.all(color: C.border),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          border: Border.all(color: color.withValues(alpha: 0.3)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(child: Text(icon, style: TextStyle(fontSize: 18, color: color))),
      ),
      const SizedBox(width: 14),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: GoogleFonts.syne(fontSize: 28, fontWeight: FontWeight.w800, color: color, letterSpacing: -1)),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
      ]),
    ]),
  );
}

class _SectionLabel extends StatelessWidget {
  final String text; final Color color;
  const _SectionLabel(this.text, this.color);
  @override
  Widget build(BuildContext context) => Text(text,
    style: GoogleFonts.spaceMono(fontSize: 10, color: color, letterSpacing: 2));
}

class _UserAction {
  final String label; final Color color; final VoidCallback onTap;
  _UserAction(this.label, this.color, this.onTap);
}

class _UserCard extends StatelessWidget {
  final Map<String, dynamic> user;
  final bool acting;
  final List<_UserAction> actions;
  const _UserCard({required this.user, required this.acting, required this.actions});

  @override
  Widget build(BuildContext context) {
    final status   = user['status'] as String? ?? 'pending';
    final isAdmin  = user['isAdmin'] == true;
    final statusColor = status == 'active' ? C.green
        : status == 'deactivated' ? C.text4
        : C.orange;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: C.glass,
        border: Border.all(color: C.border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        // Avatar
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [
              C.violet.withValues(alpha: 0.3),
              C.violetDark.withValues(alpha: 0.2),
            ]),
            shape: BoxShape.circle,
          ),
          child: Center(child: Text(
            (user['firstName'] as String? ?? 'U').substring(0, 1).toUpperCase(),
            style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w800, color: C.violetLight),
          )),
        ),
        const SizedBox(width: 16),

        // Info
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim(),
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: C.text1)),
            if (isAdmin) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: C.gold.withValues(alpha: 0.1),
                  border: Border.all(color: C.gold.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text('ADMIN', style: GoogleFonts.spaceMono(fontSize: 8, color: C.gold, letterSpacing: 1)),
              ),
            ],
          ]),
          const SizedBox(height: 2),
          Text(user['email'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: C.text3)),
          const SizedBox(height: 4),
          Row(children: [
            Text(user['hotelName'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: C.text2)),
            const SizedBox(width: 12),
            Container(
              width: 6, height: 6,
              decoration: BoxDecoration(shape: BoxShape.circle, color: statusColor),
            ),
            const SizedBox(width: 6),
            Text(status.toUpperCase(),
              style: GoogleFonts.spaceMono(fontSize: 8, color: statusColor, letterSpacing: 1)),
          ]),
        ])),

        // Joined date
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('Joined', style: GoogleFonts.spaceMono(fontSize: 9, color: C.text4, letterSpacing: 1)),
          const SizedBox(height: 3),
          Text(_fmtDate(user['createdAt']),
            style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
        ]),
        const SizedBox(width: 16),

        // Actions
        if (acting)
          const SizedBox(width: 80, child: Center(
            child: SizedBox(width: 18, height: 18,
              child: CircularProgressIndicator(color: C.violet, strokeWidth: 2)),
          ))
        else
          Row(children: actions.map((a) => Padding(
            padding: const EdgeInsets.only(left: 8),
            child: GestureDetector(
              onTap: a.onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: a.color.withValues(alpha: 0.1),
                  border: Border.all(color: a.color.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(a.label,
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: a.color)),
              ),
            ),
          )).toList()),
      ]),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String text;
  const _EmptyState(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 20),
    child: Text(text, style: GoogleFonts.inter(fontSize: 13, color: C.text3)),
  );
}

class _ErrorCard extends StatelessWidget {
  final String error; final VoidCallback onRetry;
  const _ErrorCard(this.error, {required this.onRetry});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: C.red.withValues(alpha: 0.06),
      border: Border.all(color: C.red.withValues(alpha: 0.2)),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(children: [
      const Text('⚠', style: TextStyle(fontSize: 20)),
      const SizedBox(width: 12),
      Expanded(child: Text(error, style: GoogleFonts.inter(fontSize: 13, color: C.text2))),
      GestureDetector(
        onTap: onRetry,
        child: Text('Retry', style: GoogleFonts.inter(fontSize: 13, color: C.violet, fontWeight: FontWeight.w600)),
      ),
    ]),
  );
}

String _fmtDate(dynamic iso) {
  if (iso == null) return '—';
  try {
    final d = DateTime.parse(iso.toString());
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${m[d.month-1]} ${d.day}, ${d.year}';
  } catch (_) { return '—'; }
}
