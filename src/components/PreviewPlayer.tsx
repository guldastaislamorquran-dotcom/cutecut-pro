import React, { useRef, useEffect, useState } from 'react';
import {
  Play, Pause, ChevronLeft, ChevronRight, Maximize2, Minimize2, Layers,
  Grid, ShieldCheck, Volume2, VolumeX, Monitor, Smartphone, Square,
  Film, Menu, Scan, Search, ChevronDown, Activity, SlidersHorizontal,
  Sparkles, Check
} from 'lucide-react';
import { Track, Clip, ClipType, WatermarkSettings } from '../types';
import {
  formatTimeCode,
  applyPixelFilters,
  applyColorGrading,
  isColorGradingActive,
  normalizeMediaUrl,
  getSafeCrossOrigin,
  getInterpolatedClipProperties,
  computeClipTransitionState,
  getExportResolutionDimensions,
  extractAyahNumberFromClip,
  convertToArabicDigits,
  stripAyahSymbol,
  isTranslationClip,
  isQuranArabicClip,
} from '../utils/editorUtils';

/**
 * Draws the authentic Quran.com style ornate crowned Ayah medallion directly on canvas
 */
function drawCanvasAyahMedallion(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  height: number,
  ayahNumber: number,
  digitType: 'arabic' | 'latin' = 'arabic',
  color: string = '#ffffff',
  style: string = 'ornate-medallion'
) {
  const digits = digitType === 'arabic' ? convertToArabicDigits(ayahNumber) : String(ayahNumber);
  const scale = height / 120;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Outer ambient glow / shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (style === 'uthmani-circle') {
    // ------------------ AUTHENTIC QURAN.COM UTHMANI 4-POINTED ROSETTE ------------------
    // An intricate, perfectly symmetrical circular rosette with 4 gorgeous floral cardinal flourishes,
    // a double concentric circle, and cardinal tip jewels—matching Quran.com exactly.
    
    // 1. Outer Concentric Circle
    ctx.beginPath();
    ctx.arc(0, 0, 31 * scale, 0, Math.PI * 2);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    // 2. Inner Concentric Circle
    ctx.beginPath();
    ctx.arc(0, 0, 22 * scale, 0, Math.PI * 2);
    ctx.lineWidth = 2.4 * scale;
    ctx.stroke();

    // 3. Four Symmetrical Cardinal Flourishes (Top, Right, Bottom, Left)
    ctx.lineWidth = 1.4 * scale;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.save();
      ctx.rotate(angle);
      
      // Symmetrical outer wing curl
      ctx.beginPath();
      ctx.moveTo(-12 * scale, -29 * scale);
      ctx.bezierCurveTo(-18 * scale, -36 * scale, -10 * scale, -42 * scale, 0, -44 * scale);
      ctx.bezierCurveTo(10 * scale, -42 * scale, 18 * scale, -36 * scale, 12 * scale, -29 * scale);
      ctx.stroke();

      // Symmetrical inner detail loop
      ctx.beginPath();
      ctx.moveTo(-8 * scale, -30 * scale);
      ctx.bezierCurveTo(-10 * scale, -34 * scale, 0, -38 * scale, 0, -38 * scale);
      ctx.bezierCurveTo(0, -38 * scale, 10 * scale, -34 * scale, 8 * scale, -30 * scale);
      ctx.stroke();

      // Accent Tip Jewel Dot
      ctx.beginPath();
      ctx.arc(0, -46 * scale, 2.0 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
    }
    
    // 4. Symmetrical Accent Dots in the Ring (at 45, 135, 225, 315 degrees between concentric circles)
    ctx.fillStyle = color;
    const diagonalAngles = [Math.PI/4, (3*Math.PI)/4, (5*Math.PI)/4, (7*Math.PI)/4];
    diagonalAngles.forEach(ang => {
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 26.5 * scale, Math.sin(ang) * 26.5 * scale, 1.4 * scale, 0, Math.PI * 2);
      ctx.fill();
    });

  } else {
    // ------------------ AUTHENTIC CLASSIC MUSHAF CROWNED MEDALLION (QURAN.COM) ------------------
    // An upright ornate oval cartouche matching the Quran.com reference image exactly:
    // - Graceful tapered oval frame (cartouche)
    // - Inner circular ring that neatly encloses the Arabic verse numeral
    // - 3-lobed trefoil crown crest at the top apex with finial bead
    // - Symmetrical upper arabesque volute scrolls curving inward and upward with hollow filigree cutouts
    // - Symmetrical lower arabesque volute scrolls curving inward and downward with hollow filigree cutouts
    // - Bottom inverted cleft cusp with finial bead
    // - Centered, high-contrast Arabic verse numeral

    // 1. Outer Cartouche Oval Frame
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -45 * scale);
    ctx.bezierCurveTo(20 * scale, -45 * scale, 31 * scale, -25 * scale, 31 * scale, 0);
    ctx.bezierCurveTo(31 * scale, 25 * scale, 20 * scale, 45 * scale, 0, 45 * scale);
    ctx.bezierCurveTo(-20 * scale, 45 * scale, -31 * scale, 25 * scale, -31 * scale, 0);
    ctx.bezierCurveTo(-31 * scale, -25 * scale, -20 * scale, -45 * scale, 0, -45 * scale);
    ctx.closePath();
    ctx.stroke();

    // 2. Inner Circular Ring Enclosing the Ayah Number (as in user Quran.com reference)
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 22.5 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Top Trefoil Crown Crest (3-lobed arch at apex)
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    // Left lobe
    ctx.moveTo(-13 * scale, -41 * scale);
    ctx.bezierCurveTo(-13 * scale, -49 * scale, -7 * scale, -50 * scale, -5 * scale, -44.5 * scale);
    // Center tall dome lobe
    ctx.bezierCurveTo(-6 * scale, -55 * scale, 6 * scale, -55 * scale, 5 * scale, -44.5 * scale);
    // Right lobe
    ctx.bezierCurveTo(7 * scale, -50 * scale, 13 * scale, -49 * scale, 13 * scale, -41 * scale);
    ctx.stroke();

    // Top Apex Finial Bead
    ctx.beginPath();
    ctx.arc(0, -55.5 * scale, 1.8 * scale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Inner crown support arch
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -44 * scale);
    ctx.bezierCurveTo(-4 * scale, -49 * scale, 4 * scale, -49 * scale, 6 * scale, -44 * scale);
    ctx.stroke();

    // 4. Upper Symmetrical Arabesque Volute Scrolls (Left & Right)
    // Left Upper Outer Wing & Inward Volute Curl
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.moveTo(-2 * scale, -39 * scale);
    ctx.bezierCurveTo(-13 * scale, -39 * scale, -24 * scale, -32 * scale, -25 * scale, -19 * scale);
    ctx.bezierCurveTo(-25 * scale, -12 * scale, -15 * scale, -13 * scale, -12 * scale, -19 * scale);
    ctx.bezierCurveTo(-10 * scale, -23 * scale, -15 * scale, -27 * scale, -18 * scale, -25 * scale);
    ctx.stroke();

    // Left Upper Inner Cutout Arc (creating the hollow teardrop filigree)
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-4 * scale, -35 * scale);
    ctx.bezierCurveTo(-12 * scale, -35 * scale, -20 * scale, -30 * scale, -20 * scale, -22 * scale);
    ctx.bezierCurveTo(-20 * scale, -17 * scale, -14 * scale, -17 * scale, -13 * scale, -20 * scale);
    ctx.stroke();

    // Right Upper Outer Wing & Inward Volute Curl (Symmetrical mirror)
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.moveTo(2 * scale, -39 * scale);
    ctx.bezierCurveTo(13 * scale, -39 * scale, 24 * scale, -32 * scale, 25 * scale, -19 * scale);
    ctx.bezierCurveTo(25 * scale, -12 * scale, 15 * scale, -13 * scale, 12 * scale, -19 * scale);
    ctx.bezierCurveTo(10 * scale, -23 * scale, 15 * scale, -27 * scale, 18 * scale, -25 * scale);
    ctx.stroke();

    // Right Upper Inner Cutout Arc
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(4 * scale, -35 * scale);
    ctx.bezierCurveTo(12 * scale, -35 * scale, 20 * scale, -30 * scale, 20 * scale, -22 * scale);
    ctx.bezierCurveTo(20 * scale, -17 * scale, 14 * scale, -17 * scale, 13 * scale, -20 * scale);
    ctx.stroke();

    // 5. Lower Symmetrical Arabesque Volute Scrolls (Left & Right)
    // Left Lower Outer Wing & Inward Volute Curl
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.moveTo(-2 * scale, 39 * scale);
    ctx.bezierCurveTo(-13 * scale, 39 * scale, -24 * scale, 32 * scale, -25 * scale, 19 * scale);
    ctx.bezierCurveTo(-25 * scale, 12 * scale, -15 * scale, 13 * scale, -12 * scale, 19 * scale);
    ctx.bezierCurveTo(-10 * scale, 23 * scale, -15 * scale, 27 * scale, -18 * scale, 25 * scale);
    ctx.stroke();

    // Left Lower Inner Cutout Arc
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-4 * scale, 35 * scale);
    ctx.bezierCurveTo(-12 * scale, 35 * scale, -20 * scale, 30 * scale, -20 * scale, 22 * scale);
    ctx.bezierCurveTo(-20 * scale, 17 * scale, -14 * scale, 17 * scale, -13 * scale, 20 * scale);
    ctx.stroke();

    // Right Lower Outer Wing & Inward Volute Curl (Symmetrical mirror)
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.moveTo(2 * scale, 39 * scale);
    ctx.bezierCurveTo(13 * scale, 39 * scale, 24 * scale, 32 * scale, 25 * scale, 19 * scale);
    ctx.bezierCurveTo(25 * scale, 12 * scale, 15 * scale, 13 * scale, 12 * scale, 19 * scale);
    ctx.bezierCurveTo(10 * scale, 23 * scale, 15 * scale, 27 * scale, 18 * scale, 25 * scale);
    ctx.stroke();

    // Right Lower Inner Cutout Arc
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(4 * scale, 35 * scale);
    ctx.bezierCurveTo(12 * scale, 35 * scale, 20 * scale, 30 * scale, 20 * scale, 22 * scale);
    ctx.bezierCurveTo(20 * scale, 17 * scale, 14 * scale, 17 * scale, 13 * scale, 20 * scale);
    ctx.stroke();

    // 6. Bottom Apex Inverted Cleft / Cusp & Finial Bead
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 43 * scale);
    ctx.bezierCurveTo(-4 * scale, 48 * scale, 4 * scale, 48 * scale, 8 * scale, 43 * scale);
    ctx.stroke();

    // Bottom Finial Bead
    ctx.beginPath();
    ctx.arc(0, 48.5 * scale, 1.8 * scale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // 7. Center Ayah Number inside Inner Ring
  ctx.shadowBlur = 3;
  ctx.fillStyle = color;
  const numFontSize = Math.round(scale * (digits.length > 2 ? 22 : digits.length === 2 ? 26 : 30));
  ctx.font = `bold ${numFontSize}px "Amiri", "Noto Naskh Arabic", "Scheherazade New", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textYOffset = style === 'uthmani-circle' ? 1.2 * scale : 0.8 * scale;
  ctx.fillText(digits, 0, textYOffset);

  ctx.restore();
}

interface PreviewPlayerProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  aspectRatio: '16:9' | '9:16' | '1:1';
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSetAspectRatio: (ratio: '16:9' | '9:16' | '1:1') => void;
  videoNodes: Record<string, HTMLVideoElement | HTMLImageElement>;
  selectedClip?: Clip | null;
  selectedClipIds?: string[];
  onSelectClip?: (clip: Clip | null) => void;
  onSelectClips?: (ids: string[]) => void;
  onUpdateClip?: (clipId: string, updates: Partial<Clip>) => void;
  onBatchUpdateClips?: (updates: { id: string; updates: Partial<Clip> }[]) => void;
  watermark?: WatermarkSettings;
  isExporting?: boolean;
  exportResolution?: '480p' | '720p' | '1080p' | string;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

interface TextBound {
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  clip: Clip;
}

export default function PreviewPlayer({
  tracks,
  currentTime,
  duration,
  isPlaying,
  aspectRatio,
  onPlayPause,
  onSeek,
  onSetAspectRatio,
  videoNodes,
  selectedClip,
  selectedClipIds,
  onSelectClip,
  onSelectClips,
  onUpdateClip,
  onBatchUpdateClips,
  watermark,
  isExporting,
  exportResolution = '1080p',
  onCanvasReady,
}: PreviewPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
    if (typeof document !== 'undefined' && (document as any).fonts) {
      Promise.all([
        (document as any).fonts.load('36px "QPC Uthmani Hafs"'),
        (document as any).fonts.load('36px "Uthmani"'),
        (document as any).fonts.load('36px "KFGQPC Uthmanic Script HAFS"'),
      ]).catch(() => {});
    }
  }, [onCanvasReady]);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerFrameRef = useRef<HTMLDivElement>(null);
  const fallbackMediaRef = useRef<Record<string, HTMLVideoElement | HTMLImageElement>>({});
  const watermarkImgRef = useRef<HTMLImageElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState<'fit' | 50 | 75 | 100>('fit');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);

  // Interactive Text & Group Drag & Scale State
  const textBoundsRef = useRef<Record<string, TextBound>>({});
  const groupBoundsRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    clips: Clip[];
  } | null>(null);

  const activeSnapRef = useRef<{ x: number | null; y: number | null; label?: string }>({ x: null, y: null });
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [isResizingGroup, setIsResizingGroup] = useState(false);
  const initialGroupClipsPos = useRef<{ clip: Clip; initialX: number; initialY: number; initialFontSize: number; initialScale: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialTextPos, setInitialTextPos] = useState<{ x: number; y: number; fontSize: number }>({ x: 50, y: 50, fontSize: 32 });
  const [activeCursor, setActiveCursor] = useState<'default' | 'pointer' | 'move' | 'nwse-resize'>('default');
  const [previewQuality, setPreviewQuality] = useState<'4K' | '2K' | '1080p' | '720p'>('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Compute Canvas Size based on aspect ratio & preview quality preset (4K / 2K / 1080p / 720p)
  useEffect(() => {
    const targetPreset = isExporting ? (exportResolution || '1080p') : previewQuality;
    const dims = getExportResolutionDimensions(targetPreset, aspectRatio);
    setDimensions((prev) => {
      if (prev.width === dims.width && prev.height === dims.height) return prev;
      return dims;
    });
  }, [aspectRatio, isExporting, exportResolution, previewQuality]);

  // Find active video clip for adjustment controls
  const activeClips: Clip[] = [];
  tracks.forEach((track) => {
    if (track.hidden) return;
    track.clips.forEach((clip) => {
      if (currentTime >= clip.start && currentTime <= clip.start + clip.duration) {
        activeClips.push(clip);
      }
    });
  });

  const isVisualClip = (c: Clip | null | undefined): boolean => {
    if (!c) return false;
    return c.type === ClipType.VIDEO || c.type === ClipType.IMAGE || !!c.isImage;
  };

  const activeVideoClip = isVisualClip(selectedClip)
    ? selectedClip 
    : activeClips.find(c => isVisualClip(c)) || null;

  // Frame Scrubbing
  const stepFrame = (direction: 'prev' | 'next') => {
    const fps = 30;
    const frameTime = 1 / fps;
    const nextTime = direction === 'next' ? currentTime + frameTime : currentTime - frameTime;
    onSeek(Math.max(0, Math.min(duration, nextTime)));
  };

  // Fullscreen player toggle
  const toggleFullscreen = () => {
    if (!playerFrameRef.current) return;
    if (!document.fullscreenElement) {
      playerFrameRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Single-click macro transformation matrix to auto fit full screen
  const handleAutoFitFullScreen = () => {
    if (onSetAspectRatio) {
      onSetAspectRatio('16:9');
    }
    if (!activeVideoClip || !onUpdateClip) return;
    onUpdateClip(activeVideoClip.id, {
      transform: {
        scale: 100,
        posX: 0,
        posY: 0,
        rotation: 0,
      },
    });
  };

  // Pre-trigger video element initialization on track changes
  useEffect(() => {
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if ((clip.type === ClipType.VIDEO || clip.type === ClipType.IMAGE) && clip.url) {
          const media = videoNodes[clip.id] || fallbackMediaRef.current[clip.id];
          if (media && media instanceof HTMLVideoElement) {
            const video = media as HTMLVideoElement;
            video.muted = isMuted || !!track.muted;
            if (video.readyState < 1 && video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
              try {
                video.load();
              } catch {
                // ignore
              }
            }
          }
        }
      });
    });
  }, [tracks, videoNodes, isMuted]);

  // Render loop to draw active layers onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Clear Canvas
      ctx.fillStyle = '#08080b';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw subtle grid lines if enabled
      if (showGrid && !isExporting) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;

        // Rule of Thirds
        const w3 = dimensions.width / 3;
        const h3 = dimensions.height / 3;

        ctx.beginPath();
        ctx.moveTo(w3, 0); ctx.lineTo(w3, dimensions.height);
        ctx.moveTo(w3 * 2, 0); ctx.lineTo(w3 * 2, dimensions.height);
        ctx.moveTo(0, h3); ctx.lineTo(dimensions.width, h3);
        ctx.moveTo(0, h3 * 2); ctx.lineTo(dimensions.width, h3 * 2);
        ctx.stroke();

        // Center crosshair
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
        ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
        ctx.stroke();
      }

      // Safe Area lines if enabled
      if (showSafeArea) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        const marginX = dimensions.width * 0.1;
        const marginY = dimensions.height * 0.1;
        ctx.strokeRect(marginX, marginY, dimensions.width - marginX * 2, dimensions.height - marginY * 2);
        ctx.setLineDash([]);
      }

      // 2. Identify active clips at current timeline point
      const activeFrameClips: Clip[] = [];
      tracks.forEach((track) => {
        if (track.hidden) return; // Skip hidden tracks
        track.clips.forEach((clip) => {
          if (currentTime >= clip.start && currentTime <= clip.start + clip.duration) {
            activeFrameClips.push(clip);
          }
        });
      });

      // ------------------ VIDEO & IMAGE LAYERS ------------------
      activeFrameClips.forEach((clip) => {
        if (clip.type === ClipType.VIDEO || clip.type === ClipType.IMAGE) {
          let media = videoNodes[clip.id] || fallbackMediaRef.current[clip.id];

          // Fallback: create safe HTML5 video/image element dynamically if missing
          if (!media && clip.url) {
            const normUrl = normalizeMediaUrl(clip.url);
            const safeCrossOrigin = getSafeCrossOrigin(clip.url);

            const isExplicitImg = clip.isImage || clip.url.startsWith('data:image/') || (/\.(jpeg|jpg|png|gif|webp|svg|avif)(\?|$)/i.test(clip.url) && !clip.url.includes('.mp4') && !clip.url.includes('.webm'));

            if (isExplicitImg) {
              const img = document.createElement('img');
              if (safeCrossOrigin) {
                img.crossOrigin = safeCrossOrigin;
              }
              img.src = normUrl;

              img.addEventListener('error', () => {
                if (img.crossOrigin) {
                  img.removeAttribute('crossorigin');
                  img.src = normUrl;
                }
              });

              if (typeof img.decode === 'function') {
                img.decode().catch(() => {});
              }

              fallbackMediaRef.current[clip.id] = img;
              media = img;
            } else {
              const video = document.createElement('video');
              if (safeCrossOrigin) {
                video.crossOrigin = safeCrossOrigin;
              }
              video.src = normUrl;
              video.muted = isMuted;
              video.playsInline = true;
              video.preload = 'auto';
              video.loop = true;
              video.setAttribute('webkit-playsinline', 'true');

              const handleVideoErr = () => {
                if (video.crossOrigin) {
                  video.removeAttribute('crossorigin');
                  video.src = normUrl;
                  video.load();
                } else {
                  (video as any).hasError = true;
                }
              };
              video.addEventListener('error', handleVideoErr, { once: true });

              try {
                video.load();
              } catch {
                // ignore
              }
              fallbackMediaRef.current[clip.id] = video;
              media = video;
            }
          }

          // Resolve primary or fallback visual target (video or poster image)
          let drawTarget: CanvasImageSource | null = null;
          let isFallbackMotion = false;

          if (media) {
            const isImg = clip.isImage || (media instanceof HTMLImageElement);
            const videoEl = media as HTMLVideoElement;

            const isVideoReady = !isImg && !(videoEl as any).hasError && (videoEl.readyState >= 1 || videoEl.videoWidth > 0);
            const isImageReady = isImg && ((media as HTMLImageElement).complete && (media as HTMLImageElement).naturalWidth > 0);

            if (isVideoReady) {
              drawTarget = videoEl;
              const elapsed = currentTime - clip.start;
              const rawSrcTime = clip.sourceStart + elapsed * clip.playbackRate;
              const vidDur = (videoEl.duration && !isNaN(videoEl.duration) && isFinite(videoEl.duration) && videoEl.duration > 0) ? videoEl.duration : (clip.duration || 999999);
              const clampedSrcTime = vidDur > 0 ? (rawSrcTime % vidDur) : 0;
              
              if (isPlaying) {
                if (videoEl.paused) {
                  videoEl.play().catch(() => {});
                }
                // Only seek if drift is significant to avoid video decoder stuttering during playback
                const drift = Math.abs(videoEl.currentTime - clampedSrcTime);
                if (drift > 0.8 && !videoEl.seeking) {
                  try {
                    videoEl.currentTime = clampedSrcTime;
                  } catch {}
                }
              } else {
                if (!videoEl.paused) videoEl.pause();
                if (Math.abs(videoEl.currentTime - clampedSrcTime) > 0.05 && !videoEl.seeking) {
                  try {
                    videoEl.currentTime = clampedSrcTime;
                  } catch {}
                }
              }
            } else if (isImageReady) {
              drawTarget = media as HTMLImageElement;
              if (!clip.isImage) {
                isFallbackMotion = true;
              }
            }
          }

          // If primary video source is buffering or errored, load & render clip poster / fallbackUrl
          if (!drawTarget) {
            const fallbackUrl = clip.poster || clip.thumbnailUrl || clip.fallbackUrl || (clip.url && !clip.url.includes('.mp4') ? clip.url : undefined);
            if (fallbackUrl) {
              const fbKey = `${clip.id}_fb_poster`;
              let fbImg = fallbackMediaRef.current[fbKey] as HTMLImageElement;
              if (!fbImg) {
                fbImg = document.createElement('img');
                fbImg.crossOrigin = getSafeCrossOrigin(fallbackUrl) || 'anonymous';
                fbImg.src = normalizeMediaUrl(fallbackUrl);
                fbImg.addEventListener('error', () => {
                  if (fbImg.crossOrigin) {
                    fbImg.removeAttribute('crossorigin');
                    fbImg.src = normalizeMediaUrl(fallbackUrl);
                  }
                });
                fallbackMediaRef.current[fbKey] = fbImg;
              }
              if (fbImg.complete && fbImg.naturalWidth > 0) {
                drawTarget = fbImg;
                isFallbackMotion = true;
              }
            }
          }

          if (drawTarget) {
            // Transform, Keyframe & Transition parameters
            const interpolated = getInterpolatedClipProperties(clip, currentTime);
            const transState = computeClipTransitionState(clip, currentTime, dimensions.width, dimensions.height);

            // Subtle cinematic Ken Burns float for animated poster fallback
            let motionScale = 1.0;
            let motionPosY = 0;
            if (isFallbackMotion && clip.duration > 0) {
              const progress = Math.max(0, Math.min(1, (currentTime - clip.start) / clip.duration));
              motionScale = 1.0 + progress * 0.04;
              motionPosY = (progress - 0.5) * 8;
            }

            const scale = (interpolated.scale / 100) * transState.scaleMultiplier * motionScale;
            const posX = interpolated.posX + transState.offsetX;
            const posY = interpolated.posY + transState.offsetY + motionPosY;
            const rotationDeg = interpolated.rotation;
            const rad = (rotationDeg * Math.PI) / 180;

            // Render video/image onto canvas with safe matrix transforms
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, interpolated.opacity * transState.alphaMultiplier));
            if (clip.blendMode) {
              ctx.globalCompositeOperation = clip.blendMode as GlobalCompositeOperation;
            }
            
            if (transState.wipeProgress !== null) {
              ctx.beginPath();
              ctx.rect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width * transState.wipeProgress, dimensions.height);
              ctx.clip();
            }

            // CapCut Shape Mask
            if (clip.mask && clip.mask.type && clip.mask.type !== 'none') {
              const mSize = (clip.mask.size || 100) / 100;
              const mw = dimensions.width * mSize;
              const mh = dimensions.height * mSize;
              ctx.beginPath();
              if (clip.mask.type === 'circle') {
                ctx.arc(dimensions.width / 2 + posX, dimensions.height / 2 + posY, Math.min(mw, mh) * 0.35, 0, Math.PI * 2);
              } else if (clip.mask.type === 'rectangle') {
                ctx.roundRect(dimensions.width / 2 + posX - mw * 0.35, dimensions.height / 2 + posY - mh * 0.35, mw * 0.7, mh * 0.7, clip.mask.roundness || 0);
              } else if (clip.mask.type === 'split') {
                ctx.rect(dimensions.width / 2 + posX - mw / 2, dimensions.height / 2 + posY - mh / 2, mw / 2, mh);
              } else if (clip.mask.type === 'filmstrip') {
                ctx.rect(dimensions.width / 2 + posX - mw / 2, dimensions.height / 2 + posY - mh * 0.3, mw, mh * 0.6);
              }
              ctx.clip();
            }

            // Apply GPU-level filters (Hardware-accelerated)
            const filterParts: string[] = [];
            if (clip.videoEffects?.blur) {
              filterParts.push(`blur(${clip.videoEffects.blur}px)`);
            }
            if (clip.filters) {
              if (clip.filters.brightness !== undefined && clip.filters.brightness !== 100) {
                filterParts.push(`brightness(${clip.filters.brightness}%)`);
              }
              if (clip.filters.contrast !== undefined && clip.filters.contrast !== 100) {
                filterParts.push(`contrast(${clip.filters.contrast}%)`);
              }
              if (clip.filters.saturation !== undefined && clip.filters.saturation !== 100) {
                filterParts.push(`saturate(${clip.filters.saturation}%)`);
              }
              if (clip.filters.grayscale && clip.filters.grayscale > 0) {
                filterParts.push(`grayscale(${clip.filters.grayscale}%)`);
              }
              if (clip.filters.sepia && clip.filters.sepia > 0) {
                filterParts.push(`sepia(${clip.filters.sepia}%)`);
              }
              if (clip.filters.invert && clip.filters.invert > 0) {
                filterParts.push(`invert(${clip.filters.invert}%)`);
              }
              if (clip.filters.hueRotate && clip.filters.hueRotate !== 0) {
                filterParts.push(`hue-rotate(${clip.filters.hueRotate}deg)`);
              }
            }
            ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';

            // Matrix transform: Translate -> Rotate -> Scale
            ctx.translate(dimensions.width / 2 + posX, dimensions.height / 2 + posY);
            if (rotationDeg !== 0) {
              ctx.rotate(rad);
            }
            if (scale !== 1) {
              ctx.scale(scale, scale);
            }

            try {
              ctx.drawImage(drawTarget, -dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
            } catch {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
            }
            
            ctx.filter = 'none';

              // Apply additional video effects inside transformed context
              if (clip.videoEffects?.vignette) {
                const grad = ctx.createRadialGradient(
                  0, 0, dimensions.width * 0.3,
                  0, 0, dimensions.width * 0.7
                );
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.85)');
                ctx.fillStyle = grad;
                ctx.fillRect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
              }

              if (clip.videoEffects?.filmGrain) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
                for (let i = 0; i < 40; i++) {
                  const gx = (Math.random() - 0.5) * dimensions.width;
                  const gy = (Math.random() - 0.5) * dimensions.height;
                  const gSize = Math.random() * 2 + 1;
                  ctx.fillRect(gx, gy, gSize, gSize);
                }
              }

              // VHS Glitch & Chromatic Shear Effect (Periodic RGB shift and horizontal shear)
              if (clip.videoEffects?.glitch) {
                const glitchPhase = (currentTime * 7) % 3;
                const isGlitching = glitchPhase < 0.65 || (isPlaying && Math.random() < 0.22);
                if (isGlitching) {
                  const shiftAmp = (Math.sin(currentTime * 18) * 6) + (Math.random() * 8 - 4);
                  const shearAmp = (Math.cos(currentTime * 14) * 0.04) + (Math.random() * 0.03 - 0.015);
                  
                  ctx.save();
                  // Apply horizontal VHS shear
                  ctx.transform(1, 0, shearAmp, 1, 0, 0);

                  // RGB Shift: Cyan channel offset
                  ctx.globalCompositeOperation = 'screen';
                  ctx.filter = 'hue-rotate(180deg) saturate(200%)';
                  ctx.globalAlpha = 0.45;
                  try {
                    ctx.drawImage(media, -dimensions.width / 2 + shiftAmp, -dimensions.height / 2, dimensions.width, dimensions.height);
                  } catch {}

                  // RGB Shift: Red/Magenta channel offset
                  ctx.filter = 'hue-rotate(330deg) saturate(220%)';
                  ctx.globalAlpha = 0.45;
                  try {
                    ctx.drawImage(media, -dimensions.width / 2 - shiftAmp, -dimensions.height / 2, dimensions.width, dimensions.height);
                  } catch {}
                  
                  ctx.restore();

                  // VHS Scanline Slices and noise jitter
                  const sliceCount = Math.floor(Math.random() * 4) + 2;
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                  for (let s = 0; s < sliceCount; s++) {
                    const sy = (Math.random() - 0.5) * dimensions.height;
                    const sh = Math.random() * 18 + 4;
                    const sx = (Math.random() - 0.5) * 16;
                    ctx.fillRect(-dimensions.width / 2 + sx, sy, dimensions.width, sh);
                  }
                }
              }

              // AI Video Relighting Presets (Simulated studio ambient lighting matrix)
              if (clip.videoEffects?.relighting?.enabled) {
                const style = clip.videoEffects.relighting.style || 'amber-glow';
                const intensity = (clip.videoEffects.relighting.intensity ?? 75) / 100;
                
                if (style === 'amber-glow' || style === 'quran-gold') {
                  const ambientGrad = ctx.createRadialGradient(
                    0, -dimensions.height * 0.2, dimensions.width * 0.1,
                    0, 0, dimensions.width * 0.8
                  );
                  ambientGrad.addColorStop(0, `rgba(245, 158, 11, ${0.45 * intensity})`);
                  ambientGrad.addColorStop(0.6, `rgba(217, 119, 6, ${0.2 * intensity})`);
                  ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                  ctx.fillStyle = ambientGrad;
                  ctx.fillRect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
                } else if (style === 'neon-cyan') {
                  const ambientGrad = ctx.createLinearGradient(
                    -dimensions.width / 2, -dimensions.height / 2,
                    dimensions.width / 2, dimensions.height / 2
                  );
                  ambientGrad.addColorStop(0, `rgba(6, 182, 212, ${0.35 * intensity})`);
                  ambientGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
                  ambientGrad.addColorStop(1, `rgba(236, 72, 153, ${0.35 * intensity})`);
                  ctx.fillStyle = ambientGrad;
                  ctx.fillRect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
                } else if (style === 'studio-sunset') {
                  const ambientGrad = ctx.createLinearGradient(
                    0, -dimensions.height / 2,
                    0, dimensions.height / 2
                  );
                  ambientGrad.addColorStop(0, `rgba(244, 63, 94, ${0.3 * intensity})`);
                  ambientGrad.addColorStop(0.6, `rgba(245, 158, 11, ${0.25 * intensity})`);
                  ambientGrad.addColorStop(1, `rgba(99, 102, 241, ${0.2 * intensity})`);
                  ctx.fillStyle = ambientGrad;
                  ctx.fillRect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
                }
              }

              // Light Leaks Overlay
              if (clip.videoEffects?.lightLeak) {
                const leakGrad = ctx.createRadialGradient(
                  dimensions.width * 0.3, -dimensions.height * 0.3, 10,
                  dimensions.width * 0.2, -dimensions.height * 0.2, dimensions.width * 0.6
                );
                leakGrad.addColorStop(0, 'rgba(255, 200, 100, 0.5)');
                leakGrad.addColorStop(0.5, 'rgba(255, 100, 150, 0.25)');
                leakGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = leakGrad;
                ctx.fillRect(-dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
              }

              // Bokeh Particle Dust
              if (clip.videoEffects?.bokeh) {
                ctx.fillStyle = 'rgba(253, 230, 138, 0.15)';
                for (let b = 0; b < 12; b++) {
                  const bx = Math.sin(b * 1.5 + currentTime) * (dimensions.width * 0.4);
                  const by = Math.cos(b * 2.1 + currentTime) * (dimensions.height * 0.4);
                  const br = Math.random() * 12 + 8;
                  ctx.beginPath();
                  ctx.arc(bx, by, br, 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              ctx.restore();

              // Draw CapCut Pro Selected Clip Bounding Outline
              if (selectedClip?.id === clip.id && !isExporting) {
                ctx.save();
                ctx.translate(dimensions.width / 2 + posX, dimensions.height / 2 + posY);
                if (rotationDeg !== 0) ctx.rotate(rad);
                
                const boxW = dimensions.width * scale;
                const boxH = dimensions.height * scale;
                const halfW = boxW / 2;
                const halfH = boxH / 2;

                ctx.strokeStyle = '#06b6d4'; // CapCut Cyan
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(-halfW, -halfH, boxW, boxH);
                ctx.setLineDash([]);

                // Corner Handles
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 2;
                const handleRadius = 6;

                const corners = [
                  [-halfW, -halfH],
                  [halfW, -halfH],
                  [halfW, halfH],
                  [-halfW, halfH],
                ];

                corners.forEach(([cx, cy]) => {
                  ctx.beginPath();
                  ctx.arc(cx, cy, handleRadius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();
                });

                // Rotation handle line & top dot
                ctx.beginPath();
                ctx.moveTo(0, -halfH);
                ctx.lineTo(0, -halfH - 24);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, -halfH - 24, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.restore();
              }

              // Apply pixel-level Chroma Key or Color Grading (Lift, Gamma, Gain)
              const hasColorGrading = Boolean(clip.filters?.colorGrading?.enabled && isColorGradingActive(clip.filters.colorGrading));
              if (clip.filters?.chromaKey?.enabled) {
                applyPixelFilters(ctx, dimensions.width, dimensions.height, clip.filters);
              } else if (hasColorGrading && clip.filters?.colorGrading) {
                applyColorGrading(ctx, dimensions.width, dimensions.height, clip.filters.colorGrading);
              }
            } else {
              // Seamless dark background fallback while media buffers
              ctx.save();
              const grad = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
              grad.addColorStop(0, '#0a0d14');
              grad.addColorStop(0.5, '#121824');
              grad.addColorStop(1, '#080a10');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, dimensions.width, dimensions.height);
              ctx.restore();
            }
          }
        });

      // ------------------ PRE-CALCULATE TEXT LAYERS & CINEMA OVERLAYS ------------------
      interface PreparedTextLayer {
        clip: Clip;
        transState: ReturnType<typeof computeClipTransitionState>;
        xPos: number;
        yPos: number;
        fontSize: number;
        fontStack: string;
        color: string;
        alignment: CanvasTextAlign;
        lines: string[];
        lineGap: number;
        totalHeight: number;
        startY: number;
        blockW: number;
        blockH: number;
        boxLeft: number;
        boxTop: number;
        hasInlineMedallion?: boolean;
        targetLineIdx?: number;
        medH?: number;
        medGap?: number;
        medWidth?: number;
        medallionTotalW?: number;
        ayahNum?: number;
        ayahSymbolPosition?: string;
        ayahSymbolStyle?: string;
      }

      const preparedTextLayers: PreparedTextLayer[] = [];
      const activeTextClips = activeFrameClips.filter((clip) => clip.type === ClipType.TEXT && Boolean(clip.text));

      activeTextClips.forEach((clip) => {
        const transState = computeClipTransitionState(clip, currentTime, dimensions.width, dimensions.height);
        const xPos = (((clip.textX ?? 50) / 100) * dimensions.width) + transState.offsetX;
        const yPos = (((clip.textY ?? 50) / 100) * dimensions.height) + transState.offsetY;
        const rawFontSize = clip.fontSize ?? 32;
        const referenceWidth = 390;
        const fontScale = dimensions.width / referenceWidth;
        const fontSize = rawFontSize * fontScale;

        const color = clip.color ?? '#FFFFFF';
        const alignment = (clip.textAlignment ?? 'center') as CanvasTextAlign;
        const wrapEnabled = clip.textWrap !== false;
        const maxPct = clip.textMaxWidth ?? 85;
        const maxPxWidth = (maxPct / 100) * dimensions.width;
        const lineHeightMult = clip.textLineHeight ?? 1.3;

        let fontStack = '"Inter", sans-serif';
        if (
          clip.fontFamily === 'QPC Uthmani Hafs' ||
          clip.fontFamily === 'KFGQPC Uthmanic Script HAFS Regular' ||
          clip.fontFamily === 'KFGQPC Uthmanic Script HAFS' ||
          clip.fontFamily === 'Uthmani' ||
          clip.fontFamily === 'KFGQPC Uthman Taha Naskh'
        ) {
          fontStack = '"QPC Uthmani Hafs", "KFGQPC Uthmanic Script HAFS Regular", "KFGQPC Uthmanic Script HAFS", "Uthmani", "KFGQPC Uthman Taha Naskh", "Amiri Quran", "Noto Naskh Arabic", serif';
        } else if (clip.fontFamily === 'Amiri Quran') {
          fontStack = '"Amiri Quran", "Uthmani", "Amiri", serif';
        } else if (clip.fontFamily === 'Noto Naskh Arabic') {
          fontStack = '"Noto Naskh Arabic", "Uthmani", "Amiri", serif';
        } else if (clip.fontFamily === 'Amiri') {
          fontStack = '"Amiri", serif';
        } else if (clip.fontFamily === 'Traditional Arabic') fontStack = '"Traditional Arabic", "Amiri", serif';
        else if (clip.fontFamily === 'Lateef') fontStack = '"Lateef", serif';
        else if (clip.fontFamily === 'Scheherazade New') fontStack = '"Scheherazade New", serif';
        else if (clip.fontFamily === 'Reem Kufi') fontStack = '"Reem Kufi", sans-serif';
        else if (clip.fontFamily === 'Noto Nastaliq Urdu') fontStack = '"Noto Nastaliq Urdu", serif';
        else if (clip.fontFamily === 'Cinzel') fontStack = '"Cinzel", serif';
        else if (clip.fontFamily === 'Montserrat') fontStack = '"Montserrat", sans-serif';
        else if (clip.fontFamily === 'Space Grotesk') fontStack = '"Space Grotesk", sans-serif';
        else if (clip.fontFamily === 'Playfair Display') fontStack = '"Playfair Display", serif';
        else if (clip.fontFamily === 'JetBrains Mono') fontStack = '"JetBrains Mono", monospace';
        else if (clip.fontFamily) fontStack = clip.fontFamily;

        ctx.font = `bold ${fontSize}px ${fontStack}`;
        ctx.textAlign = alignment;
        ctx.textBaseline = 'middle';

        let rawText = clip.textTransform === 'uppercase' ? (clip.text || '').toUpperCase() : (clip.text || '');

        // Determine whether this clip is a translation clip (English, Urdu, Hindi, etc.)
        const isTranslation = isTranslationClip(clip);

        // USER DIRECTIVE: Ayah symbol must NEVER appear on translation text, only on Quran Ayah!
        // Always strip any Ayah symbols or numeric markers from translation text
        if (isTranslation) {
          rawText = stripAyahSymbol(rawText);
        }

        // Only genuine Quran Arabic scripture can display an Ayah symbol / medallion
        const isQuranArabic = isQuranArabicClip(clip);

        const ayahSymbolStyle = clip.ayahSymbolStyle && clip.ayahSymbolStyle !== 'none' ? clip.ayahSymbolStyle : 'ornate-medallion';
        const ayahSymbolPosition = clip.ayahSymbolPosition || 'end';
        const isDividerOrCinema = ayahSymbolPosition === 'divider' || !ayahSymbolPosition || clip.textBackgroundStyle === 'strip';
        const hasDoubleCircleIssue = ayahSymbolStyle === 'ornate-medallion' || ayahSymbolStyle === 'uthmani-circle';

        if (isQuranArabic && (isDividerOrCinema || hasDoubleCircleIssue)) {
          rawText = stripAyahSymbol(rawText);
        }
        let lines: string[] = [rawText];
        if (wrapEnabled) {
          const manualParagraphs = rawText.split('\n');
          const wrappedLines: string[] = [];
          for (const para of manualParagraphs) {
            const words = para.trim().split(/\s+/);
            if (words.length <= 1) {
              wrappedLines.push(para);
            } else {
              let currentLine = words[0];
              for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine + " " + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxPxWidth) {
                  wrappedLines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              wrappedLines.push(currentLine);
            }
          }
          lines = wrappedLines.filter(l => l.trim().length > 0);
        }
        if (lines.length === 0) lines = [''];

        const lineGap = fontSize * lineHeightMult;
        const totalHeight = (lines.length - 1) * lineGap;
        const startY = yPos - totalHeight / 2;

        // Ayah medallion belongs exclusively to Quran Arabic Ayahs (NEVER for translation!)
        const ayahNum = isQuranArabic ? (clip.ayahNumber || extractAyahNumberFromClip(clip)) : undefined;
        const hasInlineMedallion = Boolean(isQuranArabic && hasDoubleCircleIssue && ayahNum && ayahSymbolPosition !== 'divider');
        const targetLineIdx = ayahSymbolPosition === 'start' ? 0 : lines.length - 1;
        const medH = Math.max(22, Math.round(fontSize * 1.05));
        const medGap = Math.max(10, Math.round(fontSize * 0.22));
        const medWidth = Math.round(medH * 0.52);
        const medallionTotalW = hasInlineMedallion ? (medWidth + medGap) : 0;

        let maxLineWidth = 0;
        lines.forEach((lText, lIdx) => {
          let w = ctx.measureText(lText).width;
          if (hasInlineMedallion && lIdx === targetLineIdx) {
            w += medallionTotalW;
          }
          if (w > maxLineWidth) maxLineWidth = w;
        });

        const blockW = Math.max(80, maxLineWidth + 24);
        const blockH = Math.max(40, lines.length * lineGap + 16);
        const boxLeft = alignment === 'center' ? xPos - blockW / 2 : alignment === 'right' ? xPos - blockW : xPos;
        const boxTop = yPos - blockH / 2;

        textBoundsRef.current[clip.id] = {
          left: boxLeft,
          top: boxTop,
          width: blockW,
          height: blockH,
          centerX: xPos,
          centerY: yPos,
          clip,
        };

        preparedTextLayers.push({
          clip,
          transState,
          xPos,
          yPos,
          fontSize,
          fontStack,
          color,
          alignment,
          lines,
          lineGap,
          totalHeight,
          startY,
          blockW,
          blockH,
          boxLeft,
          boxTop,
          hasInlineMedallion,
          targetLineIdx,
          medH,
          medGap,
          medWidth,
          medallionTotalW,
          ayahNum: ayahNum || undefined,
          ayahSymbolPosition,
          ayahSymbolStyle,
        });
      });

      // ------------------ QURAN.COM CINEMA STRIP CONTAINER RENDERING ------------------
      // Group clips with textBackgroundStyle === 'strip' into unified Quran Cinema Cards
      const renderedCinemaClipIds = new Set<string>();
      const renderedMedallionAyahNumbers = new Set<number>();
      const stripLayers = preparedTextLayers.filter(l => l.clip.textBackgroundStyle === 'strip');

      stripLayers.forEach(layer => {
        if (renderedCinemaClipIds.has(layer.clip.id)) return;

        // Find all layers that should belong to this Cinema Card group
        const group: PreparedTextLayer[] = [layer];
        renderedCinemaClipIds.add(layer.clip.id);

        stripLayers.forEach(other => {
          if (renderedCinemaClipIds.has(other.clip.id)) return;
          const isLinked = layer.clip.linkedClipId === other.clip.id || other.clip.linkedClipId === layer.clip.id;
          const isBothQuran = (
            (layer.clip.trackId?.includes('quran') || layer.clip.name?.startsWith('AR:') || layer.clip.name?.startsWith('EN:') || /[\u0600-\u06FF]/.test(layer.clip.text || '')) &&
            (other.clip.trackId?.includes('quran') || other.clip.name?.startsWith('AR:') || other.clip.name?.startsWith('EN:') || /[\u0600-\u06FF]/.test(other.clip.text || ''))
          );
          const isVerticallyClose = Math.abs(layer.yPos - other.yPos) < dimensions.height * 0.70;

          if (isLinked || isBothQuran || isVerticallyClose) {
            group.push(other);
            renderedCinemaClipIds.add(other.clip.id);
          }
        });

        // Compute unified bounding box for the Cinema Card
        const minBoxTop = Math.min(...group.map(g => g.boxTop));
        const maxBoxBottom = Math.max(...group.map(g => g.boxTop + g.blockH));

        const arLayer = group.find(g => isQuranArabicClip(g.clip));
        const enLayer = group.find(g => isTranslationClip(g.clip) || g !== arLayer);
        // CRITICAL: Only extract ayahNum if there is a Quran Arabic Ayah layer in this group! Ayah medallion NEVER appears without Quran Ayah!
        const ayahNum = arLayer ? (arLayer.clip.ayahNumber || extractAyahNumberFromClip(arLayer.clip)) : undefined;

        const medallionH = Math.max(34, Math.min(52, Math.round(dimensions.height * 0.052)));
        let medallionY = 0;
        if (ayahNum) {
          if (arLayer && enLayer) {
            const arBottom = arLayer.boxTop + arLayer.blockH;
            const enTop = enLayer.boxTop;
            medallionY = (arBottom + enTop) / 2;
          } else if (arLayer) {
            medallionY = arLayer.boxTop + arLayer.blockH + (medallionH / 2) + 12;
          } else {
            medallionY = (minBoxTop + maxBoxBottom) / 2;
          }
        }

        const primaryClip = group[0].clip;
        const bgPad = Math.max(16, Math.max(...group.map(g => g.clip.textBackgroundPadding ?? 18)));
        const bgRad = Math.max(18, Math.max(...group.map(g => g.clip.textBackgroundRadius ?? 20)));
        const bgOpac = Math.max(...group.map(g => g.clip.textBackgroundOpacity ?? 0.65));
        const bgBlur = Math.max(...group.map(g => g.clip.textBackgroundBlur ?? 0));
        const bgColor = primaryClip.textBackgroundColor && primaryClip.textBackgroundColor !== 'transparent'
          ? primaryClip.textBackgroundColor
          : '#000000';

        // Cinema card spans wide with elegant side margins (matching user reference image from Quran.com)
        const sideMargin = Math.max(20, Math.round(dimensions.width * 0.038));
        const cardLeft = sideMargin;
        const cardWidth = dimensions.width - (sideMargin * 2);

        // Vertical padding: spacious and balanced
        const vPad = Math.max(22, Math.round(bgPad * 1.4));
        const cardTop = minBoxTop - vPad;
        const effectiveMaxBottom = (ayahNum && arLayer && !enLayer)
          ? Math.max(maxBoxBottom, medallionY + (medallionH / 2) + 6)
          : maxBoxBottom;
        const cardHeight = (effectiveMaxBottom - minBoxTop) + (vPad * 2);
        const cornerRadius = Math.max(16, Math.min(32, bgRad));

        const groupAlpha = Math.max(...group.map(g => g.transState.alphaMultiplier));

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, groupAlpha * bgOpac));

        if (bgBlur > 0) {
          ctx.filter = `blur(${bgBlur}px)`;
        }

        // Ambient dark drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 4;

        // Dark translucent Cinema card
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(cardLeft, cardTop, cardWidth, cardHeight, cornerRadius);
        ctx.fill();

        // Clear shadow before drawing subtle border
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Crisp subtle 1.2px border framing as seen on Quran.com
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();

        // Render the authentic Quran.com ornate crowned Ayah medallion in the Cinema Card
        // Strictly render only ONE medallion per ayah number across the entire frame
        const isMedallionEnabled = primaryClip.ayahSymbolPosition === 'divider' && primaryClip.ayahSymbolStyle !== 'none';
        if (ayahNum && isMedallionEnabled && !renderedMedallionAyahNumbers.has(ayahNum)) {
          renderedMedallionAyahNumbers.add(ayahNum);
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, groupAlpha));
          drawCanvasAyahMedallion(
            ctx,
            dimensions.width / 2,
            medallionY,
            medallionH,
            ayahNum,
            'arabic',
            '#ffffff',
            primaryClip.ayahSymbolStyle || 'ornate-medallion'
          );
          ctx.restore();
        }
      });

      // ------------------ TEXT CONTENT & SELECTION RENDERING ------------------
      preparedTextLayers.forEach((layer) => {
        const { clip, transState, xPos, yPos, fontSize, fontStack, color, alignment, lines, lineGap, totalHeight, startY, blockW, blockH, boxLeft, boxTop } = layer;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, transState.alphaMultiplier));
        ctx.font = `bold ${fontSize}px ${fontStack}`;
        ctx.textAlign = alignment;
        ctx.textBaseline = 'middle';

          // ------------------ CapCut Text Animation Calculations ------------------
          const clipTime = Math.max(0, currentTime - clip.start);
          const animConfig = clip.textAnimation || {};
          const inAnim = animConfig.inAnimation || 'none';
          const inDur = animConfig.inDuration ?? 0.4;
          const outAnim = animConfig.outAnimation || 'none';
          const outDur = animConfig.outDuration ?? 0.4;
          const loopAnim = animConfig.loopAnimation || 'none';

          const inProgress = inDur > 0 ? Math.min(1, Math.max(0, clipTime / inDur)) : 1;
          const remainingTime = clip.duration - clipTime;
          const outProgress = outDur > 0 ? Math.min(1, Math.max(0, remainingTime / outDur)) : 1;

          const cubicEaseOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
          const cubicEaseIn = (t: number) => Math.pow(Math.min(1, Math.max(0, t)), 3);
          const elasticOut = (t: number) => {
            const clamped = Math.min(1, Math.max(0, t));
            if (clamped === 0 || clamped === 1) return clamped;
            const p = 0.3;
            return Math.pow(2, -10 * clamped) * Math.sin((clamped - p / 4) * (2 * Math.PI) / p) + 1;
          };

          let animAlpha = 1.0;
          let animScale = 1.0;
          let animOffsetX = 0;
          let animOffsetY = 0;
          let animGlowBoost = 0;

          // In Animation
          if (inAnim === 'fade') {
            animAlpha *= cubicEaseOut(inProgress);
          } else if (inAnim === 'pop' || inAnim === 'zoom-in') {
            animScale *= 0.15 + 0.85 * cubicEaseOut(inProgress);
            animAlpha *= Math.min(1, inProgress * 2.5);
          } else if (inAnim === 'slide-up') {
            animOffsetY += (1 - cubicEaseOut(inProgress)) * (fontSize * 1.5);
            animAlpha *= Math.min(1, inProgress * 2.5);
          } else if (inAnim === 'slide-down') {
            animOffsetY -= (1 - cubicEaseOut(inProgress)) * (fontSize * 1.5);
            animAlpha *= Math.min(1, inProgress * 2.5);
          } else if (inAnim === 'slide-left') {
            animOffsetX += (1 - cubicEaseOut(inProgress)) * (fontSize * 2.5);
            animAlpha *= Math.min(1, inProgress * 2.5);
          } else if (inAnim === 'slide-right') {
            animOffsetX -= (1 - cubicEaseOut(inProgress)) * (fontSize * 2.5);
            animAlpha *= Math.min(1, inProgress * 2.5);
          } else if (inAnim === 'bounce') {
            animScale *= elasticOut(inProgress);
            animAlpha *= Math.min(1, inProgress * 3);
          } else if (inAnim === 'glitch') {
            if (inProgress < 1.0) {
              animAlpha *= Math.random() > 0.3 ? cubicEaseOut(inProgress) : 0.2;
              animOffsetX += (Math.random() - 0.5) * 18 * (1 - inProgress);
              animOffsetY += (Math.random() - 0.5) * 10 * (1 - inProgress);
            }
          }

          // Out Animation
          if (outAnim === 'fade') {
            animAlpha *= cubicEaseIn(outProgress);
          } else if (outAnim === 'zoom-out') {
            animScale *= 0.15 + 0.85 * cubicEaseIn(outProgress);
            animAlpha *= cubicEaseIn(outProgress);
          } else if (outAnim === 'slide-down') {
            animOffsetY += (1 - cubicEaseIn(outProgress)) * (fontSize * 1.5);
            animAlpha *= cubicEaseIn(outProgress);
          } else if (outAnim === 'slide-up') {
            animOffsetY -= (1 - cubicEaseIn(outProgress)) * (fontSize * 1.5);
            animAlpha *= cubicEaseIn(outProgress);
          } else if (outAnim === 'slide-left') {
            animOffsetX -= (1 - cubicEaseIn(outProgress)) * (fontSize * 2.5);
            animAlpha *= cubicEaseIn(outProgress);
          } else if (outAnim === 'slide-right') {
            animOffsetX += (1 - cubicEaseIn(outProgress)) * (fontSize * 2.5);
            animAlpha *= cubicEaseIn(outProgress);
          }

          // Loop Animation
          if (loopAnim === 'pulse') {
            animScale *= 1 + 0.04 * Math.sin(clipTime * 4.5);
          } else if (loopAnim === 'float') {
            animOffsetY += Math.sin(clipTime * 2.5) * 7;
          } else if (loopAnim === 'bounce-loop') {
            animOffsetY += -Math.abs(Math.sin(clipTime * 5.5)) * 12;
          } else if (loopAnim === 'shimmer') {
            animGlowBoost = (Math.sin(clipTime * 6) + 1) * 10;
          }

          // In studio design / pause mode, ensure selected clip is clearly visible to the editor
          const isSelected = selectedClip?.id === clip.id || (selectedClipIds && selectedClipIds.includes(clip.id));
          if (!isPlaying && isSelected && !isExporting) {
            animAlpha = 1.0;
            animScale = 1.0;
            animOffsetX = 0;
            animOffsetY = 0;
          }

          // Save Canvas Context for Animation Transforms
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * animAlpha));
          ctx.translate(xPos + animOffsetX, yPos + animOffsetY);
          ctx.scale(animScale, animScale);
          ctx.translate(-xPos, -yPos);

          // Typewriter Karaoke reveal line text processing
          let renderLines = lines;
          if (inAnim === 'typewriter' && (!isSelected || isPlaying || isExporting)) {
            const totalChars = lines.join('').length;
            const revealCount = Math.floor(totalChars * cubicEaseOut(inProgress));
            let charAcc = 0;
            renderLines = lines.map((l) => {
              if (charAcc >= revealCount) return '';
              if (charAcc + l.length <= revealCount) {
                charAcc += l.length;
                return l;
              }
              const take = revealCount - charAcc;
              charAcc += l.length;
              return l.slice(0, take);
            });
          }

          // CapCut Speech Bubble Rendering
          if (clip.textBubble && clip.textBubble !== 'none') {
            ctx.save();
            const bPad = 14;
            const bX = boxLeft - bPad;
            const bY = boxTop - bPad;
            const bW = blockW + (bPad * 2);
            const bH = blockH + (bPad * 2);

            if (clip.textBubble === 'bubble-chat') {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.roundRect(bX, bY, bW, bH, 16);
              ctx.fill();
              ctx.stroke();
              // Tail
              ctx.beginPath();
              ctx.moveTo(bX + 30, bY + bH);
              ctx.lineTo(bX + 20, bY + bH + 14);
              ctx.lineTo(bX + 45, bY + bH);
              ctx.fill();
              ctx.stroke();
            } else if (clip.textBubble === 'bubble-neon') {
              ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 3;
              ctx.shadowColor = '#06b6d4';
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.roundRect(bX, bY, bW, bH, 8);
              ctx.fill();
              ctx.stroke();
            } else if (clip.textBubble === 'bubble-cloud') {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.beginPath();
              ctx.roundRect(bX, bY, bW, bH, 24);
              ctx.fill();
            } else if (clip.textBubble === 'bubble-ribbon') {
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.rect(bX - 8, bY, bW + 16, bH);
              ctx.fill();
            } else if (clip.textBubble === 'bubble-retro') {
              ctx.fillStyle = '#fef08a';
              ctx.strokeStyle = '#854d0e';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(bX, bY, bW, bH, 6);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }

          // Render background box overlay if specified (skip 'strip' as it is handled by the Quran.com Cinema container)
          if (clip.textBackgroundStyle && clip.textBackgroundStyle !== 'none' && clip.textBackgroundStyle !== 'strip' && clip.textBackgroundColor && clip.textBackgroundColor !== 'transparent') {
            const bgPad = clip.textBackgroundPadding ?? 8;
            const bgRad = clip.textBackgroundRadius ?? 8;
            const bgOpac = clip.textBackgroundOpacity ?? 0.6;
            const bgBlur = clip.textBackgroundBlur ?? 0;
            const bgStyle = clip.textBackgroundStyle;
            
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * bgOpac));
            
            if (bgBlur > 0) {
              ctx.filter = `blur(${bgBlur}px)`;
            }
            
            ctx.fillStyle = clip.textBackgroundColor;
            ctx.beginPath();
            
            if (bgStyle === 'glow') {
              const cx = boxLeft + blockW / 2;
              const cy = boxTop + blockH / 2;
              const r = Math.max(blockW, blockH) / 2 + bgPad * 2;
              const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
              grd.addColorStop(0, clip.textBackgroundColor);
              grd.addColorStop(1, 'transparent');
              ctx.fillStyle = grd;
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
            } else {
              // 'box' or default
              ctx.roundRect(boxLeft - bgPad, boxTop - bgPad, blockW + (bgPad * 2), blockH + (bgPad * 2), bgRad);
            }
            
            ctx.fill();
            ctx.restore();
          } else if (clip.textBackgroundColor && clip.textBackgroundColor !== 'transparent' && clip.textBackgroundStyle !== 'none' && clip.textBackgroundStyle !== 'strip') {
            // Legacy fallback if style isn't set but color is
            const bgPad = clip.textBackgroundPadding ?? 8;
            const bgRad = clip.textBackgroundRadius ?? 8;
            const bgOpac = clip.textBackgroundOpacity ?? 0.6;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * bgOpac));
            ctx.fillStyle = clip.textBackgroundColor;
            ctx.beginPath();
            ctx.roundRect(boxLeft - bgPad, boxTop - bgPad, blockW + (bgPad * 2), blockH + (bgPad * 2), bgRad);
            ctx.fill();
            ctx.restore();
          } else if (clip.textStyle === ('viral-reels' as any)) {
            // legacy viral-reels style background handling
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.beginPath();
            ctx.roundRect(boxLeft - 6, boxTop - 4, blockW + 12, blockH + 8, 8);
            ctx.fill();
            ctx.restore();
          }

          renderLines.forEach((lineText, idx) => {
            if (!lineText) return;
            const currentY = startY + idx * lineGap;

            // Calculate lineX with optical compensation for inline medallion on the target line
            let lineX = xPos;
            const isTargetLine = Boolean(layer.hasInlineMedallion && idx === layer.targetLineIdx && layer.medallionTotalW);
            if (isTargetLine && layer.medallionTotalW) {
              if (alignment === 'center') {
                if (layer.ayahSymbolPosition === 'start') {
                  lineX = xPos - (layer.medallionTotalW / 2);
                } else {
                  lineX = xPos + (layer.medallionTotalW / 2);
                }
              } else if (alignment === 'right') {
                if (layer.ayahSymbolPosition === 'start') {
                  lineX = xPos - layer.medallionTotalW;
                }
              } else if (alignment === 'left') {
                if (layer.ayahSymbolPosition === 'end') {
                  lineX = xPos + layer.medallionTotalW;
                }
              }
            }

            // 3D Text Extrusion Depth Layering
            if (clip.text3D && clip.text3D.depth3D && clip.text3D.depth3D > 0) {
              const depth = clip.text3D.depth3D;
              const shadowColor = clip.text3D.neonGlowColor || 'rgba(0,0,0,0.85)';
              ctx.save();
              ctx.fillStyle = shadowColor;
              for (let d = depth; d > 0; d--) {
                ctx.fillText(lineText, lineX + d * 0.8, currentY + d * 0.8);
              }
              if (clip.text3D.metallicBorder) {
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1.5;
                ctx.strokeText(lineText, lineX + depth * 0.8, currentY + depth * 0.8);
              }
              ctx.restore();
            }
            
            const strokeWidth = clip.textStrokeWidth !== undefined 
              ? clip.textStrokeWidth 
              : (clip.textStyle === 'outline' ? 4 : (clip.textStyle === ('gold-glow' as any) ? 2 : 0));

            if (strokeWidth > 0) {
              ctx.strokeStyle = clip.textStrokeColor || (clip.textStyle === ('gold-glow' as any) ? '#78350f' : '#000000');
              ctx.lineWidth = strokeWidth;
              ctx.strokeText(lineText, lineX, currentY);
            }

            const effectiveGlow = (clip.textGlowIntensity ?? (clip.textStyle === 'neon' ? 15 : 0)) + animGlowBoost;

            if (effectiveGlow > 0) {
              ctx.shadowColor = clip.textGlowColor || color;
              ctx.shadowBlur = effectiveGlow;
            } else if (clip.textStyle === ('gold-glow' as any)) {
              ctx.shadowColor = '#f59e0b';
              ctx.shadowBlur = 24 + animGlowBoost;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
            } else if (clip.textStyle === 'neon') {
              ctx.shadowColor = clip.textGlowColor || color;
              ctx.shadowBlur = 18 + animGlowBoost;
            } else if (clip.textStyle === 'shadow') {
              ctx.shadowColor = 'rgba(0,0,0,0.85)';
              ctx.shadowBlur = 6;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
            }

            ctx.fillStyle = clip.textStyle === 'neon' ? '#FFFFFF' : (clip.textStyle === ('gold-glow' as any) ? '#fbbf24' : (clip.textStyle === ('viral-reels' as any) ? '#facc15' : color));
            ctx.fillText(lineText, lineX, currentY);

            // Real-Time Karaoke Word-by-Word Glow Overlay
            const isKaraokeActive = (clip.textAnimation?.inAnimation as any) === 'karaoke' || Boolean((clip as any).karaokeHighlight);
            if (isKaraokeActive && clip.duration > 0 && lineText && lineText.trim().length > 0) {
              const clipProgress = Math.max(0, Math.min(1, (currentTime - clip.start) / clip.duration));
              const isRTL = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(lineText);
              const tokens = lineText.split(/(\s+)/);
              const wordTokenIndices: number[] = [];
              tokens.forEach((tok, idx) => {
                if (tok.trim().length > 0) wordTokenIndices.push(idx);
              });
              if (wordTokenIndices.length > 0) {
                const activeWordPos = Math.min(
                  wordTokenIndices.length - 1,
                  Math.floor(clipProgress * wordTokenIndices.length)
                );
                const activeTokenIdx = wordTokenIndices[activeWordPos];

                const fullW = ctx.measureText(lineText).width;
                let wordStartX = lineX;
                if (alignment === 'center') {
                  wordStartX = lineX - (fullW / 2);
                } else if (alignment === 'right') {
                  wordStartX = lineX - fullW;
                }

                // Compute exact X offset for the active word (Right-to-Left for Arabic/RTL, Left-to-Right for English/LTR)
                let runningOffset = 0;
                if (isRTL) {
                  // In RTL rendering, words preceding the active word in speech are on the right,
                  // so the active word's distance from the left edge is the sum of subsequent tokens
                  for (let i = activeTokenIdx + 1; i < tokens.length; i++) {
                    runningOffset += ctx.measureText(tokens[i]).width;
                  }
                } else {
                  // In LTR rendering, active word's distance from left is sum of preceding tokens
                  for (let i = 0; i < activeTokenIdx; i++) {
                    runningOffset += ctx.measureText(tokens[i]).width;
                  }
                }

                const activeTok = tokens[activeTokenIdx];
                if (activeTok && activeTok.trim().length > 0) {
                  ctx.save();
                  ctx.textAlign = 'left';
                  ctx.shadowColor = (clip as any).karaokeColor || '#F59E0B';
                  ctx.shadowBlur = 22;
                  ctx.fillStyle = (clip as any).karaokeColor || '#FBBF24';
                  ctx.fillText(activeTok, wordStartX + runningOffset, currentY);
                  ctx.restore();
                }
              }
            }

            // Draw inline crowned Ayah medallion on the target line (inside animation transform context)
            if (isTargetLine && layer.ayahNum && lineText && lineText.trim().length > 0) {
              const targetLineWidth = ctx.measureText(lineText).width;
              const medH = layer.medH ?? Math.round(fontSize * 1.05);
              const halfMed = (layer.medWidth ?? Math.round(medH * 0.52)) / 2;
              const gap = layer.medGap ?? Math.max(10, Math.round(fontSize * 0.22));
              let medX = lineX;

              if (alignment === 'center') {
                if (layer.ayahSymbolPosition === 'start') {
                  medX = lineX + (targetLineWidth / 2) + gap + halfMed;
                } else {
                  medX = lineX - (targetLineWidth / 2) - gap - halfMed;
                }
              } else if (alignment === 'right') {
                if (layer.ayahSymbolPosition === 'start') {
                  medX = lineX + gap + halfMed;
                } else {
                  medX = lineX - targetLineWidth - gap - halfMed;
                }
              } else { // 'left'
                if (layer.ayahSymbolPosition === 'start') {
                  medX = lineX + targetLineWidth + gap + halfMed;
                } else {
                  medX = lineX - gap - halfMed;
                }
              }

              drawCanvasAyahMedallion(
                ctx,
                medX,
                currentY,
                medH,
                layer.ayahNum,
                (clip.ayahDigitType as any) || 'arabic',
                clip.color || '#ffffff',
                layer.ayahSymbolStyle || 'ornate-medallion'
              );
            }
          });

          ctx.restore(); // Restore Canvas Context after Animation Transforms

          // Divider Ayah medallion if position === 'divider' (strictly for Quran Arabic!)
          if (isQuranArabicClip(clip)) {
            const ayahNum = clip.ayahNumber || extractAyahNumberFromClip(clip);
            const ayahSymbolStyle = clip.ayahSymbolStyle && clip.ayahSymbolStyle !== 'none' ? clip.ayahSymbolStyle : 'ornate-medallion';
            const ayahSymbolPosition = clip.ayahSymbolPosition || 'end';
            if (ayahNum && ayahSymbolPosition === 'divider') {
              if (!renderedMedallionAyahNumbers.has(ayahNum)) {
                renderedMedallionAyahNumbers.add(ayahNum);
                const medH = Math.max(30, Math.min(48, Math.round(dimensions.height * 0.048)));
                const medY = boxTop + blockH + (medH / 2) + 8;
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, transState.alphaMultiplier));
                drawCanvasAyahMedallion(
                  ctx,
                  dimensions.width / 2,
                  medY,
                  medH,
                  ayahNum,
                  (clip.ayahDigitType as any) || 'arabic',
                  clip.color || '#ffffff',
                  ayahSymbolStyle
                );
                ctx.restore();
              }
            }
          }

          // Draw CapCut Pro Selection Handles & Bounding Box if Selected
          if (selectedClip?.id === clip.id && !isExporting) {
            ctx.save();
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(boxLeft, boxTop, blockW, blockH);
            ctx.setLineDash([]);

            // Render 4 corner resize handles
            const corners = [
              { x: boxLeft, y: boxTop },
              { x: boxLeft + blockW, y: boxTop },
              { x: boxLeft, y: boxTop + blockH },
              { x: boxLeft + blockW, y: boxTop + blockH },
            ];

            corners.forEach((c) => {
              ctx.fillStyle = '#06b6d4';
              ctx.beginPath();
              ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
              ctx.fill();
            });

            // CapCut Pro Floating Tag
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(boxLeft, boxTop - 26, 210, 20, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨ CapCut Pro Text • Drag / Corner Scale', boxLeft + 8, boxTop - 16);

            ctx.restore();
          }

          ctx.restore();
      });

      // ------------------ CAPCUT PRO MULTI-SELECTION GROUP TRANSFORM MATRIX ------------------
      const activeSelectedIds = selectedClipIds && selectedClipIds.length > 0
        ? selectedClipIds
        : (selectedClip ? [selectedClip.id] : []);
      const activeSelectedClips = activeFrameClips.filter(c => activeSelectedIds.includes(c.id));

      if (activeSelectedClips.length > 1 && !isExporting) {
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        activeSelectedClips.forEach(c => {
          if (c.type === ClipType.TEXT) {
            const bound = textBoundsRef.current[c.id];
            if (bound) {
              minLeft = Math.min(minLeft, bound.left);
              minTop = Math.min(minTop, bound.top);
              maxRight = Math.max(maxRight, bound.left + bound.width);
              maxBottom = Math.max(maxBottom, bound.top + bound.height);
            } else {
              const xPos = ((c.textX ?? 50) / 100) * dimensions.width;
              const yPos = ((c.textY ?? 50) / 100) * dimensions.height;
              minLeft = Math.min(minLeft, xPos - 80);
              minTop = Math.min(minTop, yPos - 30);
              maxRight = Math.max(maxRight, xPos + 80);
              maxBottom = Math.max(maxBottom, yPos + 30);
            }
          } else if (c.type === ClipType.VIDEO) {
            const interpolated = getInterpolatedClipProperties(c, currentTime);
            const scale = interpolated.scale / 100;
            const posX = interpolated.posX;
            const posY = interpolated.posY;
            const boxW = dimensions.width * scale;
            const boxH = dimensions.height * scale;
            const cLeft = dimensions.width / 2 + posX - boxW / 2;
            const cTop = dimensions.height / 2 + posY - boxH / 2;
            minLeft = Math.min(minLeft, cLeft);
            minTop = Math.min(minTop, cTop);
            maxRight = Math.max(maxRight, cLeft + boxW);
            maxBottom = Math.max(maxBottom, cTop + boxH);
          }
        });

        if (isFinite(minLeft) && isFinite(minTop) && isFinite(maxRight) && isFinite(maxBottom)) {
          const groupW = maxRight - minLeft;
          const groupH = maxBottom - minTop;
          const groupLeft = minLeft;
          const groupTop = minTop;

          groupBoundsRef.current = {
            left: groupLeft,
            top: groupTop,
            width: groupW,
            height: groupH,
            centerX: groupLeft + groupW / 2,
            centerY: groupTop + groupH / 2,
            clips: activeSelectedClips,
          };

          ctx.save();
          // Render Bright Red snap lines guides (#ef4444) with glowing bounding box
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 4]);
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.strokeRect(groupLeft - 8, groupTop - 8, groupW + 16, groupH + 16);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Corner Handles (Bright Red with White inner dot)
          const corners = [
            { x: groupLeft - 8, y: groupTop - 8 },
            { x: groupLeft + groupW + 8, y: groupTop - 8 },
            { x: groupLeft - 8, y: groupTop + groupH + 8 },
            { x: groupLeft + groupW + 8, y: groupTop + groupH + 8 },
          ];

          corners.forEach((c) => {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // CapCut Pro Floating Group Matrix Tag
          ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(groupLeft - 8, groupTop - 34, 300, 22, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🎯 CapCut Pro Group Matrix (${activeSelectedClips.length} Items Selected)`, groupLeft, groupTop - 23);

          ctx.restore();
        }
      } else {
        groupBoundsRef.current = null;
      }

      // ------------------ SAFE AREA GRID OVERLAY & BOUNDARY MASK ------------------
      if (showSafeArea && !isExporting) {
        ctx.save();
        ctx.lineWidth = 1.5;

        // 1. Title/Action Safe Outer Margin Box (80% / 90% Safe Zone)
        const marginX = dimensions.width * 0.08;
        const marginY = dimensions.height * 0.08;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'; // Amber dashed
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(marginX, marginY, dimensions.width - marginX * 2, dimensions.height - marginY * 2);

        // Inner 90% Action Safe Line
        const marginX90 = dimensions.width * 0.05;
        const marginY90 = dimensions.height * 0.05;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan dashed
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(marginX90, marginY90, dimensions.width - marginX90 * 2, dimensions.height - marginY90 * 2);

        // 2. 9:16 Smartphone Platform UI Safety Zones (YouTube Shorts, Reels, TikTok)
        // Top Header / Search / Notch Danger Zone (Top 12%)
        const topDangerH = dimensions.height * 0.12;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(0, 0, dimensions.width, topDangerH);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, topDangerH);
        ctx.lineTo(dimensions.width, topDangerH);
        ctx.stroke();

        // Bottom Captions & Description Danger Zone (Bottom 20%)
        const bottomDangerY = dimensions.height * 0.80;
        const bottomDangerH = dimensions.height * 0.20;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fillRect(0, bottomDangerY, dimensions.width, bottomDangerH);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.beginPath();
        ctx.moveTo(0, bottomDangerY);
        ctx.lineTo(dimensions.width, bottomDangerY);
        ctx.stroke();

        // Right Side Action Buttons Margin (Right 16%, Y: 35% to 80%)
        const rightDangerX = dimensions.width * 0.84;
        const rightDangerY = dimensions.height * 0.35;
        const rightDangerW = dimensions.width * 0.16;
        const rightDangerH = dimensions.height * 0.45;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.10)';
        ctx.fillRect(rightDangerX, rightDangerY, rightDangerW, rightDangerH);

        // Draw Labels for Safety Zones
        ctx.setLineDash([]);
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Top Label
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('📱 TOP HEADER / NOTCH DANGER ZONE', dimensions.width / 2, topDangerH / 2);

        // Bottom Label
        ctx.fillStyle = '#fde68a';
        ctx.fillText('💬 SUBTITLE / CAPTION SAFE ZONE (Shorts/Reels)', dimensions.width / 2, bottomDangerY + 16);

        // 9:16 Vertical Crop Guidelines for 16:9 Canvas
        if (dimensions.width > dimensions.height) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.setLineDash([6, 6]);
          const cropX1 = dimensions.width * 0.28125;
          const cropX2 = dimensions.width * 0.71875;
          ctx.beginPath();
          ctx.moveTo(cropX1, 0); ctx.lineTo(cropX1, dimensions.height);
          ctx.moveTo(cropX2, 0); ctx.lineTo(cropX2, dimensions.height);
          ctx.stroke();

          ctx.fillStyle = '#67e8f9';
          ctx.font = '10px monospace';
          ctx.fillText('📱 9:16 Shorts/Reels Center Crop Frame', dimensions.width / 2, marginY + 12);
        }

        ctx.restore();
      }

      // ------------------ WATERMARK / LOGO LAYER ------------------
      if (watermark && watermark.enabled && watermark.url) {
        ctx.save();
        let wmImg = watermarkImgRef.current;
        if (!wmImg || wmImg.getAttribute('data-src') !== watermark.url) {
          wmImg = new Image();
          wmImg.setAttribute('data-src', watermark.url);
          wmImg.crossOrigin = getSafeCrossOrigin(watermark.url) || 'anonymous';
          wmImg.src = normalizeMediaUrl(watermark.url);
          watermarkImgRef.current = wmImg;
        }

        if (wmImg.complete && wmImg.naturalWidth > 0) {
          ctx.globalAlpha = Math.max(0.05, Math.min(1, watermark.opacity ?? 0.8));
          
          const scalePct = (watermark.scale ?? 20) / 100;
          const targetW = dimensions.width * scalePct;
          const targetH = targetW * (wmImg.naturalHeight / wmImg.naturalWidth);
          const margin = 24;

          let wmX = margin;
          let wmY = margin;

          if (watermark.position === 'top-right') {
            wmX = dimensions.width - targetW - margin;
            wmY = margin;
          } else if (watermark.position === 'bottom-left') {
            wmX = margin;
            wmY = dimensions.height - targetH - margin;
          } else if (watermark.position === 'bottom-right') {
            wmX = dimensions.width - targetW - margin;
            wmY = dimensions.height - targetH - margin;
          }

          ctx.drawImage(wmImg, wmX, wmY, targetW, targetH);
        }
        ctx.restore();
      }

      // ------------------ SMART ALIGNMENT GUIDELINES & SNAPPING LINES ------------------
      const activeSnap = activeSnapRef.current;
      if ((activeSnap.x !== null || activeSnap.y !== null || activeSnap.label) && !isExporting) {
        ctx.save();
        ctx.lineWidth = 1.5;

        // Vertical guideline for X-axis snap
        if (activeSnap.x !== null) {
          const lineX = dimensions.width * (activeSnap.x / 100);
          ctx.strokeStyle = activeSnap.x === 50 ? '#ef4444' : '#06b6d4'; // Red for center 50%, Cyan for others
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(lineX, 0);
          ctx.lineTo(lineX, dimensions.height);
          ctx.stroke();

          // Center Crosshair Node
          ctx.fillStyle = activeSnap.x === 50 ? '#ef4444' : '#06b6d4';
          ctx.beginPath();
          ctx.arc(lineX, dimensions.height / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Horizontal guideline for Y-axis snap
        if (activeSnap.y !== null) {
          const lineY = dimensions.height * (activeSnap.y / 100);
          ctx.strokeStyle = activeSnap.y === 50 ? '#ef4444' : '#06b6d4';
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(dimensions.width, lineY);
          ctx.stroke();

          // Center Crosshair Node
          ctx.fillStyle = activeSnap.y === 50 ? '#ef4444' : '#06b6d4';
          ctx.beginPath();
          ctx.arc(dimensions.width / 2, lineY, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dynamic Alignment Coordinate Badge Overlay
        if (activeSnap.label) {
          ctx.setLineDash([]);
          ctx.font = 'bold 11px monospace';
          const textWidth = ctx.measureText(activeSnap.label).width;
          const badgeW = textWidth + 24;
          const badgeH = 26;
          const badgeX = (dimensions.width - badgeW) / 2;
          const badgeY = 16;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.strokeStyle = activeSnap.x === 50 || activeSnap.y === 50 ? '#ef4444' : '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = activeSnap.x === 50 || activeSnap.y === 50 ? '#fca5a5' : '#67e8f9';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🎯 ${activeSnap.label}`, dimensions.width / 2, badgeY + badgeH / 2);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [tracks, currentTime, dimensions, isPlaying, videoNodes, showGrid, showSafeArea, selectedClip]);

  // Canvas Mouse Coordinates Helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const boundsList: TextBound[] = Object.values(textBoundsRef.current);

    // Check group corner handles first if group bounds active
    if (groupBoundsRef.current && groupBoundsRef.current.clips.length > 1) {
      const gb = groupBoundsRef.current;
      const corners = [
        { x: gb.left - 8, y: gb.top - 8 },
        { x: gb.left + gb.width + 8, y: gb.top - 8 },
        { x: gb.left - 8, y: gb.top + gb.height + 8 },
        { x: gb.left + gb.width + 8, y: gb.top + gb.height + 8 },
      ];
      for (const c of corners) {
        if (Math.hypot(coords.x - c.x, coords.y - c.y) <= 18) {
          setIsResizingGroup(true);
          setDragStart(coords);
          initialGroupClipsPos.current = gb.clips.map(clip => ({
            clip,
            initialX: clip.textX ?? 50,
            initialY: clip.textY ?? 50,
            initialFontSize: clip.fontSize ?? 32,
            initialScale: clip.transform?.scale ?? 100,
          }));
          return;
        }
      }

      // Check inside group bounding box for multi-clip dragging
      if (
        coords.x >= gb.left - 8 &&
        coords.x <= gb.left + gb.width + 8 &&
        coords.y >= gb.top - 8 &&
        coords.y <= gb.top + gb.height + 8
      ) {
        setIsDraggingGroup(true);
        setDragStart(coords);
        initialGroupClipsPos.current = gb.clips.map(clip => ({
          clip,
          initialX: clip.type === ClipType.TEXT ? (clip.textX ?? 50) : (clip.transform?.posX ?? 0),
          initialY: clip.type === ClipType.TEXT ? (clip.textY ?? 50) : (clip.transform?.posY ?? 0),
          initialFontSize: clip.fontSize ?? 32,
          initialScale: clip.transform?.scale ?? 100,
        }));
        return;
      }
    }

    // Check single selected video clip dragging & handle
    if (selectedClip && selectedClip.type === ClipType.VIDEO) {
      const interpolated = getInterpolatedClipProperties(selectedClip, currentTime);
      const scale = interpolated.scale / 100;
      const posX = interpolated.posX;
      const posY = interpolated.posY;
      const boxW = dimensions.width * scale;
      const boxH = dimensions.height * scale;
      const vLeft = dimensions.width / 2 + posX - boxW / 2;
      const vTop = dimensions.height / 2 + posY - boxH / 2;

      // Check corner handles of single video clip
      const corners = [
        { x: vLeft, y: vTop },
        { x: vLeft + boxW, y: vTop },
        { x: vLeft, y: vTop + boxH },
        { x: vLeft + boxW, y: vTop + boxH },
      ];
      for (const c of corners) {
        if (Math.hypot(coords.x - c.x, coords.y - c.y) <= 18) {
          setIsResizingGroup(true);
          setDragStart(coords);
          initialGroupClipsPos.current = [{
            clip: selectedClip,
            initialX: posX,
            initialY: posY,
            initialFontSize: 32,
            initialScale: scale * 100,
          }];
          return;
        }
      }

      // Check inside video box for dragging
      if (coords.x >= vLeft && coords.x <= vLeft + boxW && coords.y >= vTop && coords.y <= vTop + boxH) {
        setIsDraggingGroup(true);
        setDragStart(coords);
        initialGroupClipsPos.current = [{
          clip: selectedClip,
          initialX: posX,
          initialY: posY,
          initialFontSize: 32,
          initialScale: scale * 100,
        }];
        return;
      }
    }

    // Check corner handles of single selected clip
    if (selectedClip && selectedClip.type === ClipType.TEXT) {
      const bound = textBoundsRef.current[selectedClip.id];
      if (bound) {
        const corners = [
          { x: bound.left, y: bound.top },
          { x: bound.left + bound.width, y: bound.top },
          { x: bound.left, y: bound.top + bound.height },
          { x: bound.left + bound.width, y: bound.top + bound.height },
        ];
        for (const c of corners) {
          if (Math.hypot(coords.x - c.x, coords.y - c.y) <= 18) {
            setIsResizingText(true);
            setDragStart(coords);
            setInitialTextPos({
              x: selectedClip.textX ?? 50,
              y: selectedClip.textY ?? 50,
              fontSize: selectedClip.fontSize ?? 32,
            });
            return;
          }
        }
      }
    }

    // Check inside bounding boxes for click selection & drag
    for (const item of boundsList) {
      if (
        coords.x >= item.left &&
        coords.x <= item.left + item.width &&
        coords.y >= item.top &&
        coords.y <= item.top + item.height
      ) {
        const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
        if (isMulti && onSelectClips) {
          const currentIds = selectedClipIds && selectedClipIds.length > 0 ? selectedClipIds : (selectedClip ? [selectedClip.id] : []);
          if (currentIds.includes(item.clip.id)) {
            onSelectClips(currentIds.filter(id => id !== item.clip.id));
          } else {
            onSelectClips([...currentIds, item.clip.id]);
          }
        } else {
          onSelectClip?.(item.clip);
        }
        setIsDraggingText(true);
        setDragStart(coords);
        setInitialTextPos({
          x: item.clip.textX ?? 50,
          y: item.clip.textY ?? 50,
          fontSize: item.clip.fontSize ?? 32,
        });
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (isDraggingGroup && initialGroupClipsPos.current.length > 0) {
      const rawDeltaX = coords.x - dragStart.x;
      const rawDeltaY = coords.y - dragStart.y;

      // Determine center position of the dragged item / group
      let primaryCenterX = dimensions.width / 2;
      let primaryCenterY = dimensions.height / 2;

      if (groupBoundsRef.current && groupBoundsRef.current.clips.length > 1) {
        primaryCenterX = groupBoundsRef.current.centerX + rawDeltaX;
        primaryCenterY = groupBoundsRef.current.centerY + rawDeltaY;
      } else if (initialGroupClipsPos.current.length === 1) {
        const item = initialGroupClipsPos.current[0];
        if (item.clip.type === ClipType.VIDEO) {
          primaryCenterX = dimensions.width / 2 + item.initialX + rawDeltaX;
          primaryCenterY = dimensions.height / 2 + item.initialY + rawDeltaY;
        } else {
          const rawXPct = item.initialX + (rawDeltaX / dimensions.width) * 100;
          const rawYPct = item.initialY + (rawDeltaY / dimensions.height) * 100;
          primaryCenterX = (rawXPct / 100) * dimensions.width;
          primaryCenterY = (rawYPct / 100) * dimensions.height;
        }
      }

      const canvasCenterX = dimensions.width / 2;
      const canvasCenterY = dimensions.height / 2;
      const snapThreshold = 14; // pixels

      let snappedDeltaX = rawDeltaX;
      let snappedDeltaY = rawDeltaY;
      let snapXPct: number | null = null;
      let snapYPct: number | null = null;
      const snapLabels: string[] = [];

      // Horizontal Center Alignment Snap (50%)
      if (Math.abs(primaryCenterX - canvasCenterX) < snapThreshold) {
        snappedDeltaX = rawDeltaX + (canvasCenterX - primaryCenterX);
        snapXPct = 50;
        snapLabels.push('X: CENTER (50%)');
      } else if (Math.abs(primaryCenterX - dimensions.width * 0.25) < snapThreshold) {
        snappedDeltaX = rawDeltaX + (dimensions.width * 0.25 - primaryCenterX);
        snapXPct = 25;
        snapLabels.push('X: 25%');
      } else if (Math.abs(primaryCenterX - dimensions.width * 0.75) < snapThreshold) {
        snappedDeltaX = rawDeltaX + (dimensions.width * 0.75 - primaryCenterX);
        snapXPct = 75;
        snapLabels.push('X: 75%');
      }

      // Vertical Center Alignment Snap (50%)
      if (Math.abs(primaryCenterY - canvasCenterY) < snapThreshold) {
        snappedDeltaY = rawDeltaY + (canvasCenterY - primaryCenterY);
        snapYPct = 50;
        snapLabels.push('Y: CENTER (50%)');
      } else if (Math.abs(primaryCenterY - dimensions.height * 0.25) < snapThreshold) {
        snappedDeltaY = rawDeltaY + (dimensions.height * 0.25 - primaryCenterY);
        snapYPct = 25;
        snapLabels.push('Y: 25%');
      } else if (Math.abs(primaryCenterY - dimensions.height * 0.75) < snapThreshold) {
        snappedDeltaY = rawDeltaY + (dimensions.height * 0.75 - primaryCenterY);
        snapYPct = 75;
        snapLabels.push('Y: 75%');
      }

      activeSnapRef.current = {
        x: snapXPct,
        y: snapYPct,
        label: snapLabels.length > 0
          ? snapLabels.join(' • ')
          : `X: ${Math.round((primaryCenterX / dimensions.width) * 100)}% | Y: ${Math.round((primaryCenterY / dimensions.height) * 100)}%`
      };

      const deltaXPct = (snappedDeltaX / dimensions.width) * 100;
      const deltaYPct = (snappedDeltaY / dimensions.height) * 100;

      const updates: { id: string; updates: Partial<Clip> }[] = [];

      initialGroupClipsPos.current.forEach(item => {
        const clip = item.clip;
        if (clip.type === ClipType.TEXT) {
          const newX = Math.max(2, Math.min(98, item.initialX + deltaXPct));
          const newY = Math.max(2, Math.min(98, item.initialY + deltaYPct));
          updates.push({ id: clip.id, updates: { textX: newX, textY: newY } });
        } else if (clip.type === ClipType.VIDEO) {
          const newPosX = item.initialX + snappedDeltaX;
          const newPosY = item.initialY + snappedDeltaY;
          updates.push({
            id: clip.id,
            updates: {
              transform: {
                scale: clip.transform?.scale ?? 100,
                rotation: clip.transform?.rotation ?? 0,
                posX: newPosX,
                posY: newPosY,
              }
            }
          });
        }
      });

      if (onBatchUpdateClips) {
        onBatchUpdateClips(updates);
      } else {
        updates.forEach(u => onUpdateClip?.(u.id, u.updates));
      }
      return;
    }

    if (isResizingGroup && groupBoundsRef.current && initialGroupClipsPos.current.length > 0) {
      const gb = groupBoundsRef.current;
      const dist = Math.hypot(coords.x - gb.centerX, coords.y - gb.centerY);
      const initDist = Math.hypot(dragStart.x - gb.centerX, dragStart.y - gb.centerY);
      const factor = dist / (initDist || 1);

      const updates: { id: string; updates: Partial<Clip> }[] = [];

      initialGroupClipsPos.current.forEach(item => {
        const clip = item.clip;
        if (clip.type === ClipType.TEXT) {
          const newFontSize = Math.max(10, Math.min(180, Math.round(item.initialFontSize * factor)));
          updates.push({ id: clip.id, updates: { fontSize: newFontSize } });
        } else if (clip.type === ClipType.VIDEO) {
          const newScale = Math.max(10, Math.min(500, Math.round(item.initialScale * factor)));
          updates.push({
            id: clip.id,
            updates: {
              transform: {
                ...clip.transform,
                scale: newScale,
                posX: clip.transform?.posX ?? 0,
                posY: clip.transform?.posY ?? 0,
                rotation: clip.transform?.rotation ?? 0,
              }
            }
          });
        }
      });

      if (onBatchUpdateClips) {
        onBatchUpdateClips(updates);
      } else {
        updates.forEach(u => onUpdateClip?.(u.id, u.updates));
      }
      return;
    }

    if (isDraggingText && selectedClip) {
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;
      const rawX = initialTextPos.x + (deltaX / dimensions.width) * 100;
      const rawY = initialTextPos.y + (deltaY / dimensions.height) * 100;

      const rawPixelX = (rawX / 100) * dimensions.width;
      const rawPixelY = (rawY / 100) * dimensions.height;

      // Active text bounding box dimensions
      const bound = textBoundsRef.current[selectedClip.id];
      const textW = bound ? bound.width : 100;
      const textH = bound ? bound.height : 40;

      const rawLeft = rawPixelX - textW / 2;
      const rawRight = rawPixelX + textW / 2;
      const rawTop = rawPixelY - textH / 2;
      const rawBottom = rawPixelY + textH / 2;

      const SNAP_THRESHOLD_PX = 7; // 7px threshold check
      let snappedPixelX = rawPixelX;
      let snappedPixelY = rawPixelY;
      let snapX: number | null = null;
      let snapY: number | null = null;
      const snapLabels: string[] = [];

      // Canvas viewport center axes (50% X & Y)
      const canvasCenterX = dimensions.width / 2;
      const canvasCenterY = dimensions.height / 2;

      // 1. Horizontal Snapping (X-axis) - Bounding rect (centerX, left, right)
      if (Math.abs(rawPixelX - canvasCenterX) <= SNAP_THRESHOLD_PX) {
        snappedPixelX = canvasCenterX;
        snapX = 50;
        snapLabels.push('X: CENTER (50%)');
      } else if (Math.abs(rawLeft - 20) <= SNAP_THRESHOLD_PX) {
        snappedPixelX = 20 + textW / 2;
        snapX = (snappedPixelX / dimensions.width) * 100;
        snapLabels.push('X: LEFT MARGIN');
      } else if (Math.abs(rawRight - (dimensions.width - 20)) <= SNAP_THRESHOLD_PX) {
        snappedPixelX = dimensions.width - 20 - textW / 2;
        snapX = (snappedPixelX / dimensions.width) * 100;
        snapLabels.push('X: RIGHT MARGIN');
      }

      // Check static video/text layer objects on canvas at currentTime
      if (snapX === null) {
        for (const trk of tracks) {
          for (const clp of trk.clips) {
            if (clp.id === selectedClip.id) continue;
            if (clp.start <= currentTime && clp.start + clp.duration >= currentTime) {
              const otherBound = textBoundsRef.current[clp.id];
              const otherCenterX = clp.type === ClipType.TEXT 
                ? ((clp.textX ?? 50) / 100) * dimensions.width 
                : dimensions.width / 2 + (clp.transform?.posX ?? 0);

              if (Math.abs(rawPixelX - otherCenterX) <= SNAP_THRESHOLD_PX) {
                snappedPixelX = otherCenterX;
                snapX = (otherCenterX / dimensions.width) * 100;
                snapLabels.push(`X: ALIGNED TO ${clp.name || 'LAYER'}`);
                break;
              }
            }
          }
          if (snapX !== null) break;
        }
      }

      // 2. Vertical Snapping (Y-axis) - Bounding rect (centerY, top, bottom)
      if (Math.abs(rawPixelY - canvasCenterY) <= SNAP_THRESHOLD_PX) {
        snappedPixelY = canvasCenterY;
        snapY = 50;
        snapLabels.push('Y: CENTER (50%)');
      } else if (Math.abs(rawTop - 20) <= SNAP_THRESHOLD_PX) {
        snappedPixelY = 20 + textH / 2;
        snapY = (snappedPixelY / dimensions.height) * 100;
        snapLabels.push('Y: TOP MARGIN');
      } else if (Math.abs(rawBottom - (dimensions.height - 20)) <= SNAP_THRESHOLD_PX) {
        snappedPixelY = dimensions.height - 20 - textH / 2;
        snapY = (snappedPixelY / dimensions.height) * 100;
        snapLabels.push('Y: BOTTOM MARGIN');
      }

      // Check static video/text layer objects vertically
      if (snapY === null) {
        for (const trk of tracks) {
          for (const clp of trk.clips) {
            if (clp.id === selectedClip.id) continue;
            if (clp.start <= currentTime && clp.start + clp.duration >= currentTime) {
              const otherCenterY = clp.type === ClipType.TEXT 
                ? ((clp.textY ?? 50) / 100) * dimensions.height 
                : dimensions.height / 2 + (clp.transform?.posY ?? 0);

              if (Math.abs(rawPixelY - otherCenterY) <= SNAP_THRESHOLD_PX) {
                snappedPixelY = otherCenterY;
                snapY = (otherCenterY / dimensions.height) * 100;
                snapLabels.push(`Y: ALIGNED TO ${clp.name || 'LAYER'}`);
                break;
              }
            }
          }
          if (snapY !== null) break;
        }
      }

      const finalPctX = Math.max(2, Math.min(98, (snappedPixelX / dimensions.width) * 100));
      const finalPctY = Math.max(2, Math.min(98, (snappedPixelY / dimensions.height) * 100));

      activeSnapRef.current = {
        x: snapX,
        y: snapY,
        label: snapLabels.length > 0 ? snapLabels.join(' • ') : `X: ${Math.round(finalPctX)}% | Y: ${Math.round(finalPctY)}%`
      };

      onUpdateClip?.(selectedClip.id, { textX: finalPctX, textY: finalPctY });
      return;
    }

    if (isResizingText && selectedClip) {
      const bound = textBoundsRef.current[selectedClip.id];
      if (bound) {
        const dist = Math.hypot(coords.x - bound.centerX, coords.y - bound.centerY);
        const initDist = Math.hypot(dragStart.x - bound.centerX, dragStart.y - bound.centerY);
        const factor = dist / (initDist || 1);
        const newFontSize = Math.max(12, Math.min(160, Math.round(initialTextPos.fontSize * factor)));
        onUpdateClip?.(selectedClip.id, { fontSize: newFontSize });
        return;
      }
    }

    // Hover detection for dynamic mouse cursor feedback
    let hoverCursor: 'default' | 'pointer' | 'move' | 'nwse-resize' = 'default';
    if (groupBoundsRef.current && groupBoundsRef.current.clips.length > 1) {
      const gb = groupBoundsRef.current;
      const corners = [
        { x: gb.left - 8, y: gb.top - 8 },
        { x: gb.left + gb.width + 8, y: gb.top - 8 },
        { x: gb.left - 8, y: gb.top + gb.height + 8 },
        { x: gb.left + gb.width + 8, y: gb.top + gb.height + 8 },
      ];
      for (const c of corners) {
        if (Math.hypot(coords.x - c.x, coords.y - c.y) <= 18) {
          hoverCursor = 'nwse-resize';
          break;
        }
      }
      if (hoverCursor === 'default' && coords.x >= gb.left - 8 && coords.x <= gb.left + gb.width + 8 && coords.y >= gb.top - 8 && coords.y <= gb.top + gb.height + 8) {
        hoverCursor = 'move';
      }
    }

    if (hoverCursor === 'default' && selectedClip && selectedClip.type === ClipType.TEXT) {
      const bound = textBoundsRef.current[selectedClip.id];
      if (bound) {
        const corners = [
          { x: bound.left, y: bound.top },
          { x: bound.left + bound.width, y: bound.top },
          { x: bound.left, y: bound.top + bound.height },
          { x: bound.left + bound.width, y: bound.top + bound.height },
        ];
        for (const c of corners) {
          if (Math.hypot(coords.x - c.x, coords.y - c.y) <= 18) {
            hoverCursor = 'nwse-resize';
            break;
          }
        }
      }
    }

    if (hoverCursor === 'default') {
      for (const item of (Object.values(textBoundsRef.current) as TextBound[])) {
        if (
          coords.x >= item.left &&
          coords.x <= item.left + item.width &&
          coords.y >= item.top &&
          coords.y <= item.top + item.height
        ) {
          hoverCursor = 'move';
          break;
        }
      }
    }

    setActiveCursor(hoverCursor);
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingText(false);
    setIsResizingText(false);
    setIsDraggingGroup(false);
    setIsResizingGroup(false);
    initialGroupClipsPos.current = [];
    activeSnapRef.current = { x: null, y: null };
  };

  return (
    <div id="preview-player" ref={playerFrameRef} className="flex-1 bg-[#141418] rounded-lg border border-[#23232b] flex flex-col h-full select-none overflow-hidden shadow-sm">
      
      {/* Exact CapCut Player Header */}
      <div className="h-9 border-b border-[#24242c] px-3 flex items-center justify-between bg-[#1e1e24] shrink-0 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-200 text-xs tracking-wide">Player</span>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            id="btn-player-menu"
            onClick={() => setShowPlayerMenu(!showPlayerMenu)}
            className="p-1 rounded hover:bg-[#2c2c36] text-gray-400 hover:text-white transition cursor-pointer"
            title="Player Options"
          >
            <Menu className="w-4 h-4" />
          </button>

          {showPlayerMenu && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-[#1a1a20] border border-[#2a2a34] rounded-lg shadow-2xl p-1 z-50 text-xs text-gray-300">
              <button
                onClick={() => { setShowGrid(!showGrid); setShowPlayerMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between"
              >
                <span>Grid Guides</span>
                <span className="text-[10px] text-cyan-400">{showGrid ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => { setShowSafeArea(!showSafeArea); setShowPlayerMenu(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between"
              >
                <span>Safe Area Margin</span>
                <span className="text-[10px] text-amber-400">{showSafeArea ? 'ON' : 'OFF'}</span>
              </button>
              <div className="h-px bg-[#2a2a34] my-1" />
              <div className="px-2.5 py-1 text-[10px] text-gray-500 font-bold uppercase">Zoom Scale</div>
              {(['fit', 50, 75, 100] as const).map(z => (
                <button
                  key={z}
                  onClick={() => { setCanvasZoom(z); setShowPlayerMenu(false); }}
                  className={`w-full text-left px-2.5 py-1 rounded hover:bg-[#2a2a36] text-[11px] ${canvasZoom === z ? 'text-cyan-400 font-bold' : ''}`}
                >
                  {z === 'fit' ? 'Fit Screen' : `${z}% Zoom`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport Stage Canvas */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-3 relative min-h-0 bg-[#070709] overflow-hidden">
        <div
          className="relative rounded-sm shadow-2xl overflow-hidden bg-black flex items-center justify-center transition-all duration-300 border border-white/80 group"
          style={{
            width: canvasZoom === 'fit' ? (aspectRatio === '16:9' ? '100%' : 'auto') : `${canvasZoom}%`,
            height: canvasZoom === 'fit' ? (aspectRatio === '16:9' ? 'auto' : '100%') : `${canvasZoom}%`,
            maxWidth: `${dimensions.width}px`,
            maxHeight: `${dimensions.height}px`,
            aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '9:16' ? '9/16' : '1/1'
          }}
        >
          {/* White Corner Frame Handle Anchors */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-xs shadow-md z-30" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-xs shadow-md z-30" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white rounded-xs shadow-md z-30" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white rounded-xs shadow-md z-30" />

          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full object-contain block"
            style={{ cursor: activeCursor }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />



          {isExporting && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 border border-cyan-400/80 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 z-40 animate-pulse backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-xs font-mono font-extrabold text-cyan-300 tracking-wide whitespace-nowrap">
                Exporting Video Components to Local Storage (100% Full Done HD)...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CapCut Pro Player Transport Controls Bar */}
      <div className="h-11 border-t border-[#24242c] bg-[#1a1a20] px-3 flex items-center justify-between shrink-0 select-none text-xs text-gray-300">
        
        {/* Left: Timecode Scrubber & Audio VU Meter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-cyan-400 font-bold tracking-tight">{formatTimeCode(currentTime)}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{formatTimeCode(duration)}</span>
          </div>

          {/* Audio VU Level Meter Bars */}
          <div className="flex items-end gap-0.5 h-3.5 px-1 py-0.5 bg-[#121216] rounded border border-[#2a2a34]" title="Audio VU Meter">
            <div className={`w-1 bg-emerald-400 rounded-xs transition-all duration-75 ${isPlaying ? 'h-3 animate-pulse' : 'h-1.5 opacity-60'}`} />
            <div className={`w-1 bg-emerald-400 rounded-xs transition-all duration-75 ${isPlaying ? 'h-2.5 animate-pulse' : 'h-2 opacity-60'}`} />
            <div className={`w-1 bg-emerald-500 rounded-xs transition-all duration-75 ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1 opacity-60'}`} />
            <div className={`w-1 bg-emerald-400 rounded-xs transition-all duration-75 ${isPlaying ? 'h-2 animate-pulse' : 'h-1.5 opacity-60'}`} />
          </div>
        </div>

        {/* Center: Play / Pause */}
        <div className="flex items-center gap-2">
          <button
            id="btn-play-pause-main"
            onClick={onPlayPause}
            className="p-1.5 rounded hover:bg-[#2a2a36] text-gray-200 hover:text-white transition cursor-pointer"
            title="Play / Pause (Spacebar)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-gray-200" />
            ) : (
              <Play className="w-4 h-4 fill-current text-gray-200 ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Fit, Ratio & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Fit / Frame Search Tool */}
          <button
            onClick={() => setCanvasZoom('fit')}
            className="p-1 rounded hover:bg-[#2a2a36] text-gray-400 hover:text-white transition"
            title="Fit Canvas to Preview Area"
          >
            <Scan className="w-3.5 h-3.5" />
          </button>

          {/* Preview Quality Selector (4K / 2K / 1080p / 720p) */}
          <div className="relative">
            <button
              id="btn-preview-quality-toggle"
              onClick={() => { setShowQualityMenu(!showQualityMenu); setShowRatioMenu(false); }}
              className={`px-2 py-0.5 rounded border text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                previewQuality === '4K'
                  ? 'border-amber-500/50 text-amber-300 bg-amber-950/40 hover:bg-amber-900/50'
                  : previewQuality === '2K'
                  ? 'border-purple-500/50 text-purple-300 bg-purple-950/40 hover:bg-purple-900/50'
                  : 'border-[#3a3a48] hover:border-cyan-400 bg-[#22222c] hover:bg-[#2c2c38] text-gray-200'
              }`}
              title="Player View Quality (Canvas Resolution)"
            >
              <Sparkles className="w-3 h-3 text-current" />
              <span>{previewQuality}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute bottom-full right-0 mb-1 w-52 bg-[#1a1a20] border border-[#2a2a34] rounded-lg shadow-2xl p-1 z-50 text-xs text-gray-300 animate-in fade-in duration-150">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 mb-1 flex items-center justify-between">
                  <span>Player Resolution</span>
                  <span className="text-cyan-400 font-mono">{dimensions.width}×{dimensions.height}</span>
                </div>
                <button
                  onClick={() => { setPreviewQuality('4K'); setShowQualityMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between transition ${previewQuality === '4K' ? 'text-amber-300 font-bold bg-[#282218]' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-semibold">
                      4K Ultra HD 
                      <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono border border-amber-500/30">4K UHD</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {aspectRatio === '9:16' ? '2160 × 3840' : aspectRatio === '1:1' ? '2160 × 2160' : '3840 × 2160'}
                    </span>
                  </div>
                  {previewQuality === '4K' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <button
                  onClick={() => { setPreviewQuality('2K'); setShowQualityMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between transition ${previewQuality === '2K' ? 'text-purple-300 font-bold bg-[#241e2e]' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-semibold">
                      2K Quad HD 
                      <span className="text-[9px] px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded font-mono border border-purple-500/30">2K QHD</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {aspectRatio === '9:16' ? '1440 × 2560' : aspectRatio === '1:1' ? '1440 × 1440' : '2560 × 1440'}
                    </span>
                  </div>
                  {previewQuality === '2K' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
                <button
                  onClick={() => { setPreviewQuality('1080p'); setShowQualityMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between transition ${previewQuality === '1080p' ? 'text-cyan-400 font-bold bg-[#242430]' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-semibold">
                      1080p Full HD 
                      <span className="text-[9px] px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-mono border border-cyan-500/30">1080p</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {aspectRatio === '9:16' ? '1080 × 1920' : aspectRatio === '1:1' ? '1080 × 1080' : '1920 × 1080'}
                    </span>
                  </div>
                  {previewQuality === '1080p' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => { setPreviewQuality('720p'); setShowQualityMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between transition ${previewQuality === '720p' ? 'text-blue-400 font-bold bg-[#242430]' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-semibold">
                      720p HD 
                      <span className="text-[9px] px-1 py-0.2 bg-gray-700 text-gray-300 rounded font-mono">720p</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {aspectRatio === '9:16' ? '720 × 1280' : aspectRatio === '1:1' ? '720 × 720' : '1280 × 720'}
                    </span>
                  </div>
                  {previewQuality === '720p' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Aspect Ratio Button & Dropdown */}
          <div className="relative">
            <button
              id="btn-aspect-ratio-toggle"
              onClick={() => { setShowRatioMenu(!showRatioMenu); setShowQualityMenu(false); }}
              className="px-2 py-0.5 rounded border border-[#3a3a48] hover:border-cyan-400 bg-[#22222c] hover:bg-[#2c2c38] text-[11px] font-semibold text-gray-200 transition flex items-center gap-1 cursor-pointer"
              title="Aspect Ratio Options"
            >
              <span>Ratio</span>
            </button>

            {showRatioMenu && (
              <div className="absolute bottom-full right-0 mb-1 w-36 bg-[#1a1a20] border border-[#2a2a34] rounded-lg shadow-2xl p-1 z-50 text-xs text-gray-300">
                <button
                  onClick={() => { onSetAspectRatio('16:9'); setShowRatioMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between ${aspectRatio === '16:9' ? 'text-cyan-400 font-bold bg-[#242430]' : ''}`}
                >
                  <span>16:9 Landscape</span>
                  <Monitor className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { onSetAspectRatio('9:16'); setShowRatioMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between ${aspectRatio === '9:16' ? 'text-cyan-400 font-bold bg-[#242430]' : ''}`}
                >
                  <span>9:16 Portrait</span>
                  <Smartphone className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { onSetAspectRatio('1:1'); setShowRatioMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-[#2a2a36] flex items-center justify-between ${aspectRatio === '1:1' ? 'text-cyan-400 font-bold bg-[#242430]' : ''}`}
                >
                  <span>1:1 Square</span>
                  <Square className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-[#2a2a36] text-gray-400 hover:text-white transition"
            title="Toggle Player Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
