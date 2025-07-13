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

  // デバッグ用ログ
  console.log('CalendarSwipeGesture rendered with settings:', { direction, sensitivity });
  console.log('Gesture handler will be recreated with threshold:', threshold);

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

  // Web環境対応
  if (Platform.OS === 'web') {
    const handleStart = (e: any, clientX: number, clientY: number) => {
      e.currentTarget.startX = clientX;
      e.currentTarget.startY = clientY;
    };

    const handleEnd = (e: any, clientX: number, clientY: number) => {
      if (!e.currentTarget.startX || !e.currentTarget.startY) return;
      
      const diffX = e.currentTarget.startX - clientX;
      const diffY = e.currentTarget.startY - clientY;
      
      processSwipe(diffX, diffY);
    };

    const handleTouchStart = (e: any) => {
      handleStart(e, e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = (e: any) => {
      handleEnd(e, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const handleMouseDown = (e: any) => {
      handleStart(e, e.clientX, e.clientY);
    };

    const handleMouseUp = (e: any) => {
      handleEnd(e, e.clientX, e.clientY);
    };

    const processSwipe = (diffX: number, diffY: number) => {
      console.log('Processing swipe:', { diffX, diffY, direction, threshold });
      
      if (direction === 'horizontal') {
        if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
          console.log('Horizontal swipe triggered:', diffX > 0 ? 'left' : 'right');
          if (diffX > 0) {
            onSwipeLeft();
          } else {
            onSwipeRight();
          }
        }
      } else {
        if (Math.abs(diffY) > threshold && Math.abs(diffY) > Math.abs(diffX)) {
          console.log('Vertical swipe triggered:', diffY > 0 ? 'up' : 'down');
          if (diffY > 0) {
            onSwipeUp && onSwipeUp();
          } else {
            onSwipeDown && onSwipeDown();
          }
        }
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