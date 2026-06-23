import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class CardContainer extends StatefulWidget {
  final String? title;
  final String? subtitle;
  final Widget? action;
  final Widget child;
  final Color? accent;
  final EdgeInsetsGeometry? padding;
  final bool glass;

  const CardContainer({
    super.key,
    this.title,
    this.subtitle,
    this.action,
    required this.child,
    this.accent,
    this.padding,
    this.glass = false,
  });

  @override
  State<CardContainer> createState() => _CardContainerState();
}

class _CardContainerState extends State<CardContainer> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: const Alignment(-1, -1),
            end: const Alignment(1, 1),
            colors: [
              _hovered ? const Color(0x1AFFFFFF) : const Color(0x0DFFFFFF),
              const Color(0x05FFFFFF),
            ],
          ),
          border: Border.all(
            color: _hovered
                ? (widget.accent?.withValues(alpha: 0.3) ?? C.borderMid)
                : C.border,
            width: 1,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.4),
              blurRadius: 40,
              offset: const Offset(0, 8),
            ),
            if (_hovered && widget.accent != null)
              BoxShadow(
                color: widget.accent!.withValues(alpha: 0.08),
                blurRadius: 40,
                spreadRadius: -10,
              ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: widget.glass
              ? BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: _content(),
                )
              : _content(),
        ),
      ),
    );
  }

  Widget _content() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.accent != null)
          Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                widget.accent!.withValues(alpha: 0.9),
                widget.accent!.withValues(alpha: 0.3),
                Colors.transparent,
              ]),
            ),
          ),
        Padding(
          padding: widget.padding ?? const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.title != null || widget.action != null) ...[
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (widget.title != null)
                            Text(widget.title!,
                              style: GoogleFonts.inter(
                                fontSize: 14, fontWeight: FontWeight.w600,
                                color: C.text1, letterSpacing: -0.3,
                              )),
                          if (widget.subtitle != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 3),
                              child: Text(widget.subtitle!,
                                style: GoogleFonts.inter(fontSize: 11, color: C.text3, height: 1.4)),
                            ),
                        ],
                      ),
                    ),
                    if (widget.action != null) widget.action!,
                  ],
                ),
                const SizedBox(height: 20),
              ],
              widget.child,
            ],
          ),
        ),
      ],
    );
  }
}
