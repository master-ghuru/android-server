const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;
const apiKey = process.env.apiKey;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const alphaUserSchema = new mongoose.Schema({
  user: {
    address: String,
    inviter: String,
    hash: String,
    numInvites: Number,
  },
  creationTime: Number,
});

const AlphaUser = mongoose.model('AlphaUser', alphaUserSchema);

const tokenSchema = new mongoose.Schema({
  pushToken: String,
  creationTime: Number,
});

const Token = mongoose.model('PushToken', tokenSchema);

const uniswapSchema = new mongoose.Schema({
  heading: String,
  description: String,
  img: String,
  links: [{
    name: String,
    url: String,
  }],
  creationTime: {
    type: Number,
    default: new Date().getTime(),
  },
});

const UniswapData = mongoose.model('UniswapData', uniswapSchema);

const binanceSchema = new mongoose.Schema({
  heading: String,
  description: String,
  img: String,
  links: [{
    name: String,
    url: String,
  }],
  creationTime: {
    type: Number,
    default: new Date().getTime(),
  },
});

const BinanceData = mongoose.model('BinanceData', binanceSchema);

const newsSchema = new mongoose.Schema({
  heading: String,
  description: String,
  img: String,
  links: [{
    name: String,
    url: String,
  }],
  creationTime: {
    type: Number,
    default: new Date().getTime(),
  },
});

const NewsData = mongoose.model('NewsData', newsSchema);

const degenSchema = new mongoose.Schema({
  heading: String,
  description: String,
  img: String,
  links: [{
    name: String,
    url: String,
  }],
  creationTime: {
    type: Number,
    default: new Date().getTime(),
  },
});

const DegenData = mongoose.model('DegenData', degenSchema);

const removeOldData = async () => {
  const currentTime = new Date().getTime();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const tenDaysAgo = currentTime - 10 * 24 * 60 * 60 * 1000;

  await AlphaUser.deleteMany({ creationTime: { $lt: thirtyDaysAgo } });
  await Token.deleteMany({ creationTime: { $lt: thirtyDaysAgo } });
  await UniswapData.deleteMany({ creationTime: { $lt: tenDaysAgo } });
  await BinanceData.deleteMany({ creationTime: { $lt: tenDaysAgo } });
  await NewsData.deleteMany({ creationTime: { $lt: tenDaysAgo } });
  await DegenData.deleteMany({ creationTime: { $lt: tenDaysAgo } });

  setTimeout(removeOldData, 24 * 60 * 60 * 1000);
};

removeOldData();

// Middleware to check API key
const apiKeyMiddleware = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];

  if (providedKey === apiKey) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/alpha-users', async (req, res) => {
  const { user, inviter, hash } = req.body;

  const existingUser = await AlphaUser.findOne({ 'user.address': inviter });

  if (existingUser) {
    existingUser.user.numInvites += 1;
    await existingUser.save();
  }

  const newUser = new AlphaUser({
    user: {
      address: user,
      inviter,
      hash,
      numInvites: 0,
    },
    creationTime: new Date().getTime(),
  });

  await newUser.save();

  console.log('Data stored:', newUser);

  res.json({ success: true });
});

app.get('/alpha-users', async (req, res) => {
  const users = await AlphaUser.find();
  res.json(users);
});

app.post('/token', async (req, res) => {
  const { pushToken } = req.body;

  const newToken = new Token({
    pushToken,
    creationTime: new Date().getTime(),
  });

  await newToken.save();

  console.log('Data stored:', newToken);

  res.json({ success: true });
});

app.get('/token', async (req, res) => {
  const users = await Token.find();
  res.json(users);
});

app.post('/uniswap', apiKeyMiddleware, async (req, res) => {
  const newMessage = req.body;
  newMessage.creationTime = new Date().getTime();
  newMessage.endpoint = '/uniswap'; // Add endpoint information

  const uniswapData = new UniswapData(newMessage);
  await uniswapData.save();

  console.log('Data stored:', newMessage);
  // Get push tokens from /token endpoint
  try {
    const pushTokens = await Token.find().distinct('pushToken');

    // Send push notifications to users with push tokens
    await sendPushNotifications(pushTokens, newMessage);

    res.json(newMessage);
  } catch (error) {
    console.error('Error fetching or sending push tokens:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/uniswap', async (req, res) => {
  const uniswapData = await UniswapData.find();
  res.json(uniswapData);
});

app.post('/binance', apiKeyMiddleware, async (req, res) => {
  const newMessage = req.body;
  newMessage.creationTime = new Date().getTime();
  newMessage.endpoint = '/binance'; // Add endpoint information

  const binanceData = new BinanceData(newMessage);
  await binanceData.save();

  console.log('Data stored:', newMessage);
  // Get push tokens from /token endpoint
  try {
    const pushTokens = await Token.find().distinct('pushToken');

    // Send push notifications to users with push tokens
    await sendPushNotifications(pushTokens, newMessage);

    res.json(newMessage);
  } catch (error) {
    console.error('Error fetching or sending push tokens:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/binance', async (req, res) => {
  const binanceData = await BinanceData.find();
  res.json(binanceData);
});

app.post('/news', apiKeyMiddleware, async (req, res) => {
  const newMessage = req.body;
  newMessage.creationTime = new Date().getTime();
  newMessage.endpoint = '/news'; // Add endpoint information

  const newsData = new NewsData(newMessage);
  await newsData.save();

  console.log('Data stored:', newMessage);
  // Get push tokens from /token endpoint
  try {
    const pushTokens = await Token.find().distinct('pushToken');

    // Send push notifications to users with push tokens
    await sendPushNotifications(pushTokens, newMessage);

    res.json(newMessage);
  } catch (error) {
    console.error('Error fetching or sending push tokens:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/news', async (req, res) => {
  const newsData = await NewsData.find();
  res.json(newsData);
});

app.post('/degen', apiKeyMiddleware, async (req, res) => {
  const newMessage = req.body;
  newMessage.creationTime = new Date().getTime();
  newMessage.endpoint = '/degen'; // Add endpoint information

  const degenData = new DegenData(newMessage);
  await degenData.save();

  console.log('Data stored:', newMessage);
  // Get push tokens from /token endpoint
  try {
    const pushTokens = await Token.find().distinct('pushToken');

    // Send push notifications to users with push tokens
    await sendPushNotifications(pushTokens, newMessage);

    res.json(newMessage);
  } catch (error) {
    console.error('Error fetching or sending push tokens:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/degen', async (req, res) => {
  const degenData = await DegenData.find();
  res.json(degenData);
});

// Function to send push notifications
const sendPushNotifications = async (pushTokens, newMessage) => {
  // Destructure the newMessage object
  const { heading, description } = newMessage;

  // Construct the Expo push notification messages
  const messages = pushTokens.map(pushToken => ({
    to: pushToken,
    sound: 'default',
    title: heading || 'Howdy',
    body: description || 'You have a new notification!',
    data: {
      heading,
      description,
    },
  }));

  // Send the push notifications using Expo's push notification service
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', messages);
    console.log('Push notifications sent successfully');
  } catch (error) {
    console.error('Error sending push notifications:', error);
    throw error;
  }
};

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});