const uuidv4 = require('uuid').v4;
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    console.log(authHeader);

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and decode the email and password
    const base64Credentials = authHeader.slice('Basic '.length);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8').split(':');
    console.log(credentials);
    const email = credentials[0];
    const password = credentials[1];

    const hashedPassword = sha1(password);

    const user = await dbClient.findUser(email);

    console.log(user);

    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const value = user._id.toString();

    console.log(`Token: ${token}`);
    console.log(`Key: ${key}`);
    console.log(`Value: ${value}`);

    try {
      await redisClient.setAsync(key, value, 24 * 3600);
    } catch (error) {
      console.log()
    }

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const authToken = req.header['x-token'];

    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.delAsync(authToken);
    return res.status(204);
  }
}

module.exports = AuthController;
