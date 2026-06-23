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

  const CardContainer({
    super.key,
    this.title,
    this.subtitle,
    this.action,
    required this.child,
    this.accent,
    this.padding,
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
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment(-0.3, -1),
            end: Alignment(0.3, 1),
            colors: [C.surf1, C.surf2],
          ),
          border: Border.all(
            color: _hovered ? C.borderHover : C.border,
            width: 1,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(color: Color(0x66000000), blurRadius: 3, offset: Offset(0, 1)),
            BoxShadow(color: Color(0x40000000), blurRadius: 32, offset: Offset(0, 8)),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.accent != null)
                Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [
                      widget.accent!.withValues(alpha: 0.8),
                      widget.accent!.withValues(alpha: 0.2),
                      Colors.transparent,
                    ]),
                  ),
                ),
              Padding(
                padding: widget.padding ?? const EdgeInsets.all(22),
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
                                      color: C.text1, letterSpacing: -0.2,
                                    )),
                                if (widget.subtitle != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 3),
                                    child: Text(widget.subtitle!,
                                      style: GoogleFonts.inter(fontSize: 11, color: C.text3)),
                                  ),
                              ],
                            ),
                          ),
                          if (widget.action != null) widget.action!,
                        ],
                      ),
                      const SizedBox(height: 18),
                    ],
                    widget.child,
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
