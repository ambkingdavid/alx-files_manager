const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static getStatus(request, response) {
    const message = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    return response.status(200).send(message);
  }

  static async getStats(request, response) {
    const message = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    return response.status(200).send(message);
  }
}

module.exports = AppController;
