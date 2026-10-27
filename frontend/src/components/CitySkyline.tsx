import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '../theme/tokens';

// [x, y, width, height] des immeubles, sur un viewBox de 1440x80.
const buildings = [
  [0, 40, 80, 40], [90, 20, 60, 60], [160, 10, 80, 70], [250, 30, 50, 50],
  [310, 0, 70, 80], [390, 25, 55, 55], [455, 15, 90, 65], [555, 35, 60, 45],
  [625, 5, 75, 75], [710, 20, 50, 60], [770, 30, 80, 50], [860, 10, 65, 70],
  [935, 25, 55, 55], [1000, 0, 70, 80], [1080, 20, 60, 60], [1150, 35, 80, 45],
  [1240, 15, 55, 65], [1305, 30, 70, 50], [1385, 10, 55, 70],
];

export default function CitySkyline() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg viewBox="0 0 1440 80" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
        {buildings.map(([x, y, width, height]) => (
          <Rect key={x} x={x} y={y} width={width} height={height} rx={4} fill={colors.teal} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 80,
    opacity: 0.1,
    overflow: 'hidden',
  },
});
