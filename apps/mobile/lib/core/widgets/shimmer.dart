import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A dependency-free shimmer: sweeps a light highlight across its child via a
/// moving gradient ShaderMask. Wrap any skeleton layout (grey boxes) in it.
class Shimmer extends StatefulWidget {
  final Widget child;
  const Shimmer({super.key, required this.child});

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const base = AppColors.hairline; // #E2E8F0
    const highlight = Color(0xFFF4F7FB);
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        final t = _c.value; // 0..1
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (rect) => LinearGradient(
            begin: Alignment(-1 - 2 * (1 - t), 0),
            end: Alignment(1 - 2 * (1 - t) + 1, 0),
            colors: const [base, highlight, base],
            stops: const [0.35, 0.5, 0.65],
          ).createShader(rect),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// A single grey skeleton block.
class SkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  const SkeletonBox({super.key, this.width, this.height = 12, this.radius = 6});

  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.hairline,
          borderRadius: BorderRadius.circular(radius),
        ),
      );
}

/// Skeleton placeholder for a trip result card (mirrors _TripCard's layout).
class TripCardSkeleton extends StatelessWidget {
  const TripCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const SkeletonBox(width: 40, height: 40, radius: 10),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(width: 150, height: 14),
                  SizedBox(height: 8),
                  SkeletonBox(width: 100, height: 11),
                ],
              ),
            ),
            const SkeletonBox(width: 32, height: 12),
          ]),
          const SizedBox(height: 12),
          const SkeletonBox(width: 120, height: 12),
          const SizedBox(height: 8),
          const SkeletonBox(width: 200, height: 11),
          const Divider(height: 22),
          Row(children: [
            const SkeletonBox(width: 80, height: 12),
            const Spacer(),
            const SkeletonBox(width: 70, height: 18),
            const SizedBox(width: 12),
            const SkeletonBox(width: 64, height: 32, radius: 10),
          ]),
        ],
      ),
    );
  }
}

/// Skeleton placeholder for a booking/ticket list row.
class BookingCardSkeleton extends StatelessWidget {
  const BookingCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(children: [
        const SkeletonBox(width: 44, height: 44, radius: 10),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              SkeletonBox(width: 140, height: 13),
              SizedBox(height: 8),
              SkeletonBox(width: 90, height: 11),
              SizedBox(height: 8),
              SkeletonBox(width: 110, height: 11),
            ],
          ),
        ),
        const SkeletonBox(width: 56, height: 22, radius: 11),
      ]),
    );
  }
}

/// A scrollable list of skeletons (so pull-to-refresh still works while loading).
class SkeletonList extends StatelessWidget {
  final int count;
  final Widget Function(BuildContext, int) itemBuilder;
  const SkeletonList({super.key, this.count = 5, required this.itemBuilder});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: itemBuilder,
      ),
    );
  }
}
