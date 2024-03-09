import dbClient from '../utils/db';

class UsersController {
  static async postNew (req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const collection = dbClient.db(dbClient.database).collection('users');
    const user = await collection.find({email: email});
  }
}

module.exports = UsersController;
