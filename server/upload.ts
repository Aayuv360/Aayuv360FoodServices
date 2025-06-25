import multer from 'multer';
import sharp from 'sharp';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Request, Response } from 'express';

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Process and save image to MongoDB GridFS
export const processImage = async (buffer: Buffer, filename: string): Promise<string> => {
  try {
    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Get MongoDB connection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not available');
    }

    // Create GridFS bucket
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    // Create a unique filename
    const processedFilename = `${Date.now()}-${filename.replace(/\s+/g, '-').toLowerCase()}`;

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(processedFilename, {
      metadata: {
        originalName: filename,
        uploadDate: new Date(),
        contentType: 'image/jpeg'
      }
    });

    return new Promise((resolve, reject) => {
      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(new Error('Failed to upload image to database'));
      });

      uploadStream.on('finish', () => {
        console.log(`Image uploaded to MongoDB with ID: ${uploadStream.id}`);
        resolve(`/api/images/${uploadStream.id}`);
      });

      uploadStream.end(processedBuffer);
    });
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// Delete image from MongoDB GridFS
export const deleteImage = async (imagePath: string): Promise<void> => {
  try {
    if (imagePath && imagePath.startsWith('/api/images/')) {
      const imageId = imagePath.split('/api/images/')[1];
      
      const db = mongoose.connection.db;
      if (!db) {
        console.warn('MongoDB connection not available for image deletion');
        return;
      }

      const bucket = new GridFSBucket(db, { bucketName: 'images' });
      
      try {
        await bucket.delete(new ObjectId(imageId));
        console.log(`Deleted image from MongoDB: ${imageId}`);
      } catch (deleteError) {
        console.warn(`Image not found in MongoDB for deletion: ${imageId}`);
      }
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

// Serve image from MongoDB GridFS
export const serveImageFromMongoDB = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageId = req.params.id;
    
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    try {
      const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));

      downloadStream.on('error', (error) => {
        console.error('GridFS download error:', error);
        res.status(404).json({ error: 'Image not found' });
      });

      // Set appropriate headers
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      });

      downloadStream.pipe(res);
    } catch (error) {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
};