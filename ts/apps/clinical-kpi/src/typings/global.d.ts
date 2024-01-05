declare global {
  interface Window {
    // Define Cypress as part of the window interface for E2E check
    Cypress: unknown;
  }
}

export {};
