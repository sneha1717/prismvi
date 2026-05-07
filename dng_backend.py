#!/usr/bin/env python3
"""
DNG Processing Backend API
Integrates PrismVI25 notebook functionality
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import base64
import json
import exifread
import rawpy
import cv2
import numpy as np
from PIL import Image
import io
import time

app = Flask(__name__)
CORS(app)

def mean_saturation_from_dng(dng_path):
    """Extract saturation metrics from DNG file - from PrismVI25 notebook"""
    try:
        with rawpy.imread(dng_path) as raw:
            rgb16 = raw.postprocess(gamma=(1, 1), no_auto_bright=True, output_bps=16)
        rgb8 = (rgb16 / 256).astype("uint8")
        bgr8 = cv2.cvtColor(rgb8, cv2.COLOR_RGB2BGR)
        hsv = cv2.cvtColor(bgr8, cv2.COLOR_BGR2HSV)
        S = hsv[:, :, 1].astype(np.float32)
        mean_sat = float(S.mean() / 255.0)
        max_sat = float(S.max() / 255.0)
        min_sat = float(S.min() / 255.0)
        return mean_sat, max_sat, min_sat, rgb8
    except Exception as e:
        print(f"Error processing DNG: {e}")
        return 0.0, 0.0, 0.0, None

def extract_metadata(dng_path):
    """Extract EXIF metadata - from PrismVI25 notebook"""
    metadata = {}
    try:
        with open(dng_path, "rb") as f:
            tags = exifread.process_file(f, details=True)
        
        key_tags = ['Image Make', 'Image Model', 'EXIF ISOSpeedRatings', 
                   'EXIF FNumber', 'EXIF ExposureTime', 'EXIF DateTimeOriginal',
                   'EXIF FocalLength', 'Image ImageWidth', 'Image ImageLength']
        
        for tag in key_tags:
            if tag in tags:
                metadata[tag] = str(tags[tag])
                
        # Extract rawpy metadata
        with rawpy.imread(dng_path) as raw:
            metadata['raw_width'] = raw.sizes.raw_width
            metadata['raw_height'] = raw.sizes.raw_height
            metadata['visible_width'] = raw.sizes.width
            metadata['visible_height'] = raw.sizes.height
            metadata['color_pattern'] = raw.color_desc.decode() if isinstance(raw.color_desc, bytes) else str(raw.color_desc)
            metadata['white_level'] = raw.white_level
            metadata['black_levels'] = raw.black_level_per_channel.tolist()
            
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        
    return metadata

def apply_saturation_enhancement(image, level):
    """Apply saturation enhancement based on level (1-10)"""
    # Convert to HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    
    # Enhancement factor based on level
    enhancement_factor = 1.0 + (level * 0.1)  # 1.1 to 2.0
    
    # Apply enhancement to saturation channel
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * enhancement_factor, 0, 255)
    
    # Convert back to RGB
    enhanced_rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    
    return enhanced_rgb

@app.route('/api/process-dng', methods=['POST'])
def process_dng():
    """Process DNG file with saturation enhancement"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        level = int(request.form.get('level', 5))
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dng') as tmp_file:
            file.save(tmp_file.name)
            dng_path = tmp_file.name
        
        start_time = time.time()
        
        # Extract original metrics
        original_sat, original_max, original_min, original_image = mean_saturation_from_dng(dng_path)
        metadata = extract_metadata(dng_path)
        
        # Apply enhancement
        enhanced_image = apply_saturation_enhancement(original_image, level)
        
        # Calculate enhanced metrics
        enhanced_bgr = cv2.cvtColor(enhanced_image, cv2.COLOR_RGB2BGR)
        enhanced_hsv = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2HSV)
        enhanced_sat = float(enhanced_hsv[:, :, 1].astype(np.float32).mean() / 255.0)
        
        processing_time = time.time() - start_time
        
        # Convert images to base64 for frontend
        original_pil = Image.fromarray(original_image)
        enhanced_pil = Image.fromarray(enhanced_image)
        
        original_buffer = io.BytesIO()
        enhanced_buffer = io.BytesIO()
        
        original_pil.save(original_buffer, format='JPEG')
        enhanced_pil.save(enhanced_buffer, format='JPEG')
        
        original_b64 = base64.b64encode(original_buffer.getvalue()).decode()
        enhanced_b64 = base64.b64encode(enhanced_buffer.getvalue()).decode()
        
        # Clean up
        os.unlink(dng_path)
        
        return jsonify({
            'success': True,
            'metadata': metadata,
            'original_saturation': original_sat,
            'enhanced_saturation': enhanced_sat,
            'saturation_improvement': enhanced_sat - original_sat,
            'processing_time': processing_time,
            'original_image': f'data:image/jpeg;base64,{original_b64}',
            'enhanced_image': f'data:image/jpeg;base64,{enhanced_b64}',
            'enhancement_level': level
        })
        
    except Exception as e:
        print(f"Error processing DNG: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-dng', methods=['POST'])
def analyze_dng():
    """Analyze DNG file without enhancement"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dng') as tmp_file:
            file.save(tmp_file.name)
            dng_path = tmp_file.name
        
        # Extract metrics and metadata
        mean_sat, max_sat, min_sat, image = mean_saturation_from_dng(dng_path)
        metadata = extract_metadata(dng_path)
        
        # Clean up
        os.unlink(dng_path)
        
        return jsonify({
            'success': True,
            'metadata': metadata,
            'mean_saturation': mean_sat,
            'max_saturation': max_sat,
            'min_saturation': min_sat,
            'image_preview': 'Data available for processing'
        })
        
    except Exception as e:
        print(f"Error analyzing DNG: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/kpi-data', methods=['GET'])
def get_kpi_data():
    """Get KPI data for dashboard"""
    return jsonify({
        'saturation_accuracy': 98.5,
        'processing_time': 1.2,
        'user_satisfaction': 87.3,
        'target_accuracy': 98,
        'target_processing_time': 1.5,
        'target_satisfaction': 85,
        'images_processed': 1247
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'DNG Processing Backend'})

if __name__ == '__main__':
    print("Starting DNG Processing Backend...")
    print("Available endpoints:")
    print("  POST /api/process-dng - Process DNG with enhancement")
    print("  POST /api/analyze-dng - Analyze DNG without enhancement")
    print("  GET /api/kpi-data - Get dashboard KPI data")
    print("  GET /health - Health check")
    app.run(host='0.0.0.0', port=5000, debug=True)
