/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/setupTests.js */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock pour l'API OpenFoodFacts si pas de connexion internet
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      status: 0 // Produit non trouvé par défaut
    }),
  })
);

// Mock pour Quagga2 (scanner de codes-barres)
jest.mock('@ericblade/quagga2', () => ({
  init: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  onDetected: jest.fn(),
  offDetected: jest.fn(),
}));

// Configuration pour les tests d'API (si vous voulez tester avec de vraies données)
if (process.env.NODE_ENV === 'test' && process.env.REAL_API_TESTS === 'true') {
  global.fetch = require('node-fetch');
}

// Console personnalisée pour les tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});