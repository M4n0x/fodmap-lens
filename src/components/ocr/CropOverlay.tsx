import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  PanResponder,
  Pressable,
  Dimensions,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type LayoutChangeEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '@/src/theme/design';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CropOverlayProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (crop: { originX: number; originY: number; width: number; height: number }) => void;
  onRetake: () => void;
  scanLabel: string;
  retakeLabel: string;
}

const HANDLE_SIZE = 28;
const HANDLE_HIT = 48;
const MIN_CROP = 60;

// Match camera scan area from ocr-scan.tsx
const CAMERA_SCAN_W = 320;
const CAMERA_SCAN_H = 220;

type DragTarget = 'tl' | 'tr' | 'bl' | 'br' | 'move' | null;

export function CropOverlay({
  imageUri,
  imageWidth,
  imageHeight,
  onConfirm,
  onRetake,
  scanLabel,
  retakeLabel,
}: CropOverlayProps) {
  const [crop, setCrop] = useState<CropRect | null>(null);
  const cropRef = useRef<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const containerRef = useRef({ w: 0, h: 0 });
  const dragTarget = useRef<DragTarget>(null);
  const dragStart = useRef({ x: 0, y: 0, crop: { x: 0, y: 0, w: 0, h: 0 } });
  const initializedRef = useRef(false);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    containerRef.current = { w: width, h: height };

    // Only set initial crop once
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Match camera scan area proportions
    const screenW = Dimensions.get('window').width;
    const screenH = Dimensions.get('window').height;
    // Camera overlay: flex 1 top, 220px middle, flex 1.2 bottom
    const topFlex = (screenH - CAMERA_SCAN_H) * (1 / 2.2);
    const wRatio = CAMERA_SCAN_W / screenW;
    const hRatio = CAMERA_SCAN_H / screenH;
    const yRatio = topFlex / screenH;

    const initial: CropRect = {
      x: ((1 - wRatio) / 2) * width,
      y: yRatio * height,
      w: wRatio * width,
      h: hRatio * height,
    };
    setCrop(initial);
    cropRef.current = initial;
  }, []);

  const hitTest = (px: number, py: number): DragTarget => {
    const c = cropRef.current;
    const r = HANDLE_HIT / 2;

    if (Math.abs(px - c.x) < r && Math.abs(py - c.y) < r) return 'tl';
    if (Math.abs(px - (c.x + c.w)) < r && Math.abs(py - c.y) < r) return 'tr';
    if (Math.abs(px - c.x) < r && Math.abs(py - (c.y + c.h)) < r) return 'bl';
    if (Math.abs(px - (c.x + c.w)) < r && Math.abs(py - (c.y + c.h)) < r) return 'br';

    if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) return 'move';
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        // Children have pointerEvents="none", so locationX/locationY
        // is always relative to the PanResponder view
        const { locationX, locationY } = e.nativeEvent;
        dragTarget.current = hitTest(locationX, locationY);
        dragStart.current = {
          x: locationX,
          y: locationY,
          crop: { ...cropRef.current },
        };
      },
      onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        const target = dragTarget.current;
        if (!target) return;

        const { crop: start } = dragStart.current;
        const dx = gs.dx;
        const dy = gs.dy;
        // Read from ref — not stale closure
        const maxW = containerRef.current.w;
        const maxH = containerRef.current.h;
        if (maxW === 0 || maxH === 0) return;

        let next: CropRect;

        switch (target) {
          case 'move': {
            let nx = start.x + dx;
            let ny = start.y + dy;
            nx = Math.max(0, Math.min(nx, maxW - start.w));
            ny = Math.max(0, Math.min(ny, maxH - start.h));
            next = { x: nx, y: ny, w: start.w, h: start.h };
            break;
          }
          case 'tl': {
            let nx = start.x + dx;
            let ny = start.y + dy;
            let nw = start.w - dx;
            let nh = start.h - dy;
            if (nw < MIN_CROP) { nx = start.x + start.w - MIN_CROP; nw = MIN_CROP; }
            if (nh < MIN_CROP) { ny = start.y + start.h - MIN_CROP; nh = MIN_CROP; }
            nx = Math.max(0, nx);
            ny = Math.max(0, ny);
            nw = Math.min(nw, start.x + start.w);
            nh = Math.min(nh, start.y + start.h);
            next = { x: nx, y: ny, w: nw, h: nh };
            break;
          }
          case 'tr': {
            let nw = start.w + dx;
            let ny = start.y + dy;
            let nh = start.h - dy;
            if (nw < MIN_CROP) nw = MIN_CROP;
            if (nh < MIN_CROP) { ny = start.y + start.h - MIN_CROP; nh = MIN_CROP; }
            ny = Math.max(0, ny);
            nw = Math.min(nw, maxW - start.x);
            nh = Math.min(nh, start.y + start.h);
            next = { x: start.x, y: ny, w: nw, h: nh };
            break;
          }
          case 'bl': {
            let nx = start.x + dx;
            let nw = start.w - dx;
            let nh = start.h + dy;
            if (nw < MIN_CROP) { nx = start.x + start.w - MIN_CROP; nw = MIN_CROP; }
            if (nh < MIN_CROP) nh = MIN_CROP;
            nx = Math.max(0, nx);
            nw = Math.min(nw, start.x + start.w);
            nh = Math.min(nh, maxH - start.y);
            next = { x: nx, y: start.y, w: nw, h: nh };
            break;
          }
          case 'br': {
            let nw = start.w + dx;
            let nh = start.h + dy;
            if (nw < MIN_CROP) nw = MIN_CROP;
            if (nh < MIN_CROP) nh = MIN_CROP;
            nw = Math.min(nw, maxW - start.x);
            nh = Math.min(nh, maxH - start.y);
            next = { x: start.x, y: start.y, w: nw, h: nh };
            break;
          }
          default:
            return;
        }

        cropRef.current = next;
        setCrop({ ...next });
      },
      onPanResponderRelease: () => {
        dragTarget.current = null;
      },
    })
  ).current;

  const handleConfirm = () => {
    const ctr = containerRef.current;
    if (!crop || ctr.w === 0) return;

    // Convert display coordinates to image coordinates
    const scaleX = imageWidth / ctr.w;
    const scaleY = imageHeight / ctr.h;

    onConfirm({
      originX: Math.round(crop.x * scaleX),
      originY: Math.round(crop.y * scaleY),
      width: Math.round(crop.w * scaleX),
      height: Math.round(crop.h * scaleY),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageWrap} onLayout={onContainerLayout}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="stretch" />

        {crop && (
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            {/* Dim overlay — 4 rectangles around the crop */}
            <View pointerEvents="none" style={[styles.dim, { top: 0, left: 0, right: 0, height: crop.y }]} />
            <View pointerEvents="none" style={[styles.dim, { top: crop.y, left: 0, width: crop.x, height: crop.h }]} />
            <View pointerEvents="none" style={[styles.dim, { top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h }]} />
            <View pointerEvents="none" style={[styles.dim, { top: crop.y + crop.h, left: 0, right: 0, bottom: 0 }]} />

            {/* Crop border */}
            <View
              pointerEvents="none"
              style={[
                styles.cropBorder,
                { left: crop.x, top: crop.y, width: crop.w, height: crop.h },
              ]}
            />

            {/* Corner handles — pointerEvents none so they don't steal touches */}
            <View pointerEvents="none" style={[styles.handle, { left: crop.x - HANDLE_SIZE / 2, top: crop.y - HANDLE_SIZE / 2 }]} />
            <View pointerEvents="none" style={[styles.handle, { left: crop.x + crop.w - HANDLE_SIZE / 2, top: crop.y - HANDLE_SIZE / 2 }]} />
            <View pointerEvents="none" style={[styles.handle, { left: crop.x - HANDLE_SIZE / 2, top: crop.y + crop.h - HANDLE_SIZE / 2 }]} />
            <View pointerEvents="none" style={[styles.handle, { left: crop.x + crop.w - HANDLE_SIZE / 2, top: crop.y + crop.h - HANDLE_SIZE / 2 }]} />
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.retakeBtn} onPress={onRetake}>
          <MaterialCommunityIcons name="camera-retake" size={20} color={colors.sage} />
          <Text style={styles.retakeBtnText}>{retakeLabel}</Text>
        </Pressable>
        <Pressable style={styles.scanBtn} onPress={handleConfirm}>
          <MaterialCommunityIcons name="text-recognition" size={20} color={colors.textOnDark} />
          <Text style={styles.scanBtnText}>{scanLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  imageWrap: {
    flex: 1,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cropBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.sage,
    borderRadius: 2,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.sage,
    borderWidth: 3,
    borderColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: '#111',
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
  retakeBtnText: {
    ...typography.titleMedium,
    color: colors.sage,
    flexShrink: 1,
  },
  scanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.sage,
  },
  scanBtnText: {
    ...typography.titleMedium,
    color: colors.textOnDark,
    flexShrink: 1,
  },
});
