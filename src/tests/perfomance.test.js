/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/__tests__/performance.test.js */
import { normalizeProductName, matchesShoppingItem } from '../utils/normalizeProductName';

describe('Performance Tests', () => {
  const LARGE_PRODUCT_LIST = [
    'Coca-Cola Original 33cl',
    'Coca-Cola Zero 33cl',
    'Coca-Cola Cherry 33cl',
    'Pepsi Cola Original 33cl',
    'Monster Energy Original 50cl',
    'Monster Energy Pipeline Punch 50cl',
    'Monster Energy Ultra White 50cl',
    'Red Bull Energy Drink 25cl',
    'Red Bull Sugar Free 25cl',
    'Nutella Pâte à tartiner 400g',
    'Nutella Pâte à tartiner 750g',
    'Pain de mie Harry\'s complet',
    'Pain de mie Harry\'s nature',
    'Lait demi-écrémé Lactel 1l',
    'Lait entier Lactel 1l',
    // ... ajouter plus de produits
  ];

  test('should normalize products quickly', () => {
    const startTime = performance.now();
    
    LARGE_PRODUCT_LIST.forEach(product => {
      normalizeProductName(product);
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Normalization of ${LARGE_PRODUCT_LIST.length} products took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100); // Moins de 100ms
  });

  test('should match shopping items efficiently', () => {
    const shoppingList = ['Monster', 'Coca', 'Nutella', 'Pain', 'Lait'];
    const startTime = performance.now();
    
    let matches = 0;
    shoppingList.forEach(shoppingItem => {
      LARGE_PRODUCT_LIST.forEach(product => {
        if (matchesShoppingItem(product, shoppingItem)) {
          matches++;
        }
      });
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Matching took ${duration.toFixed(2)}ms, found ${matches} matches`);
    expect(duration).toBeLessThan(200); // Moins de 200ms
    expect(matches).toBeGreaterThan(0);
  });
});