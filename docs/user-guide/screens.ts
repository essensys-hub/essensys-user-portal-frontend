/**
 * Écrans du guide utilisateur et repères numérotés (portal-user-guide-2026-10-006).
 *
 * Les numéros sont dessinés sur la capture desktop ; la capture mobile montre l'écran tel
 * qu'il apparaît sur téléphone. Chaque repère désigne un élément par son rôle et son libellé accessibles. Si un élément
 * disparaît de l'interface, la capture échoue : c'est le signal que la page du guide doit
 * être mise à jour. Les numéros correspondent aux listes « L'écran en détail » des pages.
 */

export type Target =
  | { role: 'button' | 'link' | 'heading' | 'textbox' | 'navigation'; name: string | RegExp }
  | { text: string | RegExp };

export interface Marker {
  n: number;
  target: Target;
  /** Limiter le repère à un format (la navigation diffère entre desktop et mobile). */
  only?: 'desktop' | 'mobile';
}

export interface Screen {
  slug: string;
  route: string;
  title: string;
  markers: Marker[];
  /** Capture pleine page (écrans longs). */
  fullPage?: boolean;
}

export const screens: Screen[] = [
  {
    slug: 'tableau-de-bord',
    route: '/dashboard',
    title: 'Tableau de bord',
    markers: [
      { n: 1, target: { text: /Gateway en ligne · Armoire/ } },
      { n: 2, target: { role: 'heading', name: 'Armoire Essensys' } },
      { n: 3, target: { text: /Dernière action/ } },
      { n: 4, target: { text: /Rappel/ } },
      { n: 5, target: { role: 'heading', name: 'Éclairage' } },
    ],
  },
  {
    slug: 'eclairage',
    route: '/lighting',
    title: 'Éclairage',
    markers: [
      { n: 1, target: { role: 'heading', name: 'Éclairages principaux' } },
      { n: 2, target: { role: 'button', name: 'Tout allumer' } },
      { n: 3, target: { role: 'button', name: 'Tout éteindre' } },
      { n: 4, target: { text: 'Terrasse' } },
      { n: 5, target: { role: 'button', name: 'Allumer' } },
    ],
  },
  {
    slug: 'volets',
    route: '/shutters',
    title: 'Volets et stores',
    markers: [
      { n: 1, target: { role: 'heading', name: 'Volets' } },
      { n: 2, target: { role: 'button', name: 'Tout ouvrir' } },
      { n: 3, target: { role: 'button', name: 'Tout fermer' } },
      { n: 4, target: { text: 'Volet 1 Salon' } },
      { n: 5, target: { role: 'button', name: 'Ouvrir' } },
    ],
  },
  {
    slug: 'chauffage',
    route: '/heating',
    title: 'Chauffage',
    markers: [
      { n: 1, target: { role: 'button', name: 'Zone Jour' } },
      { n: 2, target: { text: /réglage chauffage auto/i } },
      { n: 3, target: { role: 'button', name: 'Confort' } },
      { n: 4, target: { role: 'button', name: 'Sync armoire' } },
      { n: 5, target: { role: 'button', name: 'Enregistrer' } },
    ],
  },
  {
    slug: 'chauffe-eau',
    route: '/water-heater',
    title: 'Chauffe-eau',
    markers: [
      { n: 1, target: { role: 'button', name: /ON Autonome/ } },
      { n: 2, target: { role: 'button', name: /Suivi HP\/HC/ } },
      { n: 3, target: { role: 'button', name: /^OFF/ } },
      { n: 4, target: { text: 'Conseil économique' } },
    ],
  },
  {
    slug: 'arrosage',
    route: '/sprinkler',
    title: 'Arrosage',
    markers: [
      { n: 1, target: { role: 'button', name: /Automatique/ } },
      { n: 2, target: { role: 'button', name: /^15 minutes/ } },
      { n: 3, target: { role: 'button', name: /^OFF/ } },
      { n: 4, target: { text: 'Conseil' } },
    ],
  },
  {
    slug: 'scenarios',
    route: '/scenarios',
    title: 'Scénarios',
    markers: [
      { n: 1, target: { text: /Dernier scénario lancé/ } },
      { n: 2, target: { text: 'Je sors' } },
      { n: 3, target: { role: 'button', name: 'Lancer' } },
      { n: 4, target: { role: 'button', name: 'Éditer' } },
    ],
  },
  {
    slug: 'securite',
    route: '/security',
    title: 'Sécurité',
    markers: [
      { n: 1, target: { text: 'Code alarme' } },
      { n: 2, target: { role: 'button', name: "Activer l'alarme" } },
      { n: 3, target: { role: 'button', name: "Désactiver l'alarme" } },
      { n: 4, target: { text: 'Prises pilotées' } },
      { n: 5, target: { role: 'button', name: 'Couper' } },
      { n: 6, target: { role: 'button', name: 'Rétablir' } },
      { n: 7, target: { text: 'Information' } },
    ],
  },
  {
    slug: 'notifications',
    route: '/notifications',
    title: 'Notifications',
    markers: [
      { n: 1, target: { text: 'Fonctionnalité non disponible' } },
      { n: 2, target: { text: 'Notifications SMS' } },
      { n: 3, target: { text: 'Notifications Email' } },
    ],
  },
  {
    slug: 'reglages',
    route: '/settings',
    title: 'Réglages',
    fullPage: true,
    markers: [
      { n: 1, target: { role: 'heading', name: 'Armoire Essensys' } },
      { n: 2, target: { text: 'Mode test' } },
      { n: 3, target: { text: 'Configuration du serveur backend' } },
      { n: 4, target: { text: 'Apparence' } },
      { n: 5, target: { role: 'button', name: 'Déconnexion' }, only: 'desktop' },
    ],
  },
];
