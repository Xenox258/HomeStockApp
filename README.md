# HomeStockApp

Application web (React) de gestion de stock domestique avec:
- Scan de codes‑barres en direct (Quagga2)
- Normalisation intelligente des noms (détection marque / catégorie)
- Objectifs de stock (stock cible)
- Liste de courses générée automatiquement
- Liste de courses manuelle (ajout direct + quantités)
- Auto‑complétion produits (OpenFoodFacts) dans les formulaires
- Décrément automatique de la liste manuelle quand un produit scanné correspond
- Edition rapide (quantités + renommage)
- Interface responsive

---

## 🆕 Nouveautés récentes

| Fonction | Description |
|----------|-------------|
| Auto‑complétion OFF | Champ de saisie avec suggestions (images + Nutri‑Score). |
| Liste manuelle | Ajout d’articles non liés aux objectifs. |
| Synchronisation | Quand un scan ajoute un produit au stock, la ligne manuelle correspondante est décrémentée/supprimée. |
| Badge MANUEL | Différenciation visuelle dans la liste de courses. |
| Matching amélioré | Normalisation + stems pour relier stock / objectifs / manuel. |

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
 ├─ assets/
 ├─ components/
 │   ├─ common/
 │   │   └─ ProductSuggestInput.jsx   # Auto‑complétion OFF
 │   └─ scanner/
 │       ├─ ScannerStockApp.jsx
 │       └─ ScannerDevTool.jsx
 ├─ context/
 │   └─ StockContext.js               # State global + décrément liste manuelle
 ├─ pages/
 │   ├─ Home/
 │   ├─ Scanner/
 │   ├─ Stock/
 │   ├─ IdealStock/
 │   └─ ShoppingList/
 ├─ styles/
 │   └─ SuggestInput.css              # Styles de l’auto‑complétion
 ├─ utils/
 │   └─ normalizeProductName.js
 ├─ tests/
 └─ setupTests.js
```

Alias: `baseUrl: src` → imports racine (`utils/...`, `styles/...`).

---

## 🔍 Scanner (Quagga2)

- `ScannerStockApp.jsx` (initialisation + overlay)
- Détection EAN → fetch OFF → normalisation (`normalizeOFFProduct`)
- Après confirmation: `addToStock` (déclenche ajustement liste manuelle)

---

## 🛒 Liste de Courses

Deux sources fusionnées:
1. Objectifs manquants (auto)
2. Liste manuelle (items ajoutés directement)

Logique liste manuelle:
- `addManualShoppingItem(nom, quantite)`
- Synchronisation: `adjustManualListAfterStockChange` décrémente ou supprime lors d’un ajout au stock (scan ou édition quantité positive).
- Pas de dédup cross‑sources pour conserver l’intention utilisateur.

---

## ✏️ Auto‑complétion OFF

Composant: `ProductSuggestInput.jsx`
- Requête OFF (`search.pl`) après 300 ms de debounce
- Cache mémoire simple (clé = query normalisée)
- Affiche image + Nutri‑Score (si dispo)
- Valeurs par défaut si pas de résultats
- Réutilisé dans: Ajout objectifs + Ajout manuel liste de courses

---

## 🧠 Normalisation & Matching

Fichier `utils/normalizeProductName.js`:
- Tokenisation, accents retirés, troncature (5 chars)
- Stems triés → comparaison stable
- Fonctions: `normalizeProductName`, `haveCommonStems`, `matchesShoppingItem`, `normalizeOFFProduct`
- Matching multi‑usage (stock ↔ objectifs ↔ manuel)

---

## 🧾 Contexte Global (StockContext)

Expose:
- `stock`, `idealStock`, `manualShoppingList`
- CRUD: `addToStock`, `updateStock`, `removeFromStock`
- Objectifs: `setIdealStockForProduct`, `removeFromIdealStock`
- Liste manuelle: `addManualShoppingItem`, `updateManualShoppingItem`, `removeManualShoppingItem`, `clearPurchasedManualItems`
- Synchro: `adjustManualListAfterStockChange(productName, delta)` interne (appelé dans `addToStock`)

---

## Flux d’un scan jusqu’à la liste

1. Scan → code détecté
2. Fetch OFF → normalisation du nom canonique
3. Confirmation → `addToStock`
4. Stock mis à jour
5. `adjustManualListAfterStockChange` réduit la quantité manuelle correspondante
6. Recalcul liste de courses (auto + manuel restant)

---

## 🔐 Permissions & Sécurité

(identique) Scanner nécessite HTTPS pour mobiles.

---

## 📈 Roadmap

- Persistance locale (localStorage / IndexedDB)
- Boutons +/- pour quantités (remplacer spin native)
- Fusion intelligente auto + manuel (option)
- PWA offline
- Export / import
- i18n

---

## 🩺 Dépannage rapide (ajouts)

| Problème | Solution |
|----------|----------|
| Suggestion OFF ne s’affiche pas | Vérifier réseau / CORS / console |
| Liste manuelle ne décrémente pas après scan | Vérifier nom scanné vs item (accents retirés) |
| Doublons nom objectif / manuel | Comportement attendu (pas fusionné) |

---

Le reste du document (sections Tests, Scripts, Accessibilité, etc.) reste inchangé.

Bon développement.
