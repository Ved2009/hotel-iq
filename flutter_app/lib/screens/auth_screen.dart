import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  final bool isModal;
  final String initialTab;
  final VoidCallback? onClose;
  final String? inviteToken;

  const AuthScreen({super.key, this.isModal = false, this.initialTab = 'login', this.onClose, this.inviteToken});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late String _tab; // 'login' | 'register' | 'forgot' | 'forgot_sent'
  bool _loading = false;
  String? _error;
  String? _success;

  final _loginEmail  = TextEditingController();
  final _loginPwd    = TextEditingController();
  final _forgotEmail = TextEditingController();
  final _regFirst   = TextEditingController();
  final _regLast    = TextEditingController();
  final _regHotel   = TextEditingController();
  final _regEmail   = TextEditingController();
  final _regPwd     = TextEditingController();

  @override
  void initState() { super.initState(); _tab = widget.initialTab; }

  @override
  void dispose() {
    for (final c in [_loginEmail, _loginPwd, _forgotEmail, _regFirst, _regLast, _regHotel, _regEmail, _regPwd]) c.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _loading = true; _error = null; _success = null; });
    final prov = context.read<AppProvider>();

    if (_tab == 'forgot') {
      final res = await prov.api.forgotPassword(_forgotEmail.text.trim());
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (res.ok) { _tab = 'forgot_sent'; }
        else { _error = res.error; }
      });
      return;
    }

    String? err;
    try {
      if (_tab == 'login') {
        err = await prov.login(_loginEmail.text.trim(), _loginPwd.text);
      } else {
        err = await prov.register(
          _regFirst.text.trim(), _regLast.text.trim(),
          _regHotel.text.trim(), _regEmail.text.trim(), _regPwd.text,
          inviteToken: widget.inviteToken,
        );
      }
    } catch (e) {
      // Guarantees the dialog can't get stuck open on an unexpected
      // exception — surfaces it instead of silently hanging forever.
      debugPrint('Auth submit failed: $e');
      err = 'Something went wrong — please try again.';
    }

    // widget.onClose pops using LandingScreen's own (stable) context, not
    // this widget's — call it regardless of whether AuthScreen itself still
    // thinks it's mounted, so a stale mounted-flag can't leave the dialog
    // stuck open with no visible error.
    if (err == null) { widget.onClose?.call(); return; }

    if (!mounted) return;
    setState(() { _loading = false; _error = err; });
  }

  @override
  Widget build(BuildContext context) {
    final card = _buildCard();
    if (widget.isModal) return card;
    return Scaffold(
      backgroundColor: C.bg,
      body: Stack(children: [
        Container(decoration: BoxDecoration(
          gradient: RadialGradient(center: const Alignment(0, -0.3), radius: 1.2,
            colors: [C.violet.withValues(alpha: 0.15), Colors.transparent]),
        )),
        Center(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: card)),
      ]),
    );
  }

  Widget _buildCard() => Container(
    width: 480,
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft, end: Alignment.bottomRight,
        colors: [Color(0xFF0E0E1C), Color(0xFF080812)],
      ),
      border: Border.all(color: C.borderMid),
      borderRadius: BorderRadius.circular(24),
      boxShadow: [
        BoxShadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 80, offset: const Offset(0, 30)),
        BoxShadow(color: C.violet.withValues(alpha: 0.08), blurRadius: 60, spreadRadius: -10),
      ],
    ),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      // Top accent
      Container(height: 1, decoration: BoxDecoration(
        gradient: LinearGradient(colors: [C.violet.withValues(alpha: 0.8), Colors.transparent]),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      )),
      Padding(
        padding: const EdgeInsets.fromLTRB(44, 40, 44, 44),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          if (widget.onClose != null)
            Align(alignment: Alignment.topRight, child: GestureDetector(
              onTap: widget.onClose,
              child: Container(
                width: 30, height: 30,
                decoration: BoxDecoration(color: C.glass, border: Border.all(color: C.border), borderRadius: BorderRadius.circular(8)),
                child: Center(child: Text('✕', style: GoogleFonts.inter(fontSize: 14, color: C.text3))),
              ),
            )),
          // Logo
          const SizedBox(height: 4),
          Row(children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 16)],
              ),
              child: Center(child: Text('IQ', style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white))),
            ),
            const SizedBox(width: 12),
            RichText(text: TextSpan(children: [
              TextSpan(text: 'Hotel', style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.text1)),
              TextSpan(text: 'IQ', style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.gold)),
            ])),
          ]),
          const SizedBox(height: 8),
          Text(_tab == 'login' ? 'Sign in to your revenue dashboard' : 'Create your free account',
            style: GoogleFonts.inter(fontSize: 13, color: C.text3)),
          const SizedBox(height: 32),
          // Tabs (hidden for forgot password screens)
          if (_tab == 'login' || _tab == 'register')
            Container(
              decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: C.border))),
              child: Row(children: [
                for (final t in [('login', 'Sign In'), ('register', 'Register')])
                  GestureDetector(
                    onTap: () => setState(() { _tab = t.$1; _error = null; _success = null; }),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(4, 0, 20, 12),
                      decoration: BoxDecoration(
                        border: Border(bottom: BorderSide(
                          color: _tab == t.$1 ? C.violet : Colors.transparent, width: 2,
                        )),
                      ),
                      child: Text(t.$2, style: GoogleFonts.inter(
                        fontSize: 14, fontWeight: FontWeight.w600,
                        color: _tab == t.$1 ? C.text1 : C.text3,
                      )),
                    ),
                  ),
              ]),
            ),
          const SizedBox(height: 28),
          // Invite banner
          if (widget.inviteToken != null && _tab == 'register') ...[
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: C.green.withValues(alpha: 0.08),
                border: Border.all(color: C.green.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Text('✓ ', style: TextStyle(color: C.green, fontSize: 16)),
                Expanded(child: Text(
                  'You\'ve been invited! Register below and you\'ll get instant access.',
                  style: GoogleFonts.inter(fontSize: 13, color: C.green, height: 1.4),
                )),
              ]),
            ),
          ],
          // Error
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: C.red.withValues(alpha: 0.08),
                border: Border.all(color: C.red.withValues(alpha: 0.25)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Text('⚠', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 10),
                Text(_error!, style: GoogleFonts.inter(fontSize: 13, color: C.red)),
              ]),
            ),
            const SizedBox(height: 20),
          ],
          if (_tab == 'login') _loginForm()
          else if (_tab == 'register') _regForm()
          else if (_tab == 'forgot') _forgotForm()
          else if (_tab == 'forgot_sent') _forgotSent(),
        ]),
      ),
    ]),
  );

  Widget _loginForm() => Column(children: [
    _Field('Email Address', _loginEmail, 'you@hotel.com', type: TextInputType.emailAddress),
    const SizedBox(height: 20),
    _Field('Password', _loginPwd, '••••••••', obscure: true),
    const SizedBox(height: 12),
    Align(
      alignment: Alignment.centerRight,
      child: GestureDetector(
        onTap: () => setState(() { _tab = 'forgot'; _error = null; _forgotEmail.text = _loginEmail.text; }),
        child: Text('Forgot password?',
          style: GoogleFonts.inter(fontSize: 12, color: C.violetLight,
            decoration: TextDecoration.underline, decorationColor: C.violetLight)),
      ),
    ),
    const SizedBox(height: 20),
    _SubmitBtn(label: 'Access Dashboard', loading: _loading, onTap: _submit),
  ]);

  Widget _forgotForm() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    GestureDetector(
      onTap: () => setState(() { _tab = 'login'; _error = null; }),
      child: Row(children: [
        const Text('←  ', style: TextStyle(color: C.violetLight)),
        Text('Back to sign in', style: GoogleFonts.inter(fontSize: 13, color: C.violetLight)),
      ]),
    ),
    const SizedBox(height: 20),
    Text('Reset Password',
      style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w700, color: C.text1)),
    const SizedBox(height: 6),
    Text('Enter your email address and we\'ll send you a link to reset your password.',
      style: GoogleFonts.inter(fontSize: 13, color: C.text3, height: 1.5)),
    const SizedBox(height: 24),
    _Field('Email Address', _forgotEmail, 'you@hotel.com', type: TextInputType.emailAddress),
    const SizedBox(height: 24),
    _SubmitBtn(label: 'Send Reset Link', loading: _loading, onTap: _submit),
  ]);

  Widget _forgotSent() => Column(children: [
    Container(
      width: 64, height: 64,
      decoration: BoxDecoration(
        color: C.green.withValues(alpha: 0.1),
        border: Border.all(color: C.green.withValues(alpha: 0.3)),
        shape: BoxShape.circle,
      ),
      child: const Center(child: Text('✉', style: TextStyle(fontSize: 28))),
    ),
    const SizedBox(height: 20),
    Text('Check your email',
      style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w700, color: C.text1)),
    const SizedBox(height: 8),
    Text(
      'We\'ve sent a password reset link to ${_forgotEmail.text}. Click the link in the email to set a new password.\n\nThe link expires in 1 hour.',
      textAlign: TextAlign.center,
      style: GoogleFonts.inter(fontSize: 13, color: C.text3, height: 1.6),
    ),
    const SizedBox(height: 24),
    GestureDetector(
      onTap: () => setState(() { _tab = 'login'; _error = null; }),
      child: Text('Back to sign in',
        style: GoogleFonts.inter(fontSize: 13, color: C.violetLight,
          decoration: TextDecoration.underline, decorationColor: C.violetLight)),
    ),
    const SizedBox(height: 8),
    GestureDetector(
      onTap: () => setState(() { _tab = 'forgot'; }),
      child: Text('Didn\'t receive it? Try again',
        style: GoogleFonts.inter(fontSize: 12, color: C.text3,
          decoration: TextDecoration.underline, decorationColor: C.text3)),
    ),
  ]);

  Widget _regForm() => Column(children: [
    Row(children: [
      Expanded(child: _Field('First Name', _regFirst, 'Jane')),
      const SizedBox(width: 14),
      Expanded(child: _Field('Last Name', _regLast, 'Smith')),
    ]),
    const SizedBox(height: 20),
    _Field('Hotel Name', _regHotel, 'The Grand Hotel'),
    const SizedBox(height: 20),
    _Field('Email', _regEmail, 'jane@hotel.com', type: TextInputType.emailAddress),
    const SizedBox(height: 20),
    _Field('Password', _regPwd, 'Min. 6 characters', obscure: true),
    const SizedBox(height: 28),
    _SubmitBtn(label: 'Create Free Account', loading: _loading, onTap: _submit),
  ]);
}

