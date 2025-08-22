const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Agent = require('../models/Agent');
const List = require('../models/List');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLSX, and XLS files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   POST /api/lists/upload
// @desc    Upload CSV/XLSX file and distribute among agents
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Get all agents
    const agents = await Agent.find();
    if (agents.length === 0) {
      return res.status(400).json({ message: 'No agents found. Please create agents first.' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    // Parse file based on extension
    if (fileExtension === '.csv') {
      // Parse CSV
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            // Validate required fields
            if (!row.FirstName || !row.Phone) {
              reject(new Error('CSV must contain FirstName and Phone columns'));
              return;
            }
            results.push({
              firstName: row.FirstName.trim(),
              phone: row.Phone.trim(),
              notes: row.Notes ? row.Notes.trim() : ''
            });
          })
          .on('end', () => resolve())
          .on('error', reject);
      });
      data = results;
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      data = jsonData.map(row => ({
        firstName: row.FirstName ? row.FirstName.toString().trim() : '',
        phone: row.Phone ? row.Phone.toString().trim() : '',
        notes: row.Notes ? row.Notes.toString().trim() : ''
      })).filter(item => item.firstName && item.phone);
    }

    if (data.length === 0) {
      return res.status(400).json({ message: 'No valid data found in the file' });
    }

    // Distribute data among agents
    const distributedData = [];
    const agentsCount = agents.length;
    
    data.forEach((item, index) => {
      const agentIndex = index % agentsCount;
      distributedData.push({
        ...item,
        agentId: agents[agentIndex]._id,
        originalFileName: req.file.originalname
      });
    });

    // Save to database
    const savedLists = await List.insertMany(distributedData);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Get distribution summary
    const distributionSummary = agents.map(agent => {
      const agentLists = savedLists.filter(list => list.agentId.toString() === agent._id.toString());
      return {
        agentId: agent._id,
        agentName: agent.name,
        agentEmail: agent.email,
        count: agentLists.length,
        lists: agentLists
      };
    });

    res.json({
      message: 'File uploaded and distributed successfully',
      totalItems: data.length,
      agentsCount: agentsCount,
      distribution: distributionSummary
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: error.message || 'Error processing file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/lists
// @desc    Get all distributed lists
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const lists = await List.find()
      .populate('agentId', 'name email')
      .sort({ uploadedAt: -1 });
    
    res.json(lists);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lists/agent/:agentId
// @desc    Get lists for a specific agent
// @access  Private
router.get('/agent/:agentId', auth, async (req, res) => {
  try {
    const lists = await List.find({ agentId: req.params.agentId })
      .populate('agentId', 'name email')
      .sort({ uploadedAt: -1 });
    
    res.json(lists);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/lists/summary
// @desc    Get distribution summary
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const agents = await Agent.find();
    const summary = await Promise.all(
      agents.map(async (agent) => {
        const count = await List.countDocuments({ agentId: agent._id });
        return {
          agentId: agent._id,
          agentName: agent.name,
          agentEmail: agent.email,
          count
        };
      })
    );
    
    const totalCount = await List.countDocuments();
    
    res.json({
      totalItems: totalCount,
      agentsCount: agents.length,
      distribution: summary
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/lists/:id
// @desc    Delete a specific list item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id);
    
    if (!list) {
      return res.status(404).json({ message: 'List item not found' });
    }

    res.json({ message: 'List item removed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/lists/file/:filename
// @desc    Delete all items from a specific file
// @access  Private
router.delete('/file/:filename', auth, async (req, res) => {
  try {
    const result = await List.deleteMany({ 
      originalFileName: decodeURIComponent(req.params.filename) 
    });
    
    res.json({ 
      message: `${result.deletedCount} items removed successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
