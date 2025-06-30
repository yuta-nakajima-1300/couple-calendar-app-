// カレンダースワイプ操作コンポーネント

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useCouple } from '../contexts/CoupleContext';
import { SwipeDirection } from '../types/coupleTypes';

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

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Web環境では簡易的なタッチハンドリングに切り替え
  if (Platform.OS === 'web') {
    const handleTouchStart = (e: any) => {
      e.currentTarget.touchStartX = e.touches[0].clientX;
      e.currentTarget.touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: any) => {
      if (!e.currentTarget.touchStartX || !e.currentTarget.touchStartY) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = e.currentTarget.touchStartX - touchEndX;
      const diffY = e.currentTarget.touchStartY - touchEndY;
      
      const threshold = 50; // 固定閾値
      
      if (direction === 'horizontal') {
        if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) {
            onSwipeLeft();
          } else {
            onSwipeRight();
          }
        }
      } else {
        if (Math.abs(diffY) > threshold && Math.abs(diffY) > Math.abs(diffX)) {
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
        >
          {children}
        </View>
      </View>
    );
  }

  // 感度設定から閾値を計算 (1-5の設定を50-150ピクセルに変換)
  const threshold = useMemo(() => {
    const baseThreshold = 100;
    const sensitivityFactor = (6 - sensitivity) * 20; // 感度が高いほど閾値が低い
    return baseThreshold - sensitivityFactor;
  }, [sensitivity]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (direction === 'horizontal') {
        translateX.value = context.startX + event.translationX;
        // 垂直方向の移動を制限
        if (Math.abs(event.translationY) < Math.abs(event.translationX) * 0.5) {
          translateY.value = context.startY;
        }
      } else {
        translateY.value = context.startY + event.translationY;
        // 水平方向の移動を制限
        if (Math.abs(event.translationX) < Math.abs(event.translationY) * 0.5) {
          translateX.value = context.startX;
        }
      }
    },
    onEnd: (event) => {
      let shouldTriggerSwipe = false;
      let swipeAction: (() => void) | undefined;

      if (direction === 'horizontal') {
        const horizontalDistance = Math.abs(event.translationX);
        const verticalDistance = Math.abs(event.translationY);
        
        // 水平方向のスワイプが垂直方向より優位で、閾値を超えた場合
        if (horizontalDistance > threshold && horizontalDistance > verticalDistance * 1.5) {
          shouldTriggerSwipe = true;
          if (event.translationX > 0) {
            swipeAction = onSwipeRight; // 右スワイプ（前月）
          } else {
            swipeAction = onSwipeLeft; // 左スワイプ（次月）
          }
        }
      } else {
        const horizontalDistance = Math.abs(event.translationX);
        const verticalDistance = Math.abs(event.translationY);
        
        // 垂直方向のスワイプが水平方向より優位で、閾値を超えた場合
        if (verticalDistance > threshold && verticalDistance > horizontalDistance * 1.5) {
          shouldTriggerSwipe = true;
          if (event.translationY > 0) {
            swipeAction = onSwipeDown; // 下スワイプ（前月）
          } else {
            swipeAction = onSwipeUp; // 上スワイプ（次月）
          }
        }
      }

      // アニメーションで元の位置に戻す
      const springConfig = {
        damping: 15,
        stiffness: 150,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
      };
      
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);

      // スワイプアクションを実行
      if (shouldTriggerSwipe && swipeAction) {
        runOnJS(swipeAction)();
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value * 0.1 }, // 軽微な視覚フィードバック
        { translateY: translateY.value * 0.1 },
      ],
    };
  });

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