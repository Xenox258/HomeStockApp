/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/scripts/fetchTestData.js */
const fs = require('fs');
const fetch = require('node-fetch');

// Codes-barres de produits populaires pour les tests
const POPULAR_PRODUCTS = [
  '3017620422003', // Nutella 400g
  '5449000000996', // Coca-Cola 33cl
  '8712100846003', // Red Bull 25cl
  '3229820129488', // Monster Energy
  '3270190207276', // Evian 50cl
  '7622210411235', // Toblerone
  '3057640127618', // Activia Danone
  '3560071037857', // Actimel
  '8000500310427', // Ferrero Rocher
  '3155251213419', // Perrier
];

async function fetchProductData() {
  const products = [];
  
  for (const code of POPULAR_PRODUCTS) {
    try {
      console.log(`Fetching ${code}...`);
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        products.push({
          code,
          name: data.product.product_name,
          brands: data.product.brands,
          categories: data.product.categories,
          normalized: require('../src/utils/normalizeProductName').normalizeProductName(data.product.product_name)
        });
        console.log(`✅ ${data.product.product_name}`);
      } else {
        console.log(`❌ Product ${code} not found`);
      }
      
      // Délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching ${code}:`, error);
    }
  }
  
  // Sauvegarder les données pour les tests
  fs.writeFileSync(
    './src/__tests__/__fixtures__/testProducts.json',
    JSON.stringify(products, null, 2)
  );
  
  console.log(`\n📊 Fetched ${products.length} products`);
  return products;
}

if (require.main === module) {
  fetchProductData();
}

module.exports = { fetchProductData };