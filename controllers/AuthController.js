const uuidv4 = require('uuid').v4;
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Extract and decode the email and password
    try {
      const base64Credentials = authHeader.slice('Basic '.length);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8').split(':');
      const email = credentials[0];
      const password = credentials[1];
      const hashedPassword = sha1(password);

      const user = await dbClient.findUserByEmail(email);

      if (!user || user.password !== hashedPassword) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      const value = user._id.toString();

      await redisClient.set(key, value, 24 * 3600);

      return res.status(200).send({ token });
    } catch (error) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
  }

  static async getDisconnect(req, res) {
    const authToken = req.headers['x-token'];

    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${authToken}`;

    const result = await redisClient.del(key);

    if (!result) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(204).send();
  }
}

module.exports = AuthController;
