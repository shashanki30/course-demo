import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayCircle,
  CheckCircle,
  AccessTime,
  Description,
  Bookmark,
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';

const CourseDetails = ({ section, videos, onVideoSelect }) => {
  const { isVideoWatched, getSectionProgress } = useUser();
  const progress = getSectionProgress(section);

  const formatDuration = (duration) => {
    // Assuming duration is in minutes
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          {section}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {progress.percentage}% Complete
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress.percentage}
            sx={{
              width: 100,
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                bgcolor: progress.percentage === 100 ? 'success.main' : 'primary.main',
              }
            }}
          />
        </Box>
      </Box>

      <List>
        {videos.map((video, index) => (
          <React.Fragment key={index}>
            <ListItem
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                {isVideoWatched(video.url) ? (
                  <CheckCircle color="success" />
                ) : (
                  <PlayCircle color="primary" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {video.title}
                    </Typography>
                    {isVideoWatched(video.url) && (
                      <Chip
                        label="Completed"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(video.duration || 10)}
                      </Typography>
                    </Box>
                    {video.description && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Description fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {video.description.length > 50
                            ? `${video.description.substring(0, 50)}...`
                            : video.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Start Learning">
                  <IconButton
                    onClick={() => onVideoSelect(section, video.title, video.url)}
                    color="primary"
                  >
                    <PlayCircle />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Save for Later">
                  <IconButton color="action">
                    <Bookmark />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
            {index < videos.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default CourseDetails; 