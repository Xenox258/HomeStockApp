/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/__tests__/apiIntegration.test.js */
import { normalizeProductName, matchesShoppingItem } from '../utils/normalizeProductName';

// Codes-barres réels de produits connus
const REAL_PRODUCT_CODES = [
  { code: '3017620422003', expectedBrand: 'nutella' }, // Nutella
  { code: '5449000000996', expectedBrand: 'coca' },   // Coca-Cola
  { code: '8712100846003', expectedBrand: 'red' },     // Red Bull
  { code: '3229820129488', expectedBrand: 'monst' },   // Monster
  { code: '3270190207276', expectedBrand: 'evian' },   // Evian
];

async function fetchProductName(code) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 1 && data.product && data.product.product_name) {
      return data.product.product_name;
    }
    return null;
  } catch {
    return null;
  }
}

describe('API Integration Tests', () => {
  test('should fetch and normalize real product names', async () => {
    for (const product of REAL_PRODUCT_CODES) {
      const productName = await fetchProductName(product.code);
      
      if (productName) {
        console.log(`📦 ${product.code}: "${productName}"`);
        const normalized = normalizeProductName(productName);
        console.log(`🔄 Normalized: [${normalized.join(', ')}]`);
        
        // Vérifier que la marque attendue est présente
        const hasExpectedBrand = normalized.some(word => 
          word.includes(product.expectedBrand) || product.expectedBrand.includes(word)
        );
        
        expect(hasExpectedBrand).toBe(true);
      }
    }
  }, 30000); // Timeout plus long pour les appels API

  test('should match shopping list items with API results', async () => {
    const testCases = [
      { code: '3017620422003', shoppingItem: 'Nutella' },
      { code: '5449000000996', shoppingItem: 'Coca' },
      { code: '8712100846003', shoppingItem: 'Red Bull' },
    ];

    for (const testCase of testCases) {
      const productName = await fetchProductName(testCase.code);
      
      if (productName) {
        const matches = matchesShoppingItem(productName, testCase.shoppingItem);
        console.log(`🎯 "${testCase.shoppingItem}" vs "${productName}": ${matches ? '✅' : '❌'}`);
        expect(matches).toBe(true);
      }
    }
  }, 30000);
});