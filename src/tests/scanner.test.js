/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/Tests/scanner.test.js */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StockProvider } from '../StockContext';
import ScannerStockApp from '../ScannerStockApp';

// Mock Quagga
jest.mock('@ericblade/quagga2', () => ({
  init: jest.fn((config, callback) => {
    setTimeout(() => callback(null), 100);
  }),
  start: jest.fn(),
  stop: jest.fn(),
  onDetected: jest.fn(),
  offDetected: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const renderScanner = () => {
  return render(
    <BrowserRouter>
      <StockProvider>
        <ScannerStockApp />
      </StockProvider>
    </BrowserRouter>
  );
};

describe('Scanner Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
  });

  test('should start and stop scanning', async () => {
    renderScanner();
    
    const startButton = screen.getByText(/démarrer le scan/i);
    
    act(() => {
      fireEvent.click(startButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/stopper le scan/i)).toBeInTheDocument();
    });
  });

  test('should handle product detection with API response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Monster Energy Original 50cl'
        }
      })
    });

    renderScanner();
    
    // Démarrer le scanner d'abord
    const startButton = screen.getByText(/démarrer le scan/i);
    act(() => {
      fireEvent.click(startButton);
    });

    // Attendre que le scanner soit démarré
    await waitFor(() => {
      expect(screen.getByText(/stopper le scan/i)).toBeInTheDocument();
    });

    // Simuler la détection d'un code-barres
    const Quagga = require('@ericblade/quagga2');
    
    // Vérifier que onDetected a été appelé
    await waitFor(() => {
      expect(Quagga.onDetected).toHaveBeenCalled();
    });

    // Récupérer le callback
    const mockCallback = Quagga.onDetected.mock.calls[0]?.[0];
    
    if (mockCallback) {
      await act(async () => {
        mockCallback({
          codeResult: { code: '3229820129488' }
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/produit détecté/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  test('should handle unknown products', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 0
      })
    });

    renderScanner();
    
    // Démarrer le scanner
    const startButton = screen.getByText(/démarrer le scan/i);
    act(() => {
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/stopper le scan/i)).toBeInTheDocument();
    });

    const Quagga = require('@ericblade/quagga2');
    const mockCallback = Quagga.onDetected.mock.calls[0]?.[0];
    
    if (mockCallback) {
      // Simuler 5 échecs pour déclencher la saisie manuelle
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          mockCallback({
            codeResult: { code: `UNKNOWN${i}` }
          });
        });
        
        // Petite pause entre les tentatives
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await waitFor(() => {
        expect(screen.getByText(/produit non trouvé/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    }
  });

  test('should allow manual product entry', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 })
    });

    renderScanner();
    
    // Démarrer le scanner
    const startButton = screen.getByText(/démarrer le scan/i);
    act(() => {
      fireEvent.click(startButton);
    });

    // Simuler un produit non trouvé
    const Quagga = require('@ericblade/quagga2');
    const mockCallback = Quagga.onDetected.mock.calls[0]?.[0];
    
    if (mockCallback) {
      // Simuler 5 échecs
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          mockCallback({
            codeResult: { code: 'MANUAL123' }
          });
        });
      }

      // Attendre que le formulaire de saisie manuelle apparaisse
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nom du produit/i)).toBeInTheDocument();
      });

      // Saisir un nom de produit
      const input = screen.getByPlaceholderText(/nom du produit/i);
      act(() => {
        fireEvent.change(input, { target: { value: 'Produit Test' } });
      });

      // Confirmer l'ajout
      const confirmButton = screen.getByText(/confirmer/i);
      act(() => {
        fireEvent.click(confirmButton);
      });

      // Le produit devrait être ajouté et le scanner reset
      await waitFor(() => {
        expect(screen.queryByText(/produit non trouvé/i)).not.toBeInTheDocument();
      });
    }
  });
});