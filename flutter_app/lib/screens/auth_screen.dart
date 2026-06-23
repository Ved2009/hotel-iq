import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  final bool isModal;
  final String initialTab;
  final VoidCallback? onClose;

  const AuthScreen({
    super.key,
    this.isModal = false,
    this.initialTab = 'login',
    this.onClose,
  });

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late String _tab;
  bool _loading = false;
  String? _error;

  final _loginEmail  = TextEditingController();
  final _loginPwd    = TextEditingController();
  final _regFirst    = TextEditingController();
  final _regLast     = TextEditingController();
  final _regHotel    = TextEditingController();
  final _regEmail    = TextEditingController();
  final _regPwd      = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tab = widget.initialTab;
  }

  @override
  void dispose() {
    for (final c in [_loginEmail, _loginPwd, _regFirst, _regLast, _regHotel, _regEmail, _regPwd]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _loading = true; _error = null; });
    final prov = context.read<AppProvider>();
    String? err;
    if (_tab == 'login') {
      err = await prov.login(_loginEmail.text.trim(), _loginPwd.text);
    } else {
      err = await prov.register(
        _regFirst.text.trim(), _regLast.text.trim(),
        _regHotel.text.trim(), _regEmail.text.trim(), _regPwd.text,
      );
    }
    if (!mounted) return;
    setState(() { _loading = false; _error = err; });
    if (err == null) widget.onClose?.call();
  }

  @override
  Widget build(BuildContext context) {
    final card = _buildCard();
    if (widget.isModal) return card;

    return Scaffold(
      backgroundColor: C.bg,
      body: Stack(children: [
        Container(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, 0),
              radius: 1.5,
              colors: [Color(0x126366F1), Colors.transparent],
            ),
          ),
        ),
        Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: card,
          ),
        ),
      ]),
    );
  }

  Widget _buildCard() {
    return Container(
      width: 460,
      decoration: BoxDecoration(
        color: const Color(0xFA0A0E16),
        border: Border.all(color: const Color(0x1AFFFFFF)),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Color(0xCC000000), blurRadius: 64, offset: Offset(0, 24)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(44),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.onClose != null)
              Align(
                alignment: Alignment.topRight,
                child: GestureDetector(
                  onTap: widget.onClose,
                  child: Container(
                    width: 28, height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0x0AFFFFFF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Center(
                      child: Text('✕',
                        style: GoogleFonts.inter(fontSize: 14, color: C.text3)),
                    ),
                  ),
                ),
              ),
            // Logo
            Text.rich(TextSpan(children: [
              TextSpan(text: 'Hotel',
                style: GoogleFonts.syne(
                  fontSize: 24, fontWeight: FontWeight.w800, color: C.text1,
                )),
              TextSpan(text: 'IQ',
                style: GoogleFonts.syne(
                  fontSize: 24, fontWeight: FontWeight.w800, color: const Color(0xFFC9A55A),
                )),
            ])),
            const SizedBox(height: 4),
            Text(
              _tab == 'login'
                  ? 'Sign in to your revenue dashboard'
                  : 'Create your free account',
              style: GoogleFonts.inter(fontSize: 13, color: C.text3),
            ),
            const SizedBox(height: 28),
            // Tabs
            _buildTabs(),
            const SizedBox(height: 28),
            // Error
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0x14EF4444),
                  border: Border.all(color: const Color(0x33EF4444)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_error!,
                  style: GoogleFonts.inter(fontSize: 13, color: C.red)),
              ),
              const SizedBox(height: 16),
            ],
            // Form
            if (_tab == 'login') _buildLoginForm() else _buildRegisterForm(),
          ],
        ),
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0x12FFFFFF))),
      ),
      child: Row(
        children: [
          for (final entry in [('login', 'Sign In'), ('register', 'Register')])
            GestureDetector(
              onTap: () => setState(() { _tab = entry.$1; _error = null; }),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _tab == entry.$1 ? C.blue : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Text(entry.$2,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: _tab == entry.$1 ? C.text1 : C.text3,
                  )),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        _Field(label: 'Email Address', controller: _loginEmail, hint: 'you@hotel.com', keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 22),
        _Field(label: 'Password', controller: _loginPwd, hint: '••••••••', obscure: true),
        const SizedBox(height: 6),
        _SubmitBtn(
          loading: _loading,
          label: 'Access Dashboard',
          onTap: _submit,
        ),
        const SizedBox(height: 18),
        Center(
          child: Text('Forgot password?',
            style: GoogleFonts.inter(fontSize: 13, color: C.blue)),
        ),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      children: [
        Row(children: [
          Expanded(child: _Field(label: 'First Name', controller: _regFirst, hint: 'Jane')),
          const SizedBox(width: 16),
          Expanded(child: _Field(label: 'Last Name', controller: _regLast, hint: 'Smith')),
        ]),
        const SizedBox(height: 22),
        _Field(label: 'Hotel Name', controller: _regHotel, hint: 'The Grand Hotel'),
        const SizedBox(height: 22),
        _Field(label: 'Email Address', controller: _regEmail, hint: 'jane@hotel.com', keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 22),
        _Field(label: 'Password', controller: _regPwd, hint: 'At least 6 characters', obscure: true),
        const SizedBox(height: 6),
        _SubmitBtn(
          loading: _loading,
          label: 'Create Free Account',
          onTap: _submit,
        ),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String hint;
  final bool obscure;
  final TextInputType? keyboardType;

  const _Field({
    required this.label,
    required this.controller,
    required this.hint,
    this.obscure = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
          style: GoogleFonts.spaceMono(
            fontSize: 11, color: C.text3, letterSpacing: 1.5,
          )),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: GoogleFonts.inter(fontSize: 14, color: C.text1),
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}

class _SubmitBtn extends StatelessWidget {
  final bool loading;
  final String label;
  final VoidCallback onTap;

  const _SubmitBtn({required this.loading, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: SizedBox(
        width: double.infinity,
        child: GestureDetector(
          onTap: loading ? null : onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              gradient: loading
                  ? null
                  : const LinearGradient(
                      colors: [Color(0xFF4B8EF5), Color(0xFF2563EB)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
              color: loading ? const Color(0x804B8EF5) : null,
              borderRadius: BorderRadius.circular(8),
              boxShadow: loading ? null : const [
                BoxShadow(color: Color(0x404B8EF5), blurRadius: 16, offset: Offset(0, 4)),
              ],
            ),
            child: Center(
              child: Text(
                loading ? (_label(label) == 'Access Dashboard' ? 'Signing in…' : 'Creating account…') : label,
                style: GoogleFonts.inter(
                  fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _label(String l) => l;
}
