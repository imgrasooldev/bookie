import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../../../config.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models.dart';

String _fullUrl(String relative) => relative.startsWith('http') ? relative : '$apiBaseUrl$relative';

/// Attractive swipeable gallery of the bus's photos & videos. Inline carousel
/// (with a peek of the next card) + tap to open an immersive fullscreen viewer.
class VehicleGallery extends StatefulWidget {
  final List<TripMedia> media;
  const VehicleGallery({super.key, required this.media});

  @override
  State<VehicleGallery> createState() => _VehicleGalleryState();
}

class _VehicleGalleryState extends State<VehicleGallery> {
  final _pc = PageController(viewportFraction: 0.86);
  int _page = 0;

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  void _open(int index) {
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black,
      pageBuilder: (_, a, __) => FadeTransition(opacity: a, child: _MediaViewer(media: widget.media, initial: index)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final media = widget.media;
    if (media.isEmpty) return const SizedBox.shrink();
    final photos = media.where((m) => !m.isVideo).length;
    final videos = media.length - photos;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.photo_library_rounded, size: 18, color: AppColors.brand),
            const SizedBox(width: 8),
            const Text('Bus photos & videos', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.ink)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(20)),
              child: Text(
                videos > 0 ? '$photos 📷  ·  $videos ▶' : '$photos photos',
                style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w700, fontSize: 12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: PageView.builder(
            controller: _pc,
            itemCount: media.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (_, i) => _Card(media: media[i], index: i, total: media.length, onTap: () => _open(i)),
          ),
        ),
        const SizedBox(height: 12),
        if (media.length > 1)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(media.length, (i) {
              final on = i == _page;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                height: 7,
                width: on ? 20 : 7,
                decoration: BoxDecoration(color: on ? AppColors.brand : AppColors.hairline, borderRadius: BorderRadius.circular(4)),
              );
            }),
          ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  final TripMedia media;
  final int index;
  final int total;
  final VoidCallback onTap;
  const _Card({required this.media, required this.index, required this.total, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final url = _fullUrl(media.url);
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (media.isVideo)
                Container(color: const Color(0xFF0F172A), child: const Center(child: Icon(Icons.movie_creation_outlined, color: Colors.white24, size: 56)))
              else
                Image.network(
                  url,
                  fit: BoxFit.cover,
                  loadingBuilder: (c, w, p) => p == null ? w : Container(color: const Color(0xFFE2E8F0), child: const Center(child: CircularProgressIndicator(strokeWidth: 2))),
                  errorBuilder: (_, __, ___) => Container(color: const Color(0xFFE2E8F0), child: const Icon(Icons.broken_image_outlined, color: AppColors.muted)),
                ),
              // bottom gradient for legibility
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black.withValues(alpha: 0.45)],
                      stops: const [0.55, 1],
                    ),
                  ),
                ),
              ),
              if (media.isVideo)
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.92), shape: BoxShape.circle),
                    child: const Icon(Icons.play_arrow_rounded, color: AppColors.brand, size: 30),
                  ),
                ),
              // index pill
              Positioned(
                right: 12,
                top: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.45), borderRadius: BorderRadius.circular(20)),
                  child: Text('${index + 1}/$total', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ),
              // expand hint
              Positioned(
                left: 12,
                bottom: 12,
                child: Row(children: [
                  Icon(media.isVideo ? Icons.play_circle_outline : Icons.fullscreen_rounded, color: Colors.white, size: 16),
                  const SizedBox(width: 5),
                  Text(media.isVideo ? 'Tap to play' : 'Tap to view', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Immersive fullscreen viewer — swipe across all media, pinch-zoom photos,
/// play videos. Counter + dots + close.
class _MediaViewer extends StatefulWidget {
  final List<TripMedia> media;
  final int initial;
  const _MediaViewer({required this.media, required this.initial});

  @override
  State<_MediaViewer> createState() => _MediaViewerState();
}

class _MediaViewerState extends State<_MediaViewer> {
  late final PageController _pc = PageController(initialPage: widget.initial);
  late int _page = widget.initial;

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final media = widget.media;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pc,
            itemCount: media.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (_, i) {
              final m = media[i];
              if (m.isVideo) return _FullscreenVideo(url: _fullUrl(m.url), active: i == _page);
              return InteractiveViewer(
                minScale: 1,
                maxScale: 4,
                child: Center(
                  child: Image.network(
                    _fullUrl(m.url),
                    fit: BoxFit.contain,
                    loadingBuilder: (c, w, p) => p == null ? w : const Center(child: CircularProgressIndicator(color: Colors.white)),
                    errorBuilder: (_, __, ___) => const Icon(Icons.broken_image_outlined, color: Colors.white54, size: 48),
                  ),
                ),
              );
            },
          ),
          // top bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded, color: Colors.white)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                      child: Text('${_page + 1} / ${media.length}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                    ),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
          ),
          // dots
          if (media.length > 1)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(media.length, (i) {
                      final on = i == _page;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        height: 7,
                        width: on ? 20 : 7,
                        decoration: BoxDecoration(color: on ? Colors.white : Colors.white38, borderRadius: BorderRadius.circular(4)),
                      );
                    }),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FullscreenVideo extends StatefulWidget {
  final String url;
  final bool active;
  const _FullscreenVideo({required this.url, required this.active});
  @override
  State<_FullscreenVideo> createState() => _FullscreenVideoState();
}

class _FullscreenVideoState extends State<_FullscreenVideo> {
  late final VideoPlayerController _c;
  bool _ready = false;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _c = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (!mounted) return;
        setState(() => _ready = true);
        if (widget.active) _c.play();
      }).catchError((_) {
        if (mounted) setState(() => _error = true);
      });
    _c.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void didUpdateWidget(covariant _FullscreenVideo old) {
    super.didUpdateWidget(old);
    if (_ready && !widget.active && _c.value.isPlaying) _c.pause();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error) return const Center(child: Text('Could not play this video.', style: TextStyle(color: Colors.white70)));
    if (!_ready) return const Center(child: CircularProgressIndicator(color: Colors.white));
    return GestureDetector(
      onTap: () => _c.value.isPlaying ? _c.pause() : _c.play(),
      child: Center(
        child: AspectRatio(
          aspectRatio: _c.value.aspectRatio == 0 ? 16 / 9 : _c.value.aspectRatio,
          child: Stack(
            alignment: Alignment.center,
            children: [
              VideoPlayer(_c),
              Positioned(left: 0, right: 0, bottom: 0, child: VideoProgressIndicator(_c, allowScrubbing: true, colors: const VideoProgressColors(playedColor: AppColors.brand))),
              if (!_c.value.isPlaying)
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.4), shape: BoxShape.circle),
                  child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 48),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
