document.addEventListener('DOMContentLoaded', function() {
  const todoForm = document.getElementById('todoForm');
  const todoList = document.getElementById('todoList');

  // Fetch and display todos
  async function fetchTodos() {
    try {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      renderTodos(todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }

  // Render todos to the list
  function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
      const todoItem = document.createElement('div');
      todoItem.className = `list-group-item d-flex justify-content-between align-items-center ${
        todo.completed ? 'list-group-item-success' : ''
      }`;
      todoItem.innerHTML = `
        <div>
          <h5>${todo.title}</h5>
          <p class="mb-0">${todo.description}</p>
          <small class="text-muted">Created: ${new Date(todo.createdAt).toLocaleString()}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="toggleComplete(${todo.id}, ${!todo.completed})">
            ${todo.completed ? 'Undo' : 'Complete'}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTodo(${todo.id})">Delete</button>
        </div>
      `;
      todoList.appendChild(todoItem);
    });
  }

  // Add new todo
  todoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newTodo = {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value
    };

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      });
      
      if (response.ok) {
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        fetchTodos();
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  });

  // Toggle complete status
  window.toggleComplete = async function(id, completed) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      if (response.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Error toggling complete status:', error);
    }
  };

  // Delete todo
  window.deleteTodo = async function(id) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Initial fetch
  fetchTodos();
});
