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

    if (parentId && type !== 'folder') {
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
        isPublic: isPublic || false,
        parentId: parentId || 0,
      };
      const fileId = await dbClient.addFile(newFile);
      newFile.id = fileId;
      const file = {
        id: fileId,
        userId,
        name,
        type,
        isPublic,
        parentId,
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
      isPublic: isPublic || false,
      parentId: ObjectId(parentId) || 0,
      localPath,
    };
    const fileId = await dbClient.addFile(newFile);

    const file = {
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };

    return res.status(201).send(file);
  }
}

module.exports = FilesController;
