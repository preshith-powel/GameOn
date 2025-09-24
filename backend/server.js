// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the cors package
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS middleware to allow requests from the frontend
app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb://localhost:27017/gameon-db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use the user routes
app.use('/api/users', userRoutes);

// Basic route to test the server
app.get('/', (req, res) => {
  res.send('Welcome to the GameOn Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
