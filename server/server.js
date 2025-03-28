require('dotenv').config(); // Load environment variables first

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require("@azure/storage-blob");
const url = require('url');

const testToken = jwt.sign(
  { userId: "67e2848c1dc2e45490665a46" },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
console.log('Test token for user 67e2848c1dc2e45490665a46:', testToken);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

console.log('Reading MONGODB_URI from process.env:', process.env.MONGODB_URI);
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'user-images';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profile: {
    preferredName: { type: String },
    profilePicture: { type: String },
    dateOfBirth: { type: Date },
    location: { type: String },
    language: { type: String, default: 'English' },
    medicalHistory: [{ condition: String, notes: String }],
    medications: [{ name: String, dosage: String, schedule: String }],
    allergies: [String],
    caregiverContacts: [{ name: String, phone: String, email: String }],
    emergencyContacts: [{ name: String, phone: String }],
    recognizedFaces: [{ name: String, relationship: String, photo: String }],
    accessibility: {
      fontSize: { type: String, default: 'Large' },
      colorScheme: { type: String, default: 'Soothing Pastels' },
      voiceActivation: { type: Boolean, default: true }
    }
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

// Routine Schema
const routineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  routines: [{
    time: { type: String, required: true },
    task: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
});

const Routine = mongoose.model('Routine', routineSchema);

// Journal Schema (Updated with withPeople field)
const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, required: true },
  text: { type: String, required: true },
  withPeople: [{ type: String }], // New field to store names of people in the memory
  mood: { type: String },
  filter: { type: String },
  isFavorited: { type: Boolean, default: false },
  weatherEffect: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Journal = mongoose.model('Journal', journalSchema);

// Story Schema
const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pages: [{ type: String, required: true }],
  mood: { type: String, required: true },
  backdrop: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Story = mongoose.model('Story', storySchema);

// Middleware to verify JWT with additional logging
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Received token in authMiddleware:', token);
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token payload:', decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });
let activePythonProcess = null;

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'newPersonName' && activePythonProcess) {
      console.log(`Received name from frontend: ${data.name}`);
      activePythonProcess.stdin.write(`${data.name}\n`);
    }
  });

  ws.on('close', () => console.log('WebSocket client disconnected'));
});

// User Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, profile } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const user = new User({ name, email, password, profile: profile || {} });
    await user.save();
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    console.error('Error in /api/users/register:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    console.error('Error in /api/users/login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Journal Routes (Updated to include withPeople)
app.post('/api/journal', authMiddleware, async (req, res) => {
  // NEW: Expect imageUrl from frontend after upload to Blob Storage
  const { imageUrl, text, withPeople, mood, filter, isFavorited, weatherEffect } = req.body; 

  // Validate imageUrl instead of image base64 data
  if (!imageUrl || !text) { 
    // Send error if URL or text is missing
    return res.status(400).json({ message: 'Image URL and text are required' }); 
  }

  try { 
    // Create a new Journal document using the Mongoose model
    const journalEntry = new Journal({ 
      userId: req.userId,       // Get userId from the authenticated request (authMiddleware)
      image: imageUrl,          // Store the Blob Storage URL in the 'image' field
      text: text,               // Store the journal text
      withPeople: withPeople || [], // Store array of names, default to empty array
      mood: mood,               // Store the mood string
      filter: filter,           // Store the image filter string
      isFavorited: isFavorited, // Store the favorite status (boolean)
      weatherEffect: weatherEffect // Store the weather effect string
      // createdAt will be added automatically by mongoose schema default
    });

    // Save the new journal entry to Azure Cosmos DB (via Mongoose)
    await journalEntry.save();

    // Log success on the server
    console.log('Journal entry saved successfully with image URL:', imageUrl); 

    // Send a success response back to the client
    res.status(201).json({ message: 'Journal entry saved', journalEntry });

  } catch (error) { 
    // Handle potential errors during database save
    console.error('Error saving journal entry to database:', error);
    res.status(500).json({ message: 'Server error saving journal entry.' });
  }
});

app.get('/api/journal', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching journal entries for user:', req.userId); // Add log
    const journalEntries = await Journal.find({ userId: req.userId }).sort({ createdAt: -1 }).lean(); // Use .lean() for potentially better performance if just reading

    // --- ADD SAS TOKEN GENERATION ---
    const accountKey = extractAccountKey(process.env.AZURE_STORAGE_CONNECTION_STRING);
    if (!accountKey) {
        console.error("Storage account key missing for SAS generation.");
        // Send data without SAS URLs or handle error differently
         return res.status(500).json({ message: 'Server configuration error.' });
    }

    const credential = new StorageSharedKeyCredential(blobServiceClient.accountName, accountKey);
    const sasExpiryDate = new Date();
    sasExpiryDate.setHours(sasExpiryDate.getHours() + 1); // SAS token valid for 1 hour
    const sasPermissions = BlobSASPermissions.parse("r"); // "r" for Read permission

    // Map over entries to add SAS token to each image URL
    const entriesWithSasUrls = journalEntries.map(entry => {
      if (entry.image && entry.image.startsWith('http')) { // Check if it looks like a URL
         try {
            const imageUrl = new URL(entry.image);
            const blobName = imageUrl.pathname.substring(imageUrl.pathname.indexOf(containerName) + containerName.length + 1); // Extract blob name after container

            if (blobName) {
                const sasToken = generateBlobSASQueryParameters({
                  containerName: containerName,
                  blobName: blobName,
                  permissions: sasPermissions,
                  startsOn: new Date(), // Start immediately
                  expiresOn: sasExpiryDate,
                }, credential).toString();
                
                // Return a new object with the SAS token appended
                return { 
                    ...entry, 
                    image: `${entry.image}?${sasToken}` // Append SAS token as query parameter
                };
            }
         } catch (e) {
             console.error(`Error processing image URL for SAS: ${entry.image}`, e);
             // Return entry as-is if URL parsing or SAS generation fails
             return entry; 
         }
      }
      // Return entry as-is if image URL is missing or invalid
      return entry; 
    });
    // --- END SAS TOKEN GENERATION ---

    console.log('Sending', entriesWithSasUrls.length, 'entries with SAS URLs (if applicable)'); // Add log
    res.json(entriesWithSasUrls); // Send the modified array

  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Server error fetching journal entries.' });
  }
}); 

