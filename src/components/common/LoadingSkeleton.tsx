import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/spacing';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width: w = '100%', 
  height = 20, 
  borderRadius: br = 4,
  style 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: w,
          height,
          borderRadius: br,
          backgroundColor: colors.gray300,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton para tarjeta de cancha horizontal
export const CanchaCardSkeleton: React.FC = () => {
  return (
    <View style={styles.canchaCard}>
      <Skeleton width={100} height={100} borderRadius={12} style={styles.canchaImage} />
      <View style={styles.canchaInfo}>
        <Skeleton width="70%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.features}>
          <Skeleton width={80} height={14} borderRadius={8} style={{ marginRight: 8 }} />
          <Skeleton width={80} height={14} borderRadius={8} />
        </View>
        <Skeleton width="100%" height={36} borderRadius={8} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
};

// Skeleton para lista de reservas
export const ReservaCardSkeleton: React.FC = () => {
  return (
    <View style={styles.reservaCard}>
      <View style={styles.reservaHeader}>
        <Skeleton width={60} height={60} borderRadius={8} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
        <Skeleton width={80} height={28} borderRadius={14} />
      </View>
      <View style={styles.reservaDetails}>
        <Skeleton width="30%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={14} borderRadius={4} />
      </View>
    </View>
  );
};

// Loading para pantalla completa
export const LoadingScreen: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.loadingContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <CanchaCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.md,
  },
  canchaCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canchaImage: {
    marginRight: spacing.md,
  },
  canchaInfo: {
    flex: 1,
  },
  features: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reservaCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reservaDetails: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
