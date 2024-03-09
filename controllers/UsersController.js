import dbClient from '../utils/db';

const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const collection = dbClient.client.db(dbClient.database).collection('users');
    const user = await collection.find({ email }).toArray();
    if (user.length > 0) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const hashPwd = sha1(password);
    const insertUser = await collection.insertOne(
      { email, password: hashPwd },
    );
    const userID = insertUser.insertedId;
    return res.status(201).json({ id: userID, email });
  }
}

module.exports = UsersController;