app.get('/api/journal/texts', authMiddleware, async (req, res) => {
  console.log('Request received at /api/journal/texts');
  try {
    console.log('User ID from token in /api/journal/texts:', req.userId);
    
    // Find entries for the specific user, select only 'text', sort, and convert to plain objects
    const journalTexts = await Journal.find(
      { userId: new mongoose.Types.ObjectId(req.userId) },
      'text' // Projection: only select the 'text' field (+ _id by default)
    ).sort({ createdAt: -1 }).lean(); // .lean() for performance if only reading data

    // Extract just the text strings into an array
    const texts = journalTexts.map(entry => entry.text);
    console.log('Fetched texts for user:', texts);

    res.json({ texts });
  } catch (error) {
    console.error('Error fetching journal texts:', error);
    res.status(500).json({ message: 'Server error fetching journal texts.' }); // Updated error message
  }
});

app.get('/api/storage/sas', authMiddleware, async (req, res) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const accountKey = extractAccountKey(process.env.AZURE_STORAGE_CONNECTION_STRING);

    if (!accountKey) {
        console.error("Azure Storage Account Key could not be extracted from connection string.");
        return res.status(500).json({ message: "Server configuration error: Storage key missing." });
    }

    // Define permissions and expiry for the SAS token
    const permissions = BlobSASPermissions.parse("racw"); // Read, Add, Create, Write
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 5); // SAS token valid for 5 minutes

    // Generate a unique blob name 
    const fileExtension = req.query.fileType === 'image/png' ? 'png' : 'jpg'; // Get file type hint
    const blobName = `${req.userId}-${Date.now()}.${fileExtension}`; 

    // Generate SAS query parameters
    const sasToken = generateBlobSASQueryParameters({
      containerName: containerName,
      blobName: blobName,
      permissions: permissions,
      startsOn: new Date(), // Use current time for start
      expiresOn: expiryDate,
      contentType: req.query.fileType || 'image/jpeg', // Use hinted content type or default
    }, 
     new StorageSharedKeyCredential(blobServiceClient.accountName, accountKey)
    ).toString();

    // Construct the full SAS URL for the specific blob
    const blobClient = containerClient.getBlobClient(blobName);
    const sasUrl = `${blobClient.url}?${sasToken}`;

    console.log(`Generated SAS URL for blob ${blobName}`); // Add log
    res.json({ sasUrl: sasUrl, blobName: blobName, storageAccountUrl: containerClient.url }); // Send back base URL too

  } catch (error) {
    console.error("Error generating SAS token:", error);
    res.status(500).json({ message: "Could not generate upload URL." });
  }
});

