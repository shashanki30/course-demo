import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  List,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Collapse,
  Paper,
  Alert,
  ListItemButton,
  LinearProgress,
} from '@mui/material';
import {
  AccountCircle,
  Edit,
  Logout,
  ExpandLess,
  ExpandMore,
  CheckCircle,
  Settings,
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import CourseDetails from './CourseDetails';

const drawerWidth = '360px';

const CoursePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, isVideoWatched, markVideoAsWatched, removeUser, updateSectionProgress } = useUser();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileImageInput, setProfileImageInput] = useState(null);
  const [courseData, setCourseData] = useState({});
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});

  // Add this function to convert YouTube URLs to embed format
  const convertToEmbedUrl = (url) => {
    if (!url) return '';
    
    // If it's already an embed URL, return it
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    // Extract video ID from different YouTube URL formats
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    // Return embed URL if we found a video ID
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  useEffect(() => {
    const loadGoogleSheetData = async () => {
      try {
        const SHEET_ID = '1UhfbVGLGTy2jLh6QSlsXmzfh9pJTdUIXYiB0UX5UqQA';
        const SHEET_NAME = 'Sheet1';
        const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

        console.log('Fetching Google Sheet data from:', GOOGLE_SHEETS_URL);
        const response = await fetch(GOOGLE_SHEETS_URL);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log('Raw CSV data:', csvText);

        const rows = csvText.split('\n')
          .filter(row => row.trim())
          .map(row => 
            row.split(',').map(cell => 
              cell ? cell.trim().replace(/^"|"$/g, '').trim() : ''
            )
          );

        const headers = rows[0].map(header => header.trim());
        console.log('Headers found:', headers);

        const data = rows.slice(1)
          .filter(row => row.length >= headers.length)
          .map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
              rowData[header] = (row[index] || '').trim();
            });
            return rowData;
          })
          .filter(item => item.mainTitle && item.videoTitle && item.videoUrl);

        console.log('Processed row data:', data);

        const groupedData = data.reduce((acc, item) => {
          const mainTitle = item.mainTitle.trim();
          const videoTitle = item.videoTitle.trim();
          const videoUrl = item.videoUrl.trim();

          if (!mainTitle || !videoTitle || !videoUrl) {
            console.warn('Skipping invalid row:', item);
            return acc;
          }

          if (!acc[mainTitle]) {
            acc[mainTitle] = [];
          }

          acc[mainTitle].push({
            title: videoTitle,
            url: convertToEmbedUrl(videoUrl),
            description: item.description ? item.description.trim() : '',
            duration: parseInt(item.duration) || 10 // Default to 10 minutes if not specified
          });
          return acc;
        }, {});

        console.log('Final grouped data:', groupedData);
        
        if (Object.keys(groupedData).length === 0) {
          throw new Error('No valid course data found. Please check your Google Sheet format.');
        }

        setCourseData(groupedData);
        setError(null);
      } catch (error) {
        console.error('Error loading Google Sheet data:', error);
        setError(error.message);
      }
    };

    loadGoogleSheetData();
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSectionClick = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVideoSelect = (mainTitle, videoTitle, videoUrl) => {
    setSelectedVideo({
      title: videoTitle,
      url: videoUrl,
      description: courseData[mainTitle].find(v => v.title === videoTitle)?.description || ''
    });
  };

  const handleVideoComplete = () => {
    if (selectedVideo) {
      markVideoAsWatched(selectedVideo.url);
    }
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('googleCredential');
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Profile Section */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 1300,
          width: `calc(100% - ${drawerWidth})`,
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            p: 2,
            pr: { xs: 3, sm: 4, md: 5 },
            width: '100%',
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mr: 2,
              color: 'text.secondary',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Welcome, {user?.name}
          </Typography>
          <Paper 
            elevation={0} 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              bgcolor: 'transparent',
              mr: 4,
            }}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={input => setProfileImageInput(input)}
              onChange={handleProfileImageChange}
            />
            <IconButton 
              onClick={handleProfileMenuOpen}
              size="large"
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  transform: 'scale(1.05)',
                },
                width: 48,
                height: 48,
                borderRadius: '50%',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                position: 'relative',
              }}
            >
              <Avatar 
                src={user?.picture || "/sample-profile.jpg"}
                alt={user?.name}
                sx={{ 
                  width: '100%', 
                  height: '100%',
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                }}
              >
                <Edit sx={{ fontSize: 12 }} />
              </Box>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { 
                  minWidth: 200,
                  mt: 1,
                  boxShadow: 3,
                  '& .MuiMenuItem-root': {
                    py: 1.5,
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => navigate('/account-settings')}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Account Settings" />
              </MenuItem>
              <MenuItem onClick={() => profileImageInput?.click()}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Change Photo" />
              </MenuItem>
              <MenuItem onClick={handleSwitchAccount}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Switch Account" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={removeUser} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText primary="Remove Account" />
              </MenuItem>
            </Menu>
          </Paper>
        </Box>
      </Box>

      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'background.default',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 40, height: 40 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              My Course
            </Typography>
          </Box>
        </Box>
        <Divider />

        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Course Navigation */}
        <List sx={{ pt: 0 }}>
          {Object.entries(courseData).map(([mainTitle, videos]) => {
            const watchedCount = videos.filter(video => isVideoWatched(video.url)).length;
            const progress = Math.round((watchedCount / videos.length) * 100);
            
            updateSectionProgress(mainTitle, videos.length, watchedCount);

            return (
              <Box key={mainTitle}>
                <ListItemButton
                  onClick={() => handleSectionClick(mainTitle)}
                  sx={{
                    py: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <ListItemText 
                        primary={mainTitle} 
                        primaryTypographyProps={{
                          fontWeight: openSections[mainTitle] ? 600 : 400,
                          color: 'inherit',
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{ 
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                        }
                      }}
                    />
                  </Box>
                  {openSections[mainTitle] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openSections[mainTitle]} timeout="auto" unmountOnExit>
                  <CourseDetails
                    section={mainTitle}
                    videos={videos}
                    onVideoSelect={handleVideoSelect}
                  />
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, pt: 8, px: 3, pb: 3 }}>
        {selectedVideo ? (
          <Box>
            <Box sx={{ 
              position: 'relative',
              paddingTop: '45%',
              width: '90%',
              maxWidth: '1200px',
              margin: '0 auto',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'black',
              mb: 3,
              boxShadow: 3,
            }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src={selectedVideo.url}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onEnded={handleVideoComplete}
              />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {selectedVideo.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {selectedVideo.description}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: 'calc(100vh - 64px)',
            color: 'text.secondary'
          }}>
            <Typography variant="h6">
              Select a course to start learning
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CoursePage; 