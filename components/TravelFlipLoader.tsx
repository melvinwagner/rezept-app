import { useEffect, useRef, useState } from "react";
import {
  View,
  Animated,
  Easing,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { fonts, colors } from "../constants/theme";

/**
 * Loading-Animation: Dackel flipt von links nach rechts über einem Status-Text.
 * Der Hund liegt auf einer eigenen Ebene (zIndex 10) und springt damit auch
 * über den Text. Hintergrund transparent — zeigt den darunter liegenden Container.
 */
export function TravelFlipLoader({
  label = "Rezept wird generiert",
  height = 60,
}: {
  label?: string;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const DURATION = 2800;
    // Hin-und-her statt nur nach rechts raus
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: 0,
          duration: DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, {
          toValue: 1,
          duration: DURATION / 2,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration: DURATION / 2,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: DURATION,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, [x, y, rot]);

  const DOG_W = 44;
  const DOG_H = 34;
  const maxX = Math.max(0, width - DOG_W);

  const translateX = x.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxX],
  });
  const translateY = y.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -36],
  });
  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.root, { height }]} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      <Animated.Image
        source={require("../assets/dawg-logo.png")}
        resizeMode="contain"
        style={[
          styles.dog,
          { width: DOG_W, height: DOG_H },
          { transform: [{ translateX }, { translateY }, { rotate }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  label: {
    fontFamily: fonts.eyebrowCaps,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.inkMuted,
    textTransform: "uppercase",
    textAlign: "center",
  },
  dog: {
    position: "absolute",
    bottom: 6,
    left: 0,
    tintColor: colors.accentInk,
    zIndex: 10,
  },
});
