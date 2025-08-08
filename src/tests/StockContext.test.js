/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/__tests__/StockContext.test.js */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { StockProvider, StockContext } from '../StockContext';

// Composant de test pour accéder au contexte
const TestComponent = () => {
  const { 
    stock, 
    idealStock, 
    addToStock, 
    setIdealStockForProduct, 
    matchesShoppingItem 
  } = React.useContext(StockContext);

  return (
    <div>
      <div data-testid="stock-count">{stock.length}</div>
      <div data-testid="ideal-count">{idealStock.length}</div>
      <button 
        onClick={() => addToStock({ code: '123', nom: 'Monster Energy' })}
        data-testid="add-monster"
      >
        Add Monster
      </button>
      <button 
        onClick={() => addToStock({ code: '456', nom: 'Monster Pipeline' })}
        data-testid="add-pipeline"
      >
        Add Pipeline
      </button>
      <button 
        onClick={() => setIdealStockForProduct('Monster', 2)}
        data-testid="set-ideal"
      >
        Set Ideal
      </button>
    </div>
  );
};

describe('StockContext', () => {
  test('should group similar products together', () => {
    render(
      <StockProvider>
        <TestComponent />
      </StockProvider>
    );

    act(() => {
      screen.getByTestId('add-monster').click();
    });

    expect(screen.getByTestId('stock-count')).toHaveTextContent('1');

    act(() => {
      screen.getByTestId('add-pipeline').click();
    });

    // Doit toujours être 1 car les deux Monster sont groupés
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1');
  });

  test('should match shopping items with scanned products', () => {
    render(
      <StockProvider>
        <TestComponent />
      </StockProvider>
    );

    act(() => {
      screen.getByTestId('set-ideal').click();
      screen.getByTestId('add-monster').click();
    });

    expect(screen.getByTestId('ideal-count')).toHaveTextContent('1');
  });
});