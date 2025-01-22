import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  TextField,
  Button,
  Box,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { subtasks } from '../client/api-client';

const SubtaskList = ({ parentTaskId }) => {
  const [subtaskList, setSubtaskList] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchSubtasks();
  }, [parentTaskId]);

  const fetchSubtasks = async () => {
    try {
      const response = await subtasks.getAll(parentTaskId);
      setSubtaskList(response.data);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    }
  };

  const handleAddSubtask = async () => {
    if (newSubtask.trim()) {
      try {
        await subtasks.create(parentTaskId, { content: newSubtask });
        setNewSubtask('');
        fetchSubtasks();
      } catch (error) {
        console.error('Failed to create subtask:', error);
      }
    }
  };

  const handleToggleComplete = async (subtaskId) => {
    try {
      const subtask = subtaskList.find(s => s.id === subtaskId);
      await subtasks.update(subtaskId, {
        completed: !subtask.completed
      });
      fetchSubtasks();
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  const handleStartEdit = (subtask) => {
    setEditingId(subtask.id);
    setEditText(subtask.content);
  };

  const handleSaveEdit = async () => {
    if (editText.trim()) {
      try {
        await subtasks.update(editingId, { content: editText });
        setEditingId(null);
        setEditText('');
        fetchSubtasks();
      } catch (error) {
        console.error('Failed to update subtask:', error);
      }
    }
  };

  const handleDelete = async (subtaskId) => {
    try {
      await subtasks.delete(subtaskId);
      fetchSubtasks();
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  return (
    <Box data-testid="subtask-list">
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="新しいサブタスク"
          data-testid="subtask-input"
        />
        <Button
          variant="contained"
          onClick={handleAddSubtask}
          data-testid="add-subtask-btn"
        >
          追加
        </Button>
      </Stack>

      <List>
        {subtaskList.map((subtask) => (
          <ListItem
            key={subtask.id}
            dense
            data-testid="subtask-item"
          >
            <Checkbox
              checked={subtask.completed}
              onChange={() => handleToggleComplete(subtask.id)}
              data-testid="subtask-checkbox"
            />
            {editingId === subtask.id ? (
              <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  data-testid="subtask-edit-input"
                />
                <IconButton
                  onClick={handleSaveEdit}
                  color="primary"
                  data-testid="save-subtask-btn"
                >
                  <SaveIcon />
                </IconButton>
                <IconButton
                  onClick={() => setEditingId(null)}
                  data-testid="cancel-edit-btn"
                >
                  <CancelIcon />
                </IconButton>
              </Stack>
            ) : (
              <>
                <ListItemText primary={subtask.content} />
                <IconButton
                  onClick={() => handleStartEdit(subtask)}
                  data-testid="edit-subtask-btn"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(subtask.id)}
                  data-testid="delete-subtask-btn"
                >
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SubtaskList;
