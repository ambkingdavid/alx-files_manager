const crypto = require('crypto');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      return response.status(400).send('Missing email');
    }
    if (!password) {
      return response.status(400).send('Missing password');
    }

    const existingUser = await dbClient.client.db().collection('users').findOne({ email });

    console.log(existingUser);

    if (existingUser) {
      return response.status(400).send('Already exist');
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    const newUser = {
      email,
      password: hashedPassword,
    };

    // Insert the new user into the collection
    const result = await dbClient.client.db().collection('users').insertOne(newUser);

    const insertedUser = {
      _id: result.insertedId,
      email: newUser.email,
    };
    return response.status(201).send(insertedUser);
  }
}

module.exports = UsersController;
