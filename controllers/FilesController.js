const fs = require('fs');
const uuidv4 = require('uuid').v4;
const path = require('path');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      console.log('no user id');
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await dbClient.findUserById(userId);

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const {
      name,
      type,
      parentId,
      isPublic,
      data,
    } = req.body;

    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }

    if (parentId) {
      const parent = await dbClient.findFileByParentId(parentId);
      if (!parent) {
        return res.status(400).send({ error: 'Parent not found' });
      }

      if (parent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      const newFile = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic: isPublic !== undefined ? isPublic : false,
        parentId: parentId ? ObjectId(parentId) : 0,
      };
      const fileId = await dbClient.addFile(newFile);
      newFile.id = fileId;
      const file = {
        id: fileId,
        userId,
        name,
        type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId,
      };

      return res.status(201).send(file);
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);

    await fs.promises.mkdir(folderPath, { recursive: true })
      .then(() => {
        const buffer = Buffer.from(data, 'base64');
        return fs.promises.writeFile(localPath, buffer);
      })
      .catch((err) => {
        console.log(err);
      });

    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic: isPublic !== undefined ? isPublic : false,
      parentId: parentId ? ObjectId(parentId) : 0,
      localPath,
    };
    const fileId = await dbClient.addFile(newFile);

    const file = {
      id: fileId,
      userId,
      name,
      type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId,
      localPath,
    };

    return res.status(201).send(file);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = ObjectId(req.params.id);
    const file = await dbClient.getUserFiles({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });
    if (!file) {
      return res.status(404).send({ error: 'Not Found' });
    }

    return res.send(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const limit = 20;

    if (parentId !== 0) {
      const folder = await dbClient.findFileByParentId(parentId);
      if (!folder) {
        return res.send([]);
      }
      const files = await dbClient.getPage({
        userId: ObjectId(userId),
        parentId: ObjectId(parentId),
      }, page, limit);
      return res.send(files);
    }
    const files = await dbClient.getPage({ userId: ObjectId(userId) }, page, limit);
    return res.send(files);
  }
}

module.exports = FilesController;
