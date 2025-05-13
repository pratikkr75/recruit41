const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const snippetRoutes = require('./routes/snippets');
require('dotenv').config(); // For environment variables like DB_URI

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api', snippetRoutes);

// MongoDB Connection
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
  // Start server only after DB is connected
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('DB connection error:', err);
});
