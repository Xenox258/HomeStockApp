# HomeStockApp

Application web (React) de gestion de stock domestique avec:
- Scan de codes‑barres en direct (Quagga2)
- Normalisation intelligente des noms (détection marque / catégorie)
- Objectifs de stock (stock cible)
- Liste de courses générée automatiquement
- Edition rapide (quantités + renommage)
- Interface responsive

---

## 🚀 Installation & Démarrage

```bash
git clone https://github.com/Xenox258/HomeStockApp.git
cd HomeStockApp
npm install          # ou: yarn
npm start            # lance http://localhost:3000
```

Build production:
```bash
npm run build
```

Tests:
```bash
npm test
```

---

## 📁 Structure

```
src/
 ├─ App.js
 ├─ index.js
 ├─ assets/                # Médias (logo…)
 ├─ components/
 │   ├─ common/            # (placeholder composants transverses)
 │   └─ scanner/           # Scanner + outils dev
 │       ├─ ScannerStockApp.jsx
 │       └─ ScannerDevTool.jsx
 ├─ context/
 │   └─ StockContext.js    # State global (stock + objectifs)
 ├─ pages/
 │   ├─ Home/
 │   ├─ Scanner/
 │   ├─ Stock/
 │   ├─ IdealStock/
 │   └─ ShoppingList/
 ├─ styles/                # Feuilles CSS globales
 ├─ utils/
 │   └─ normalizeProductName.js
 ├─ tests/                 # Tests (normalisation, scanner, perf…)
 └─ setupTests.js
```

Alias utilisés: `jsconfig.json` définit seulement `baseUrl: src` → imports absolus (`styles/...`, `pages/...`, `utils/...`).

---

## 🔍 Scanner (Quagga2)

- Initialisation via `Quagga.init` dans `ScannerStockApp.jsx`
- Flux vidéo LiveStream (caméra arrière mobile si possible)
- Hooks:
  - `onDetected` (EAN trouvé) → requête OpenFoodFacts
  - `onProcessed` → dessin des boxes sur le canvas overlay
- Tentatives:
  - <5 échecs: continue
  - ≥5: bascule saisie manuelle
  - ≥15: code ignoré pour réduire le bruit
- Pause logique: quand un produit est en validation on retire temporairement `onDetected` sans couper la caméra

---

## 🧠 Normalisation & Matching

Fichier: `utils/normalizeProductName.js`

Fonctions clés:
- `normalizeProductName(text)` → tableau de “stems” (mots tronqués à 5 chars, accents retirés, mots vides filtrés)
- `matchesShoppingItem(productName, shoppingItem)`:
  1. Normalisation bilatérale
  2. Gestion variantes de marque (ex: RedBull / Red Bull)
  3. Similarité pondérée
  4. Règles anti faux positifs (catégorie lait, ingrédients, termes génériques)
- `normalizeOFFProduct(off)` → extraction canonique (marque, catégorie lait / boisson, variante)
- Catégorisation heuristique (laits végétaux, energy drinks, etc.)

Tests: voir `tests/normalizeProductName.test.js` (cas complexes, perf, faux positifs).

---

## 🧾 Contexte Global (StockContext)

Expose:
- `stock`: [{ code, nom, quantite }]
- `idealStock`: [{ nom, quantite }]
- `addToStock(product)`
- `updateStock(code, newQty, newName?)`
- `removeFromStock(code)`
- `setIdealStockForProduct(nom, quantite)`
- `removeFromIdealStock(nom)`
- Matching automatique pour progression des objectifs + liste de courses.

---

## 🛒 Liste de Courses

Page `ShoppingListPage.jsx`:
- Calcule quantité manquante: objectif − stock courant
- Classe priorité (low / medium / high) selon % manquant
- N’affiche que les produits incomplets

---

## 🎯 Objectifs (Stock Cible)

Page `IdealStockPage.jsx`:
- Ajout / édition inline des quantités cibles
- Barre de progression par produit
- Affichage du produit réel auquel l’objectif est mappé (matching robuste)

---

## ✨ UI / UX

- Layout responsive pur CSS (sans framework lourd)
- Animations discrètes (apparition panneaux, hover cartes)
- Composants modulaires (scanner découplé)
- Saisie manuelle fallback après échecs répétés

---

## 🧪 Tests

Catégories:
- Normalisation & matching (beaucoup de cas réels)
- Scanner (simulation Quagga mocké)
- Performance (scénarios larges)
- Contexte (ajout / mise à jour)

Mock principaux:
- `fetch` (OFF)
- Quagga2 (init / onDetected / onProcessed)

---

## ⚙️ Scripts (npm)

| Commande           | Rôle                                  |
|--------------------|----------------------------------------|
| `npm start`        | Dev server (port 3000)                 |
| `npm test`         | Tests interactifs                      |
| `npm run build`    | Build production (dans `build/`)       |

---

## 🔐 Permissions & Sécurité

- Scanner nécessite permission caméra (HTTPS conseillé en prod)
- Aucune persistance externe par défaut (pas d’auth)
- Ajout futur: stockage local (localStorage / IndexedDB) ou backend API

---

## 📈 Améliorations Futures (Roadmap)

- Persistance locale + sync cloud
- Détection automatique des quantités (pack x6…)
- Historique mouvements (entrée/sortie)
- Export / import CSV ou JSON
- Mode offline PWA
- Internationalisation (FR/EN)
- Algorithme ML de catégorisation

---

## 🩺 Dépannage Rapide

| Problème                               | Solution courte |
|----------------------------------------|-----------------|
| Vidéo noire                            | Vérifier permission caméra / onglet actif |
| Bulle validation superpose la vidéo    | Vérifier `.scanner-row` et styles `.floating-confirmation` |
| Tests Quagga échouent                  | Regarder mock dans `setupTests.js` |
| Faux positifs matching “Lait de coco”  | Catégorie lait: heuristique `matchesCategoryLait` (adapter si besoin) |

---

## ♿ Accessibilité (A11y)

- Icônes + texte (éviter reliance exclusive aux emojis à terme)
- Boutons focusables; améliorer future navigation clavier (todo: rôles ARIA scanner)
- Prévoir réduction animations via `prefers-reduced-motion` (déjà utilisé pour certaines animations)

---

## 📦 Dépendances principales

- React 18
- Quagga2 (`@ericblade/quagga2`)
- Jest / React Testing Library (tests)

---

## 📝 Licence

MIT (ajouter le fichier LICENSE si absent).

---

## 🤝 Contribution

1. Fork
2. Branche: `feat/ma-fonction`
3. PR avec description concise (français ou anglais)
4. Tests si logique modifiée

---

## 🗂️ Notes Dev

- Aliases TypeScript style non utilisés (CRA vanilla) → baseUrl suffisant.
- Toute logique de parsing OFF centralisée dans `normalizeProductName.js` (éviter duplication).
- Ajouter un service dédié si intégration d’autres APIs (créer dossier `services/`).

---

Bon développement.
