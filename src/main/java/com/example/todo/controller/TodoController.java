package com.example.todo.controller;

import com.example.todo.entity.Todo;
import com.example.todo.service.TodoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<List<Todo>> getTodos() {
        return ResponseEntity.ok(todoService.getAllTodos());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Todo> createTodo(@RequestBody Todo todo) {
        return new ResponseEntity<>(todoService.createTodo(todo), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Long id, @RequestBody Todo todoDetails) {
        Todo existingTodo = todoService.getTodoById(id);
        existingTodo.setTitle(todoDetails.getTitle());
        existingTodo.setDescription(todoDetails.getDescription());
        Todo updatedTodo = todoService.updateTodo(id, todoDetails);
        return ResponseEntity.ok(updatedTodo);
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Todo> toggleTodo(@PathVariable Long id) {
        return ResponseEntity.ok(todoService.toggleComplete(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Todo> toggleComplete(@PathVariable Long id, @RequestBody Todo todo) {
        return ResponseEntity.ok(todoService.toggleComplete(id, todo.isCompleted()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable Long id) {
        Todo todo = todoService.getTodoById(id);
        return ResponseEntity.ok(todo);
    }

    @GetMapping("/{parentId}/subtasks")
    public ResponseEntity<List<Todo>> getSubtasks(@PathVariable Long parentId) {
        List<Todo> subtasks = todoService.getSubtasks(parentId);
        return ResponseEntity.ok(subtasks);
    }

    @PostMapping("/{parentId}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Todo> addSubtask(@PathVariable Long parentId, @RequestBody Todo subtask) {
        Todo createdSubtask = todoService.addSubtask(parentId, subtask);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSubtask);
    }

    @PutMapping("/{parentId}/subtasks/{subtaskId}")
    public ResponseEntity<Todo> updateSubtask(@PathVariable Long parentId, @PathVariable Long subtaskId, @RequestBody Todo subtaskDetails) {
        Todo updatedSubtask = todoService.updateSubtask(parentId, subtaskId, subtaskDetails);
        return ResponseEntity.ok(updatedSubtask);
    }

    @DeleteMapping("/{parentId}/subtasks/{subtaskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteSubtask(@PathVariable Long parentId, @PathVariable Long subtaskId) {
        todoService.deleteSubtask(parentId, subtaskId);
        return ResponseEntity.noContent().build();
    }
}
