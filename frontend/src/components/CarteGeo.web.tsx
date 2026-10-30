import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { useTextes } from '../i18n';
import { cadre, PropsCarteGeo } from './CarteGeo.types';

// Pastilles en HTML (pas d'image à charger) : numéro de l'activité, ou point « Vous êtes ici ».
function pastille(numero: number) {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="width:36px;height:36px;border-radius:18px;background:${colors.night};border:3px solid ${colors.teal};color:${colors.cream};font:700 16px 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center">${numero}</div>`,
  });
}

const ICI = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="width:22px;height:22px;border-radius:11px;background:${colors.teal};border:4px solid ${colors.cream};box-shadow:0 0 0 2px ${colors.night}"></div>`,
});

export default function CarteGeo({ position, activites, onOuvrir }: PropsCarteGeo) {
  const t = useTextes();
  const c = cadre({ position, activites });

  return (
    <View style={styles.conteneur} accessibilityLabel={t.carte.a11y}>
      <MapContainer
        bounds={[
          [c.latMin, c.lngMin],
          [c.latMax, c.lngMax],
        ]}
        boundsOptions={{ padding: [48, 48], maxZoom: 16 }}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.latitude, position.longitude]} icon={ICI} keyboard={false}>
          <Tooltip permanent direction="top" offset={[0, -12]}>
            {t.carte.ici}
          </Tooltip>
        </Marker>
        {activites.map((a, i) => (
          <Marker
            key={a.id}
            position={[a.lat, a.lng]}
            icon={pastille(i + 1)}
            title={`${i + 1}. ${a.titre}`}
            alt={`${i + 1}. ${a.titre}`}
            eventHandlers={{ click: () => onOuvrir(a) }}
          >
            <Tooltip direction="top" offset={[0, -18]}>
              {`${i + 1}. ${a.titre}`}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex 0 : les calques de Leaflet restent sous la barre du haut.
  conteneur: { flex: 1, zIndex: 0, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.muted },
});
