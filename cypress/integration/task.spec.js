describe('Task Management', () => {
  beforeEach(() => {
    // Setup and login before each test
    cy.visit('/gemini-todo.html');
    cy.login(); // Custom command for authentication
  });

  it('should display task list when authenticated', () => {
    cy.get('[data-testid="task-list"]').should('be.visible');
    cy.get('[data-testid="create-task-btn"]').should('be.visible');
  });

  it('should create a new task', () => {
    cy.get('[data-testid="create-task-btn"]').click();
    cy.get('[data-testid="task-title-input"]').type('New Test Task');
    cy.get('[data-testid="task-description-input"]').type('Test Description');
    cy.get('[data-testid="save-task-btn"]').click();
    cy.get('[data-testid="task-list"]').should('contain', 'New Test Task');
  });

  it('should manage subtasks', () => {
    // Create parent task first
    cy.createTask('Parent Task'); // Custom command
    
    // Add subtask
    cy.get('[data-testid="add-subtask-btn"]').first().click();
    cy.get('[data-testid="subtask-title-input"]').type('New Subtask');
    cy.get('[data-testid="save-subtask-btn"]').click();
    cy.get('[data-testid="subtask-list"]').should('contain', 'New Subtask');
  });

  it('should edit existing task', () => {
    cy.get('[data-testid="task-item"]').first().find('[data-testid="edit-task-btn"]').click();
    cy.get('[data-testid="task-title-input"]').clear().type('Updated Task Title');
    cy.get('[data-testid="save-task-btn"]').click();
    cy.get('[data-testid="task-list"]').should('contain', 'Updated Task Title');
  });

  it('should delete task', () => {
    cy.get('[data-testid="task-item"]').first().find('[data-testid="delete-task-btn"]').click();
    cy.get('[data-testid="confirm-delete-btn"]').click();
    cy.get('[data-testid="task-list"]').should('not.contain', 'Updated Task Title');
  });

  it('should handle error cases', () => {
    cy.get('[data-testid="create-task-btn"]').click();
    cy.get('[data-testid="save-task-btn"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should restrict access when not authenticated', () => {
    cy.logout(); // Custom command
    cy.visit('/tasks');
    cy.get('[data-testid="login-required-message"]').should('be.visible');
    cy.get('[data-testid="task-list"]').should('not.exist');
  });
});