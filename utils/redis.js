const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    try {
      this.client.ping();
      return true;
    } catch (err) {
      return false;
    }
  }

  async get(key) {
    return this.getAsync(key);
  }

  async set(key, value, duration) {
    return this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    return this.delAsync(key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;