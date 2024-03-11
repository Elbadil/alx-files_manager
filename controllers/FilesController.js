import { env } from 'process';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const uuidv4 = require('uuid').v4;
const fs = require('fs');
const { ObjectID } = require('mongodb');

class FilesController {
  static async postUpload(req, res) {
    // Defining our DB collections
    const users = dbClient.client.db(dbClient.database).collection('users');
    const files = dbClient.client.db(dbClient.database).collection('files');
    // Retrieving the token's userId value and search for the user
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await users.findOne({ email: 'bob@dylan.com' });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // if a User is found we retrieve the post request's form fields values
    const { name, type, data } = req.body;
    let { parentId, isPublic } = req.body;
    // checking required fields availability and validating the values
    const validFileTypes = ['folder', 'file', 'image'];
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !validFileTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const file = await files.findOne({ _id: new ObjectID(parentId) });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    // we set default values to parentId and isPublic if no values passed
    parentId = parentId || 0;
    isPublic = isPublic || false;
    // inserting the folder in the files collection if type is folder
    if (type === 'folder') {
      const insertFile = await files.insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
      return res.status(201).json({
        id: insertFile.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }
    // Otherwise type is equal to images or file
    const folderPath = env.FOLDER_PATH ? env.FOLDER_PATH : '/tmp/files_manager';
    const fileName = uuidv4();
    const filePath = `${folderPath}/${fileName}`;
    const content = Buffer.from(data, 'base64').toString();
    // Create Folder if not exist and then create and save the content in file
    // Specifying recursive: true so it will only add the missing folders
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        fs.writeFile(filePath, content, 'utf-8', (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    });
    const insertFile = await files.insertOne({
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath,
    });
    return res.status(201).json({
      id: insertFile.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }
}

module.exports = FilesController;
