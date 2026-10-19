# Politique de sécurité

## Signaler une vulnérabilité

Merci de **ne pas ouvrir d'issue publique**. Utilisez « Report a vulnerability » (GitHub Security Advisories)
dans l'onglet Security du dépôt. Réponse visée sous 7 jours.

## Modèle de menace (résumé)

- **Données locales** : les enquêtes vivent dans l'IndexedDB du navigateur. Quiconque accède à votre session
  de navigateur y accède aussi. Le chiffrement par enquête est prévu en v1.0.
- **Isolation d'origine** : IndexedDB est partagé par origine. Déployez filrouge sur un domaine dédié, jamais
  sur un sous-chemin d'une origine partagée (`<user>.github.io/...`).
- **Contenu hostile** : labels, notes, URLs et fichiers importés sont traités comme malveillants. Validation
  Zod à l'import, Markdown rendu sans HTML brut, liens limités à `http(s)`/`mailto`.
- **Zéro fuite** : une Content Security Policy stricte (`default-src 'self'`, pas d'`unsafe-eval`,
  `img-src 'self' data: blob:`, `connect-src 'self'`) bloque scripts tiers, images distantes (pixels de
  suivi dans une note) et requêtes sortantes. Seuls les styles inline sont autorisés (requis par Radix).
