const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      return response.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).send({ error: 'Missing password' });
    }

    const existingUser = await dbClient.client.db().collection('users').findOne({ email });

    if (existingUser) {
      return response.status(400).send({ error: 'Already exist' });
    }
    const hashedPassword = sha1(password);
    const newUser = {
      email,
      password: hashedPassword,
    };

    // Insert the new user into the collection
    const result = await dbClient.client.db().collection('users').insertOne(newUser);

    const insertedUser = {
      id: result.insertedId,
      email: newUser.email,
    };
    return response.status(201).send(insertedUser);
  }

  static async getMe(req, res) {
    const token = req.header['x-token'];
    const key = `auth_${token}`;
    const user = await redisClient.get(key);

    if (!user) {
      return res.status(401).send({ error: 'Unauthorised' });
    }

    const userObj = {
      id: user.insertedId,
      email: user.email,
    };

    return res.send(userObj);
  }
}

module.exports = UsersController;