// Profile Routes
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.profile || {});
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.profile = { ...user.profile, ...updates };
    await user.save();
    res.json({ message: 'Profile updated successfully', profile: user.profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/profile/insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const journalCount = await Journal.countDocuments({ userId });
    const favoriteCount = await Journal.countDocuments({ userId, isFavorited: true });
    const moodStats = await Journal.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$mood', count: { $sum: 1 } } }
    ]);
    const insights = {
      totalMemories: journalCount,
      favoriteMemories: favoriteCount,
      moodBreakdown: moodStats.reduce((acc, item) => {
        acc[item._id || 'No Mood'] = item.count;
        return acc;
      }, {})
    };
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Routine Routes
app.get('/api/routines/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const routine = await Routine.findOne({ userId: req.userId, date });
    res.json(routine ? routine.routines : []);
  } catch (error) {
    console.error('Error fetching routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/routines/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const { routines } = req.body;
    let routineDoc = await Routine.findOne({ userId: req.userId, date });
    if (routineDoc) {
      routineDoc.routines = routines;
      await routineDoc.save();
    } else {
      routineDoc = new Routine({ userId: req.userId, date, routines });
      await routineDoc.save();
    }
    res.status(201).json({ message: 'Routines saved successfully', routines: routineDoc.routines });
  } catch (error) {
    console.error('Error saving routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/routines', authMiddleware, async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.userId }).select('date routines');
    const routinesMap = routines.reduce((acc, curr) => {
      acc[curr.date] = curr.routines;
      return acc;
    }, {});
    res.json(routinesMap);
  } catch (error) {
    console.error('Error fetching all routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Story Routes
app.get('/api/stories', authMiddleware, async (req, res) => {
  try {
    const stories = await Story.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/stories', authMiddleware, async (req, res) => {
  try {
    const { pages, mood, backdrop } = req.body;
    if (!pages || !mood || !backdrop) {
      return res.status(400).json({ message: 'Pages, mood, and backdrop are required' });
    }
    const story = new Story({ userId: req.userId, pages, mood, backdrop });
    await story.save();
    res.status(201).json({ message: 'Story saved successfully', story });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const StoryGenerator = require('./storyteller').StoryGenerator;

app.get('/api/story/:mood', authMiddleware, async (req, res) => {
  try {
    const { mood } = req.params;
    const token = req.header('Authorization')?.replace('Bearer ', ''); 
    const generator = new StoryGenerator(token); 
    const story = await generator.generate(mood);
    res.json({ story });
  } catch (error) {
    console.error("Error generating story:", error);
    res.status(500).json({ message: "Failed to generate story" });
  }
});

// Face Recognition Routes
app.post('/api/face-recognition/capture', authMiddleware, (req, res) => {
  const pythonPath = path.join(__dirname, '..', 'ai', 'Face_Recognition', 'Face_Rec.py');
  const pythonCwd = path.join(__dirname, '..', 'ai', 'Face_Recognition');
  const userFramePath = path.join(pythonCwd, `captured_frame_${req.userId}.jpg`);
  const originalFramePath = path.join(pythonCwd, 'captured_frame.jpg');

  const pythonCommand = process.platform === 'win32' ? '"C:\\Program Files\\Python312\\python.exe"' : 'python3';
  activePythonProcess = spawn(pythonCommand, [pythonPath], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    cwd: pythonCwd,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  activePythonProcess.stdin.write('4\n');

  let responseSent = false;
  let resultData = null;

  activePythonProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();
    console.log('Python stdout:', dataStr);
    const lines = dataStr.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result.status === 'frame_captured') {
          fs.renameSync(originalFramePath, userFramePath);
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'frameCaptured', path: userFramePath }));
            }
          });
          activePythonProcess.stdin.write(`${userFramePath}\n`);
        } else if (result.status === 'new_person_detected') {
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'newPersonPrompt', subImageIndex: result.sub_image_index }));
            }
          });
        } else if (result.status === 'success') {
          resultData = result;
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'faceRecognition', result: result }));
            }
          });
        } else if (result.status === 'error') {
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ error: result.message });
          }
        }
      } catch (e) {
        console.log('Non-JSON Python output:', line);
      }
    }
  });

  activePythonProcess.stderr.on('data', (data) => {
    console.error('Python stderr:', data.toString());
  });

  activePythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    if (!responseSent) {
      responseSent = true;
      if (code === 0 && resultData) {
        res.status(200).json({ message: 'Face recognition completed', result: resultData });
      } else {
        res.status(500).json({ error: `Python process failed with code ${code}` });
      }
    }
    activePythonProcess = null;
  });

  setTimeout(() => {
    if (!responseSent) {
      if (activePythonProcess) activePythonProcess.kill();
      responseSent = true;
      res.status(504).json({ error: 'Face recognition timed out' });
    }
  }, 120000);
});

app.get('/api/captured-frame', authMiddleware, (req, res) => {
  const framePath = path.join(__dirname, '..', 'ai', 'Face_Recognition', `captured_frame_${req.userId}.jpg`);
  if (fs.existsSync(framePath)) res.sendFile(framePath);
  else res.status(404).json({ error: 'Frame not found' });
});

app.get('/api/weather', authMiddleware, async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY || 'c44cebc35c234334be13aec7ebf742d1';
  if (!apiKey) {
    return res.status(500).json({ message: 'Weather API key not configured' });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const weatherData = {
      condition: response.data.weather[0].main.toLowerCase(),
      temperature: `${Math.round(response.data.main.temp)}°F`,
      description: response.data.weather[0].description,
    };
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
});

function extractAccountKey(connectionString) {
  if (!connectionString) return null; // Handle case where env var might be missing
  const parts = connectionString.split(';');
  const keyPart = parts.find(part => part.trim().startsWith('AccountKey='));
  return keyPart ? keyPart.trim().substring('AccountKey='.length) : null;
}

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});