class _Field extends StatelessWidget {
  final String label, hint;
  final TextEditingController ctrl;
  final bool obscure;
  final TextInputType? type;
  const _Field(this.label, this.ctrl, this.hint, {this.obscure = false, this.type});

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label.toUpperCase(),
      style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 2)),
    const SizedBox(height: 8),
    TextField(
      controller: ctrl, obscureText: obscure, keyboardType: type,
      style: GoogleFonts.inter(fontSize: 14, color: C.text1),
      decoration: InputDecoration(hintText: hint),
    ),
  ]);
}

class _SubmitBtn extends StatefulWidget {
  final String label; final bool loading; final VoidCallback onTap;
  const _SubmitBtn({required this.label, required this.loading, required this.onTap});
  @override State<_SubmitBtn> createState() => _SubmitBtnState();
}

class _SubmitBtnState extends State<_SubmitBtn> {
  bool _hov = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) => setState(() => _hov = true),
    onExit: (_) => setState(() => _hov = false),
    child: GestureDetector(
      onTap: widget.loading ? null : widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        transform: Matrix4.translationValues(0, _hov && !widget.loading ? -2 : 0, 0),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: widget.loading
              ? null
              : LinearGradient(colors: [
                  _hov ? C.violetLight : C.violet,
                  C.violetDark,
                ]),
          color: widget.loading ? C.violet.withValues(alpha: 0.4) : null,
          borderRadius: BorderRadius.circular(12),
          boxShadow: widget.loading || !_hov ? null : [
            BoxShadow(color: C.violet.withValues(alpha: 0.6), blurRadius: 24, offset: const Offset(0, 6)),
          ],
        ),
        child: Center(child: Text(
          widget.loading ? 'Please wait…' : widget.label,
          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
        )),
      ),
    ),
  );
}
