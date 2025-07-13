// カレンダースワイプ操作コンポーネント

import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useCouple } from '../contexts/CoupleContext';
import { SwipeDirection } from '../types/coupleTypes';

const { width: screenWidth } = Dimensions.get('window');

interface CalendarSwipeGestureProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export default function CalendarSwipeGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: CalendarSwipeGestureProps) {
  const { settings } = useCouple();
  const { direction, sensitivity } = settings.swipeSettings;
  
  // モバイルWeb判定
  const isMobileWeb = Platform.OS === 'web' && screenWidth < 768;

  // デバッグ用ログ
  console.log('CalendarSwipeGesture rendered with settings:', { direction, sensitivity });
  console.log('Is mobile web:', isMobileWeb);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // 感度設定から閾値を計算
  const threshold = useMemo(() => {
    const baseThreshold = screenWidth * 0.25; // 画面幅の25%
    const sensitivityFactor = (6 - sensitivity) * 10;
    return Math.max(50, baseThreshold - sensitivityFactor);
  }, [sensitivity]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (direction === 'horizontal') {
        translateX.value = context.startX + event.translationX * 0.3; // 軽微な追従
      } else {
        translateY.value = context.startY + event.translationY * 0.3;
      }
    },
    onEnd: (event) => {
      let shouldTriggerSwipe = false;

      if (direction === 'horizontal') {
        const distance = Math.abs(event.translationX);
        const velocity = Math.abs(event.velocityX);
        
        if (distance > threshold || velocity > 800) {
          shouldTriggerSwipe = true;
          if (event.translationX > 0) {
            runOnJS(onSwipeRight)();
          } else {
            runOnJS(onSwipeLeft)();
          }
        }
      } else {
        const distance = Math.abs(event.translationY);
        const velocity = Math.abs(event.velocityY);
        
        if (distance > threshold || velocity > 800) {
          shouldTriggerSwipe = true;
          if (event.translationY > 0) {
            runOnJS(onSwipeDown)();
          } else {
            runOnJS(onSwipeUp)();
          }
        }
      }

      // 元の位置に戻す
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    },
  }, [direction, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  // Web環境対応（モバイルWeb対応改善）
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // モバイルWebの場合は簡素化されたジェスチャー処理
  if (Platform.OS === 'web') {
    const handleStart = (clientX: number, clientY: number) => {
      startPosRef.current = { x: clientX, y: clientY };
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (!startPosRef.current) return;
      
      const diffX = startPosRef.current.x - clientX;
      const diffY = startPosRef.current.y - clientY;
      
      processSwipe(diffX, diffY);
      startPosRef.current = null;
    };

    const handleTouchStart = (e: any) => {
      e.preventDefault(); // スクロール防止
      if (e.touches && e.touches[0]) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: any) => {
      e.preventDefault();
      if (e.changedTouches && e.changedTouches[0]) {
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    const handleMouseDown = (e: any) => {
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: any) => {
      handleEnd(e.clientX, e.clientY);
    };

    const processSwipe = (diffX: number, diffY: number) => {
      console.log('Processing swipe:', { diffX, diffY, direction, threshold, isMobileWeb });
      
      // モバイルWebでは閾値を小さくして反応を良くする
      const effectiveThreshold = isMobileWeb ? Math.min(threshold, 50) : threshold;
      
      try {
        if (direction === 'horizontal') {
          if (Math.abs(diffX) > effectiveThreshold && Math.abs(diffX) > Math.abs(diffY)) {
            console.log('Horizontal swipe triggered:', diffX > 0 ? 'left' : 'right');
            if (diffX > 0) {
              onSwipeLeft();
            } else {
              onSwipeRight();
            }
          }
        } else {
          if (Math.abs(diffY) > effectiveThreshold && Math.abs(diffY) > Math.abs(diffX)) {
            console.log('Vertical swipe triggered:', diffY > 0 ? 'up' : 'down');
            if (diffY > 0) {
              onSwipeUp && onSwipeUp();
            } else {
              onSwipeDown && onSwipeDown();
            }
          }
        }
      } catch (error) {
        console.error('Swipe processing error:', error);
      }
    };

    return (
      <View style={styles.container}>
        <View 
          style={styles.gestureArea}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {children}
        </View>
      </View>
    );
  }

  // モバイルWebの場合は、React Native Gestureを使わない
  if (isMobileWeb) {
    return (
      <View style={styles.container}>
        <View 
          style={styles.gestureArea}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.gestureArea, animatedStyle]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
});