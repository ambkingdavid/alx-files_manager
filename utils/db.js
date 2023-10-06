const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${host}:${port}/${database}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.connected = false; // Initialize the connected status as false
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      this.connected = false;
    }
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const db = this.client.db();
    const users = db.collection('users');
    const count = await users.countDocuments();

    return count;
  }

  async nbFiles() {
    const db = this.client.db();
    const files = db.collection('files');
    const count = await files.countDocuments();

    return count;
  }

  async findUser(email) {
    const db = this.client.db();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    return user;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
