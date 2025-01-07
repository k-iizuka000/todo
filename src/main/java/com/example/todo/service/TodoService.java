package com.example.todo.service;

import com.example.todo.entity.Todo;
import com.example.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    public Todo createTodo(Todo todo) {
        todo.setCreatedAt(LocalDateTime.now());
        return todoRepository.save(todo);
    }

    public Todo updateTodo(Long id, Todo todo) {
        Optional<Todo> existingTodo = todoRepository.findById(id);
        if (existingTodo.isPresent()) {
            Todo updatedTodo = existingTodo.get();
            updatedTodo.setTitle(todo.getTitle());
            updatedTodo.setDescription(todo.getDescription());
            updatedTodo.setUpdatedAt(LocalDateTime.now());
            return todoRepository.save(updatedTodo);
        }
        return null;
    }

    public Todo toggleComplete(Long id, boolean completed) {
        Optional<Todo> existingTodo = todoRepository.findById(id);
        if (existingTodo.isPresent()) {
            Todo updatedTodo = existingTodo.get();
            updatedTodo.setCompleted(completed);
            updatedTodo.setUpdatedAt(LocalDateTime.now());
            return todoRepository.save(updatedTodo);
        }
        return null;
    }

    public void deleteTodo(Long id) {
        todoRepository.deleteById(id);
    }
}
