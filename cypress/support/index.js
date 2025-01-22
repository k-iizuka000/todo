// カスタムコマンドの登録
Cypress.Commands.add('login', () => {
  // Supabaseを使用した認証
  cy.window().then((win) => {
    win.localStorage.setItem('supabase.auth.token', Cypress.env('AUTH_TOKEN'));
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('supabase.auth.token');
  });
});

Cypress.Commands.add('createTask', (title, description = '') => {
  cy.get('[data-testid="create-task-btn"]').click();
  cy.get('[data-testid="task-title-input"]').type(title);
  if (description) {
    cy.get('[data-testid="task-description-input"]').type(description);
  }
  cy.get('[data-testid="save-task-btn"]').click();
}); 