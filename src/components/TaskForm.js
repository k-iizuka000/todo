import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Paper,
  Typography,
  List,
  ListItem,
  IconButton,
  Stack
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const TaskForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [task, setTask] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    subtasks: initialData?.subtasks || []
  });

  const [subtaskInput, setSubtaskInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    onSubmit(task);
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setTask({
        ...task,
        subtasks: [...task.subtasks, { content: subtaskInput, completed: false }]
      });
      setSubtaskInput('');
    }
  };

  const removeSubtask = (index) => {
    setTask({
      ...task,
      subtasks: task.subtasks.filter((_, i) => i !== index)
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'タスクの編集' : '新規タスクの作成'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="タイトル"
          value={task.title}
          onChange={(e) => {
            setTask({ ...task, title: e.target.value });
            setError('');
          }}
          margin="normal"
          required
          error={!!error}
          helperText={error}
          data-testid="task-title-input"
        />
        <TextField
          fullWidth
          label="説明"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          margin="normal"
          multiline
          rows={3}
          data-testid="task-description-input"
        />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">サブタスク</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="サブタスクを追加"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              size="small"
              data-testid="subtask-input"
            />
            <Button
              variant="contained"
              onClick={addSubtask}
              startIcon={<AddIcon />}
              data-testid="add-subtask-btn"
            >
              追加
            </Button>
          </Stack>
          
          <List>
            {task.subtasks.map((subtask, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    onClick={() => removeSubtask(index)}
                    data-testid="remove-subtask-btn"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <Typography>{subtask.content}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            data-testid="save-task-btn"
          >
            {initialData ? '更新' : '作成'}
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            data-testid="cancel-task-btn"
          >
            キャンセル
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default TaskForm;
