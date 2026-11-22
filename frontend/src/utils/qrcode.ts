// Générateur de QR code minimal (norme ISO/IEC 18004), sans dépendance.
// Mode octet, correction d'erreur M (~15 %), versions 1 à 10 : jusqu'à 213 octets,
// assez pour un lien d'itinéraire. Renvoie une grille de modules (true = noir).

// Par version (index = version) : [taille d'un bloc court, nb de blocs courts, nb de blocs longs, octets de correction par bloc].
const BLOCS_M: [number, number, number, number][] = [
  [0, 0, 0, 0],
  [16, 1, 0, 10],
  [28, 1, 0, 16],
  [44, 1, 0, 26],
  [32, 2, 0, 18],
  [43, 2, 0, 24],
  [27, 4, 0, 16],
  [31, 4, 0, 18],
  [38, 2, 2, 22],
  [36, 3, 2, 22],
  [43, 4, 1, 26],
];

// Centres des motifs d'alignement par version.
const ALIGNEMENTS: number[][] = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

// Bits de remplissage après les données, selon la version.
const RESTE = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

const capacite = (v: number) => {
  const [court, nbCourts, nbLongs] = BLOCS_M[v];
  return court * nbCourts + (court + 1) * nbLongs;
};

// Multiplication dans GF(256), polynôme 0x11D.
function mul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function diviseur(degre: number): number[] {
  const r = new Array<number>(degre).fill(0);
  r[degre - 1] = 1;
  let racine = 1;
  for (let i = 0; i < degre; i++) {
    for (let j = 0; j < degre; j++) {
      r[j] = mul(r[j], racine);
      if (j + 1 < degre) r[j] ^= r[j + 1];
    }
    racine = mul(racine, 0x02);
  }
  return r;
}

function correction(donnees: number[], div: number[]): number[] {
  const r = new Array<number>(div.length).fill(0);
  for (const b of donnees) {
    const facteur = b ^ (r.shift() as number);
    r.push(0);
    div.forEach((coef, i) => (r[i] ^= mul(coef, facteur)));
  }
  return r;
}

