package com.example.todo.service;

import com.example.todo.entity.Todo;
import com.example.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    public Optional<Todo> findById(Long id) {
        return todoRepository.findById(id);
    }

    public Todo save(Todo todo) {
        return todoRepository.save(todo);
    }

    public Todo getTodoById(Long id) {
        return todoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Todo not found with id: " + id));
    }

    public Todo createTodo(Todo todo) {
        todo.setCreatedAt(LocalDateTime.now());
        todo.setUpdatedAt(LocalDateTime.now());
        todo.setCompleted(false);
        return todoRepository.save(todo);
    }

    public Todo updateTodo(Long id, Todo todo) {
        Todo existingTodo = getTodoById(id);
        existingTodo.setTitle(todo.getTitle());
        existingTodo.setDescription(todo.getDescription());
        existingTodo.setUpdatedAt(LocalDateTime.now());
        return todoRepository.save(existingTodo);
    }

    public Todo toggleComplete(Long id) {
        Todo existingTodo = getTodoById(id);
        existingTodo.setCompleted(!existingTodo.isCompleted());
        existingTodo.setUpdatedAt(LocalDateTime.now());
        return todoRepository.save(existingTodo);
    }

    public Todo toggleComplete(Long id, boolean completed) {
        Todo existingTodo = getTodoById(id);
        existingTodo.setCompleted(completed);
        existingTodo.setUpdatedAt(LocalDateTime.now());
        return todoRepository.save(existingTodo);
    }

    public void deleteTodo(Long id) {
        Todo todo = getTodoById(id);
        todoRepository.delete(todo);
    }

    public List<Todo> getSubtasks(Long parentId) {
        Todo parentTodo = todoRepository.findById(parentId)
                .orElseThrow(() -> new EntityNotFoundException("Parent Todo not found"));
        return parentTodo.getSubtasks();
    }

    public Todo addSubtask(Long parentId, Todo subtask) {
        Todo parentTodo = todoRepository.findById(parentId)
                .orElseThrow(() -> new EntityNotFoundException("Parent Todo not found"));
        parentTodo.getSubtasks().add(subtask);
        return todoRepository.save(parentTodo);
    }

    public Todo updateSubtask(Long parentId, Long subtaskId, Todo subtask) {
        Todo parentTodo = todoRepository.findById(parentId)
                .orElseThrow(() -> new EntityNotFoundException("Parent Todo not found"));
        Todo existingSubtask = parentTodo.getSubtasks().stream()
                .filter(t -> t.getId().equals(subtaskId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Subtask not found"));
        existingSubtask.setTitle(subtask.getTitle());
        existingSubtask.setDescription(subtask.getDescription());
        existingSubtask.setCompleted(subtask.isCompleted());
        return todoRepository.save(parentTodo);
    }

    public void deleteSubtask(Long parentId, Long subtaskId) {
        Todo parentTodo = todoRepository.findById(parentId)
                .orElseThrow(() -> new EntityNotFoundException("Parent Todo not found"));
        parentTodo.getSubtasks().removeIf(t -> t.getId().equals(subtaskId));
        todoRepository.save(parentTodo);
    }
}
