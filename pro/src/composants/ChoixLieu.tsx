import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';

export type Position = { latitude: number; longitude: number };
type Suggestion = { libelle: string; position: Position };

// Géocodage par la Base Adresse Nationale (IGN, service public gratuit, sans clé).
async function chercherAdresse(texte: string): Promise<Suggestion[]> {
  const reponse = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(texte)}&limit=5`);
  if (!reponse.ok) throw new Error('géocodage indisponible');
  const donnees = (await reponse.json()) as {
    features: { properties: { label: string }; geometry: { coordinates: [number, number] } }[];
  };
  return donnees.features.map((f) => ({
    libelle: f.properties.label,
    position: { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] },
  }));
}

// Repère aux couleurs AiCity (le marqueur par défaut de Leaflet dépend d'images externes).
const REPERE = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#082B38;border:3px solid #fff;box-shadow:0 1px 4px rgba(8,43,56,.4)"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function Recentrer({ position }: { position: Position }) {
  const carte = useMap();
  useEffect(() => {
    carte.setView([position.latitude, position.longitude], Math.max(carte.getZoom(), 16));
  }, [carte, position]);
  return null;
}

// Carte en lecture seule (page de détail d'une offre).
export function CartePosition({ position, libelle }: { position: Position; libelle: string }) {
  return (
    <div className="carte-lieu" role="img" aria-label={libelle}>
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={16}
        scrollWheelZoom={false}
        keyboard={false}
        style={{ height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.latitude, position.longitude]} icon={REPERE} keyboard={false} />
      </MapContainer>
    </div>
  );
}

type Props = {
  adresse: string;
  position: Position | null;
  onPosition: (p: Position, adresseTrouvee?: string) => void;
  erreur?: string;
};

// Recherche d'adresse → suggestions → repère déplaçable pour affiner.
export function ChoixLieu({ adresse, position, onPosition, erreur }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [probleme, setProbleme] = useState<string | null>(null);

  const localiser = async () => {
    setProbleme(null);
    setSuggestions(null);
    if (adresse.trim().length < 5) {
      setProbleme('Saisissez d’abord l’adresse (au moins 5 caractères).');
      return;
    }
    setEnCours(true);
    try {
      const trouvees = await chercherAdresse(adresse.trim());
      if (trouvees.length === 0) setProbleme('Adresse introuvable. Vérifiez-la ou placez le repère sur la carte.');
      else if (trouvees.length === 1) onPosition(trouvees[0]!.position, trouvees[0]!.libelle);
      else setSuggestions(trouvees);
    } catch {
      setProbleme('La recherche d’adresse ne répond pas. Réessayez dans un instant.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="champ">
      <span className="champ-libelle" id="libelle-position">
        Position sur la carte
        <span className="obligatoire" aria-hidden="true">
          *
        </span>
      </span>
      <p className="champ-aide">
        Une position précise place votre offre au bon endroit dans les recommandations, à la bonne distance à pied.
      </p>
      <button type="button" className="bouton bouton-secondaire" onClick={localiser} disabled={enCours} aria-busy={enCours}>
        <Search size={18} aria-hidden="true" />
        {enCours ? 'Recherche…' : 'Localiser l’adresse'}
      </button>

      {suggestions && (
        <fieldset className="suggestions-adresse">
          <legend className="t-corps-fort">Plusieurs adresses correspondent : choisissez la bonne.</legend>
          {suggestions.map((s) => (
            <button
              key={s.libelle}
              type="button"
              className="suggestion-adresse"
              onClick={() => {
                onPosition(s.position, s.libelle);
                setSuggestions(null);
              }}
            >
              <MapPin size={16} aria-hidden="true" />
              {s.libelle}
            </button>
          ))}
        </fieldset>
      )}

      {position && (
        <>
          <div className="carte-lieu" aria-labelledby="libelle-position">
            <MapContainer center={[position.latitude, position.longitude]} zoom={16} scrollWheelZoom={false} style={{ height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Recentrer position={position} />
              <Marker
                position={[position.latitude, position.longitude]}
                icon={REPERE}
                draggable
                keyboard={false}
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = (e.target as L.Marker).getLatLng();
                    onPosition({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
                  },
                }}
              />
            </MapContainer>
          </div>
          <p className="champ-aide chiffres">
            Faites glisser le repère pour affiner. Position retenue : {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          </p>
        </>
      )}

      {(probleme || erreur) && (
        <p className="champ-erreur" role="alert">
          {probleme ?? erreur}
        </p>
      )}
    </div>
  );
}
