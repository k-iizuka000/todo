package com.example.todo.repository;

import com.example.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {
    // All basic CRUD operations are inherited from JpaRepository:
    // - findAll()
    // - findById()
    // - save()
    // - deleteById()
    // etc.
}