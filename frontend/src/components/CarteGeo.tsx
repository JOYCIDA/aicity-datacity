import MapView, { Marker } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { useTextes } from '../i18n';
import { cadre, PropsCarteGeo } from './CarteGeo.types';

// Version téléphone (Expo Go, appli installée) ; le navigateur utilise CarteGeo.web.tsx.
export default function CarteGeo({ position, activites, onOuvrir }: PropsCarteGeo) {
  const t = useTextes();
  const c = cadre({ position, activites });
  const region = {
    latitude: (c.latMin + c.latMax) / 2,
    longitude: (c.lngMin + c.lngMax) / 2,
    // Marge de 40 % autour des points, et pas plus zoomé qu'un quartier.
    latitudeDelta: Math.max((c.latMax - c.latMin) * 1.4, 0.01),
    longitudeDelta: Math.max((c.lngMax - c.lngMin) * 1.4, 0.01),
  };

  return (
    <View style={styles.conteneur} accessibilityLabel={t.carte.a11y}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region}>
        <Marker coordinate={position} title={t.carte.ici}>
          <View style={styles.ici} />
        </Marker>
        {activites.map((a, i) => (
          <Marker
            key={a.id}
            coordinate={{ latitude: a.lat, longitude: a.lng }}
            title={`${i + 1}. ${a.titre}`}
            description={a.lieu}
            onCalloutPress={() => onOuvrir(a)}
          >
            <View style={styles.pastille}>
              <Text style={styles.numero}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.muted },
  pastille: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.night,
    borderWidth: 3,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: { color: colors.cream, fontWeight: '700', fontSize: 16 },
  ici: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.teal,
    borderWidth: 4,
    borderColor: colors.cream,
  },
});
