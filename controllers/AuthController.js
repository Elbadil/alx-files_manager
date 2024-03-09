/* global atob */
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');
const uuidv4 = require('uuid').v4;

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    const authCode = authorization.slice(6);
    const authCodeDecode = atob(authCode).split(':', 2);
    const email = authCodeDecode[0];
    const password = authCodeDecode[1];
    const hashPwd = sha1(password);
    const dbCollection = dbClient.client
      .db(dbClient.database)
      .collection('users');
    const user = await dbCollection.findOne({ email, password: hashPwd });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    try {
      await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    } catch (err) {
      console.error(err);
    }
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const userToken = await redisClient.get(`auth_${token}`);
    if (!userToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

module.exports = AuthController;
