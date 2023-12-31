const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

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

  async findUserByEmail(email) {
    const db = this.client.db();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    return user;
  }

  async findUserById(id) {
    const users = this.client.db().collection('users');
    const user = await users.findOne({ _id: new ObjectId(id) });

    return user;
  }

  async findFileByParentId(parentId) {
    const files = this.client.db().collection('files');
    const file = await files.findOne({ _id: new ObjectId(parentId) });

    return file;
  }

  async findFolderByParentId(parentId) {
    const files = this.client.db().collection('files');
    const file = await files.findOne({
      parentId: new ObjectId(parentId),
      type: 'folder',
    });

    return file;
  }

  async addFile(file) {
    const files = this.client.db().collection('files');
    const result = await files.insertOne(file);

    return result.insertedId;
  }

  async getUserFiles(query) {
    const files = this.client.db().collection('files');
    const userFiles = await files.find(query);

    return userFiles.toArray();
  }

  async getPage(query, page, limit) {
    const files = this.client.db().collection('files');
    const pipeline = [
      {
        $match: query,
      },
      {
        $skip: page * limit,
      },
      {
        $limit: limit,
      },
    ];
    const userFiles = await files.aggregate(pipeline).toArray();

    return userFiles;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
