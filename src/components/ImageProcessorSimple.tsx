import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Slider,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Container
} from '@mui/material';
import {
  CloudUpload,
  AutoFixHigh,
  Download
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/$/, '');

const ImageProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [saturationLevel, setSaturationLevel] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/dng': ['.dng'],
      'image/tiff': ['.tiff', '.tif'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setError('');
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
      }
    }
  });

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('level', saturationLevel.toString());

      const response = await axios.post(`${API_BASE_URL}/api/process-dng`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setOriginalImage(response.data.original_image);
        setProcessedImage(response.data.enhanced_image);
        setMetadata(response.data);
      } else {
        setError('Processing failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        DNG Image Processor
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload your DNG image and apply precision saturation enhancement using PrismVI25 algorithms
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
        {/* Upload Section */}
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload DNG Image
            </Typography>
            
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a DNG file here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse
              </Typography>
            </Box>

            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Chip 
                  label={`Selected: ${selectedFile.name}`} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Box>

        {/* Controls Section */}
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Saturation Enhancement Controls
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Enhancement Level: {saturationLevel}/10
              </Typography>
              <Slider
                value={saturationLevel}
                onChange={(e, value) => setSaturationLevel(value as number)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: '1' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                  { value: 7, label: '7' },
                  { value: 10, label: '10' }
                ]}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                * 3-10 levels of saturation enhancement as per project requirements
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<AutoFixHigh />}
              onClick={handleProcessImage}
              disabled={!selectedFile || isProcessing}
              fullWidth
            >
              {isProcessing ? 'Processing...' : 'Apply Enhancement'}
            </Button>

            {isProcessing && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Image Comparison */}
      <Box sx={{ mt: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Image Comparison
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Original
                  </Typography>
                </CardContent>
                {originalImage ? (
                  <CardMedia
                    component="img"
                    image={originalImage}
                    alt="Original"
                    sx={{ height: 300, objectFit: 'contain' }}
                  />
                ) : (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                    <Typography color="text.secondary">Upload and process a DNG image</Typography>
                  </Box>
                )}
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Enhanced (Level {saturationLevel})
                  </Typography>
                </CardContent>
                {processedImage ? (
                  <CardMedia
                    component="img"
                    image={processedImage}
                    alt="Processed"
                    sx={{ height: 300, objectFit: 'contain' }}
                  />
                ) : (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                    <Typography color="text.secondary">Process an image to see results</Typography>
                  </Box>
                )}
              </Card>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Metadata Display */}
      {metadata && (
        <Box sx={{ mt: 3 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Processing Results & Metadata
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Original Saturation
                </Typography>
                <Typography variant="body1">
                  {metadata.original_saturation?.toFixed(4)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Enhanced Saturation
                </Typography>
                <Typography variant="body1" color="success.main">
                  {metadata.enhanced_saturation?.toFixed(4)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Saturation Improvement
                </Typography>
                <Typography variant="body1" color="primary.main">
                  +{metadata.saturation_improvement?.toFixed(4)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Processing Time
                </Typography>
                <Typography variant="body1">
                  {metadata.processing_time?.toFixed(2)}s
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Camera
                </Typography>
                <Typography variant="body1">
                  {metadata.metadata?.['Image Make'] || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Model
                </Typography>
                <Typography variant="body1">
                  {metadata.metadata?.['Image Model'] || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  ISO
                </Typography>
                <Typography variant="body1">
                  {metadata.metadata?.['EXIF ISOSpeedRatings'] || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Image Size
                </Typography>
                <Typography variant="body1">
                  {metadata.metadata?.visible_width}x{metadata.metadata?.visible_height}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                size="small"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = processedImage;
                  link.download = `enhanced_${selectedFile?.name}`;
                  link.click();
                }}
              >
                Download Enhanced Image
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default ImageProcessor;