export function genererQr(texte: string): boolean[][] {
  const octets = Array.from(new TextEncoder().encode(texte));

  // Plus petite version qui contient le texte (4 bits de mode + compteur + données).
  let version = 1;
  const bitsNecessaires = (v: number) => 4 + (v < 10 ? 8 : 16) + octets.length * 8;
  while (version <= 10 && bitsNecessaires(version) > capacite(version) * 8) version++;
  if (version > 10) throw new Error('Texte trop long pour le QR code');

  // Flux de bits : mode octet (0100), longueur, données, terminateur, octets de bourrage.
  const bits: number[] = [];
  const ajouter = (valeur: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valeur >>> i) & 1);
  };
  const cap = capacite(version) * 8;
  ajouter(0b0100, 4);
  ajouter(octets.length, version < 10 ? 8 : 16);
  octets.forEach((o) => ajouter(o, 8));
  ajouter(0, Math.min(4, cap - bits.length));
  ajouter(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) ajouter(pad, 8);
  const donnees: number[] = [];
  for (let i = 0; i < bits.length; i += 8) donnees.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  // Découpage en blocs, correction d'erreur, puis entrelacement.
  const [court, nbCourts, nbLongs, nbCorr] = BLOCS_M[version];
  const div = diviseur(nbCorr);
  const blocs: number[][] = [];
  const corrs: number[][] = [];
  let k = 0;
  for (let b = 0; b < nbCourts + nbLongs; b++) {
    const taille = court + (b < nbCourts ? 0 : 1);
    const bloc = donnees.slice(k, k + taille);
    k += taille;
    blocs.push(bloc);
    corrs.push(correction(bloc, div));
  }
  const final: number[] = [];
  for (let i = 0; i <= court; i++) blocs.forEach((bl) => i < bl.length && final.push(bl[i]));
  for (let i = 0; i < nbCorr; i++) corrs.forEach((c) => final.push(c[i]));

  // Grille et motifs fixes.
  const n = version * 4 + 17;
  const grille = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const fixe = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const poser = (x: number, y: number, noir: boolean) => {
    grille[y][x] = noir;
    fixe[y][x] = true;
  };

  for (let i = 0; i < n; i++) {
    poser(6, i, i % 2 === 0);
    poser(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        poser(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
  const pos = ALIGNEMENTS[version];
  const der = pos.length - 1;
  pos.forEach((ax, i) =>
    pos.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === der) || (i === der && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) poser(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }),
  );

  const poserFormat = (masque: number) => {
    const d = masque; // niveau M = 00
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const f = ((d << 10) | r) ^ 0x5412;
    const bit = (i: number) => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) poser(8, i, bit(i));
    poser(8, 7, bit(6));
    poser(8, 8, bit(7));
    poser(7, 8, bit(8));
    for (let i = 9; i < 15; i++) poser(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) poser(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) poser(8, n - 15 + i, bit(i));
    poser(8, n - 8, true);
  };
  poserFormat(0); // réserve les emplacements

  if (version >= 7) {
    let r = version;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const v = (version << 12) | r;
    for (let i = 0; i < 18; i++) {
      const noir = ((v >>> i) & 1) === 1;
      const a = n - 11 + (i % 3);
      const b = Math.floor(i / 3);
      poser(a, b, noir);
      poser(b, a, noir);
    }
  }

  // Placement des octets en zigzag, de bas en haut puis de haut en bas, deux colonnes à la fois.
  const totalBits = final.length * 8 + RESTE[version];
  let i = 0;
  for (let droite = n - 1; droite >= 1; droite -= 2) {
    if (droite === 6) droite = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = droite - j;
        const monte = ((droite + 1) & 2) === 0;
        const y = monte ? n - 1 - vert : vert;
        if (!fixe[y][x] && i < totalBits) {
          grille[y][x] = i < final.length * 8 && ((final[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }

  // Choix du masque qui donne le motif le plus lisible (pénalités de la norme).
  const MASQUES = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const appliquer = (m: number) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fixe[y][x] && MASQUES[m](x, y)) grille[y][x] = !grille[y][x];
  };

  let meilleur = 0;
  let minPenalite = Infinity;
  for (let m = 0; m < 8; m++) {
    appliquer(m);
    poserFormat(m);
    const p = penalite(grille);
    if (p < minPenalite) {
      minPenalite = p;
      meilleur = m;
    }
    appliquer(m); // annule (XOR)
  }
  appliquer(meilleur);
  poserFormat(meilleur);
  return grille;
}

// Pénalités N1 (suites), N2 (carrés 2×2), N3 (faux motifs de repérage) et N4 (équilibre noir/blanc).
function penalite(g: boolean[][]): number {
  const n = g.length;
  let p = 0;
  const ligne = (get: (i: number) => boolean) => {
    let suite = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && get(i) === get(i - 1)) suite++;
      else {
        if (suite >= 5) p += suite - 2;
        suite = 1;
      }
    }
    for (let i = 0; i + 7 <= n; i++) {
      const motif = [1, 0, 1, 1, 1, 0, 1].every((b, k) => get(i + k) === (b === 1));
      if (!motif) continue;
      const blanc = (a: number, b: number) => {
        for (let k = a; k < b; k++) if (k >= 0 && k < n && get(k)) return false;
        return true;
      };
      if (blanc(i - 4, i) || blanc(i + 7, i + 11)) p += 40;
    }
  };
  for (let y = 0; y < n; y++) ligne((x) => g[y][x]);
  for (let x = 0; x < n; x++) ligne((y) => g[y][x]);
  let noirs = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (g[y][x]) noirs++;
      if (x < n - 1 && y < n - 1 && g[y][x] === g[y][x + 1] && g[y][x] === g[y + 1][x] && g[y][x] === g[y + 1][x + 1]) p += 3;
    }
  }
  p += Math.floor(Math.abs((noirs * 20) / (n * n) - 10)) * 10;
  return p;
}
