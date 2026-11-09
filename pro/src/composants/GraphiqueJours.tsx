import { useEffect, useRef, useState } from 'react';

export type PointJour = { jour: string; valeur: number }; // jour : « 2026-11-09 »

const HAUTEUR = 200;
const MARGE_GAUCHE = 40;
const MARGE_BAS = 28;

const jourCourt = (jour: string) => {
  const [, mois, j] = jour.split('-');
  return `${j}/${mois}`;
};

// Graduations rondes : 0, la moitié et le maximum arrondi vers le haut.
function graduations(max: number) {
  if (max <= 0) return [0, 1];
  const pas = 10 ** Math.floor(Math.log10(max));
  const haut = Math.ceil(max / pas) * pas;
  return haut % 2 === 0 || haut <= 1 ? [0, haut / 2, haut] : [0, haut];
}

// Une série par jour (barres verticales), avec info-bulle au survol et tableau de données.
// Largeur réelle du conteneur : le SVG est dessiné à sa taille (1 unité = 1 px), le texte ne grossit pas.
function useLargeur() {
  const ref = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(720);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => setLargeur(Math.max(280, Math.round(entree!.contentRect.width))));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);
  return [ref, largeur] as const;
}

export function GraphiqueJours({ titre, points, unite }: { titre: string; points: PointJour[]; unite: string }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const [zone, LARGEUR] = useLargeur();
  const ticks = graduations(Math.max(...points.map((p) => p.valeur), 0));
  const max = ticks[ticks.length - 1]!;
  const largeurUtile = LARGEUR - MARGE_GAUCHE;
  const pasX = largeurUtile / Math.max(points.length, 1);
  const epaisseur = Math.min(24, Math.max(2, pasX - 2)); // barres fines, 2 px d'écart au minimum
  const y = (v: number) => HAUTEUR - MARGE_BAS - (v / max) * (HAUTEUR - MARGE_BAS - 8);
  const total = points.reduce((s, p) => s + p.valeur, 0);
  // Quelques dates seulement sous l'axe : la première, celle du milieu et la dernière.
  const etiquettes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  const point = survol === null ? null : points[survol];

  return (
    <figure className="graphique">
      <figcaption className="graphique-entete">
        <span className="t-sous-titre">{titre}</span>
        <span className="t-legende secondaire chiffres">
          {total.toLocaleString('fr-FR')}&nbsp;{unite} sur la période
        </span>
      </figcaption>

      <div ref={zone} className="graphique-zone" onMouseLeave={() => setSurvol(null)}>
        <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} role="img" aria-label={`${titre} : ${total} ${unite} sur ${points.length} jours. Détail dans le tableau ci-dessous.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGE_GAUCHE} x2={LARGEUR} y1={y(t)} y2={y(t)} className="graphique-grille" />
              <text x={MARGE_GAUCHE - 8} y={y(t) + 4} textAnchor="end" className="graphique-texte">
                {t.toLocaleString('fr-FR')}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const x = MARGE_GAUCHE + i * pasX + (pasX - epaisseur) / 2;
            const haut = y(p.valeur);
            const h = HAUTEUR - MARGE_BAS - haut;
            const r = Math.min(4, h, epaisseur / 2);
            return (
              <g key={p.jour} onMouseEnter={() => setSurvol(i)}>
                {/* zone de survol plus large que la barre */}
                <rect x={MARGE_GAUCHE + i * pasX} y={0} width={pasX} height={HAUTEUR - MARGE_BAS} fill="transparent" />
                {h > 0 && (
                  <path
                    className={`graphique-barre${survol === i ? ' graphique-barre-active' : ''}`}
                    // bout arrondi de 4 px, base carrée sur l'axe
                    d={`M${x},${HAUTEUR - MARGE_BAS} V${haut + r} Q${x},${haut} ${x + r},${haut} H${x + epaisseur - r} Q${x + epaisseur},${haut} ${x + epaisseur},${haut + r} V${HAUTEUR - MARGE_BAS} Z`}
                  />
                )}
                {etiquettes.has(i) && (
                  <text
                    x={MARGE_GAUCHE + i * pasX + pasX / 2}
                    y={HAUTEUR - 8}
                    textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                    className="graphique-texte"
                  >
                    {jourCourt(p.jour)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={MARGE_GAUCHE} x2={LARGEUR} y1={HAUTEUR - MARGE_BAS} y2={HAUTEUR - MARGE_BAS} className="graphique-axe" />
        </svg>
        {point && survol !== null && (
          <div
            className="graphique-bulle"
            style={{ left: `${((MARGE_GAUCHE + survol * pasX + pasX / 2) / LARGEUR) * 100}%` }}
            aria-hidden="true"
          >
            <span className="t-legende secondaire">{new Date(`${point.jour}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span className="t-corps-fort chiffres">
              {point.valeur.toLocaleString('fr-FR')}&nbsp;{unite}
            </span>
          </div>
        )}
      </div>

      <details className="graphique-tableau">
        <summary className="t-legende">Voir les données en tableau</summary>
        <table className="tableau tableau-simple">
          <caption className="lecteur-ecran">{titre}, jour par jour</caption>
          <thead>
            <tr>
              <th scope="col">Jour</th>
              <th scope="col">{unite.charAt(0).toUpperCase() + unite.slice(1)}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.jour}>
                <td className="chiffres">{new Date(`${p.jour}T12:00:00`).toLocaleDateString('fr-FR')}</td>
                <td className="chiffres">{p.valeur.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
