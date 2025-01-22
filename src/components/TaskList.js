import React, { useState, useEffect } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Paper,
  Typography,
  Collapse,
  Button,
  Box
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { tasks } from '../client/api-client';
import SubtaskList from './SubtaskList';
import TaskForm from './TaskForm';

const TaskList = () => {
  const [taskList, setTaskList] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasks.getAll();
      setTaskList(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await tasks.create(taskData);
      fetchTasks();
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await tasks.update(editingTask.id, taskData);
      fetchTasks();
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasks.delete(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleExpandTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  return (
    <Box data-testid="task-list">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreating(true)}
          data-testid="create-task-btn"
        >
          Create Task
        </Button>
      </Box>

      {isCreating && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {editingTask && (
        <TaskForm
          initialData={editingTask}
          onSubmit={handleUpdateTask}
          onCancel={() => setEditingTask(null)}
        />
      )}

      <Paper elevation={3}>
        <List>
          {taskList.map((task) => (
            <React.Fragment key={task.id}>
              <ListItem
                data-testid="task-item"
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => setEditingTask(task)}
                      data-testid="edit-task-btn"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteTask(task.id)}
                      data-testid="delete-task-btn"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton onClick={() => handleExpandTask(task.id)}>
                      {expandedTask === task.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={task.title}
                  secondary={task.description}
                />
              </ListItem>
              <Collapse in={expandedTask === task.id}>
                <Box sx={{ pl: 4, pr: 2 }}>
                  <SubtaskList parentTaskId={task.id} />
                </Box>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default TaskList;
