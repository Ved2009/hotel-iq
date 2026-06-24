import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String token;
  const ResetPasswordScreen({super.key, required this.token});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _pwd    = TextEditingController();
  final _pwd2   = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _done = false;

  @override
  void dispose() { _pwd.dispose(); _pwd2.dispose(); super.dispose(); }

  Future<void> _submit() async {
    final p1 = _pwd.text;
    final p2 = _pwd2.text;
    if (p1.length < 8) { setState(() => _error = 'Password must be at least 8 characters'); return; }
    if (p1 != p2)      { setState(() => _error = 'Passwords do not match'); return; }

    setState(() { _loading = true; _error = null; });
    final res = await context.read<AppProvider>().api.resetPassword(widget.token, p1);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) { _done = true; }
      else { _error = res.error; }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.bg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            width: 460,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft, end: Alignment.bottomRight,
                colors: [Color(0xFF0E0E1C), Color(0xFF080812)],
              ),
              border: Border.all(color: C.borderMid),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 80)],
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(height: 1, decoration: BoxDecoration(
                gradient: LinearGradient(colors: [C.violet.withValues(alpha: 0.8), Colors.transparent]),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              )),
              Padding(
                padding: const EdgeInsets.all(44),
                child: _done ? _Success() : _Form(
                  pwd: _pwd, pwd2: _pwd2,
                  loading: _loading, error: _error, onSubmit: _submit,
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _Form extends StatelessWidget {
  final TextEditingController pwd, pwd2;
  final bool loading;
  final String? error;
  final VoidCallback onSubmit;
  const _Form({required this.pwd, required this.pwd2, required this.loading, required this.error, required this.onSubmit});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Logo
      RichText(text: TextSpan(children: [
        TextSpan(text: 'Hotel', style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.text1)),
        TextSpan(text: 'IQ',   style: GoogleFonts.syne(fontSize: 22, fontWeight: FontWeight.w800, color: C.gold)),
      ])),
      const SizedBox(height: 24),
      Text('Set a new password',
        style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w700, color: C.text1)),
      const SizedBox(height: 6),
      Text('Choose a strong password with at least 8 characters.',
        style: GoogleFonts.inter(fontSize: 13, color: C.text3, height: 1.5)),
      const SizedBox(height: 28),
      if (error != null) ...[
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: C.red.withValues(alpha: 0.08),
            border: Border.all(color: C.red.withValues(alpha: 0.25)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            const Text('⚠  ', style: TextStyle(fontSize: 14)),
            Expanded(child: Text(error!, style: GoogleFonts.inter(fontSize: 13, color: C.red))),
          ]),
        ),
        const SizedBox(height: 20),
      ],
      _PwdField('New Password', pwd),
      const SizedBox(height: 20),
      _PwdField('Confirm Password', pwd2),
      const SizedBox(height: 28),
      _Btn(loading: loading, onTap: onSubmit),
    ]);
  }
}

class _PwdField extends StatelessWidget {
  final String label;
  final TextEditingController ctrl;
  const _PwdField(this.label, this.ctrl);

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label.toUpperCase(),
      style: GoogleFonts.spaceMono(fontSize: 9, color: C.text3, letterSpacing: 2)),
    const SizedBox(height: 8),
    TextField(
      controller: ctrl, obscureText: true,
      style: GoogleFonts.inter(fontSize: 14, color: C.text1),
      decoration: const InputDecoration(hintText: '••••••••'),
    ),
  ]);
}

class _Btn extends StatelessWidget {
  final bool loading; final VoidCallback onTap;
  const _Btn({required this.loading, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: loading ? null : onTap,
    child: Container(
      width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        gradient: loading ? null : const LinearGradient(colors: [C.violet, C.violetDark]),
        color: loading ? C.glass : null,
        borderRadius: BorderRadius.circular(12),
        boxShadow: loading ? null : [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 20)],
      ),
      child: Center(child: Text(loading ? 'Saving…' : 'Set New Password',
        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white))),
    ),
  );
}

class _Success extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Column(children: [
    Container(
      width: 64, height: 64,
      decoration: BoxDecoration(
        color: C.green.withValues(alpha: 0.1),
        border: Border.all(color: C.green.withValues(alpha: 0.3)),
        shape: BoxShape.circle,
      ),
      child: const Center(child: Text('✓', style: TextStyle(fontSize: 32, color: C.green))),
    ),
    const SizedBox(height: 20),
    Text('Password updated!',
      style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w700, color: C.text1)),
    const SizedBox(height: 8),
    Text('Your password has been changed. You can now sign in with your new password.',
      textAlign: TextAlign.center,
      style: GoogleFonts.inter(fontSize: 13, color: C.text3, height: 1.6)),
    const SizedBox(height: 28),
    GestureDetector(
      onTap: () => context.read<AppProvider>().exitDemo(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [C.violet, C.violetDark]),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: C.violet.withValues(alpha: 0.5), blurRadius: 20)],
        ),
        child: Text('Go to Sign In →',
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
      ),
    ),
  ]);
}
