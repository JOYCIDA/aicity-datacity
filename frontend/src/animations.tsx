// Animations discrètes (200 à 300 ms), coupées si l'utilisateur a demandé moins d'animations.
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

const NATIF = Platform.OS !== 'web';

export function useMoinsAnimations(): boolean {
  const [moins, setMoins] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setMoins).catch(() => {});
    const abonnement = AccessibilityInfo.addEventListener('reduceMotionChanged', setMoins);
    return () => abonnement.remove();
  }, []);
  return moins;
}

type PropsApparition = {
  children: ReactNode;
  delai?: number; // ms, pour faire apparaître une liste en cascade
  style?: StyleProp<ViewStyle>;
};

// Fondu + léger glissement vers le haut à l'arrivée d'un écran ou d'un élément.
export function Apparition({ children, delai = 0, style }: PropsApparition) {
  const moins = useMoinsAnimations();
  const progres = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progres, {
      toValue: 1,
      duration: moins ? 0 : 260,
      delay: moins ? 0 : delai,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIF,
    });
    animation.start();
    return () => animation.stop();
  }, [progres, delai, moins]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progres,
          transform: [{ translateY: progres.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Bloc gris qui « respire » pendant un chargement, à la place d'un simple rond qui tourne.
export function Squelette({ style }: { style?: StyleProp<ViewStyle> }) {
  const moins = useMoinsAnimations();
  const opacite = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (moins) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacite, { toValue: 0.85, duration: 700, useNativeDriver: NATIF }),
        Animated.timing(opacite, { toValue: 0.45, duration: 700, useNativeDriver: NATIF }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [opacite, moins]);

  return (
    <Animated.View style={[{ backgroundColor: 'rgba(90, 143, 160, 0.35)', borderRadius: 12 }, style, { opacity: opacite }]}>
      <View />
    </Animated.View>
  );
}

// Petite vibration sur téléphone (rien sur le web) : confirme un choix sans le regarder.
export function vibrer(type: 'choix' | 'action' = 'choix') {
  if (!NATIF) return;
  const promesse = type === 'choix' ? Haptics.selectionAsync() : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  promesse.catch(() => {});
}
