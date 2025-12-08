const { admin } = require('../config/firebase');

// Middleware to verify Firebase ID token from Authorization header
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.*)$/i);
    if (!match) {
      return res.status(401).json({ message: 'Unauthorized: missing Authorization header' });
    }
    const idToken = match[1];

    const decoded = await admin.auth().verifyIdToken(idToken);
    // attach decoded token to request
    req.auth = { uid: decoded.uid, email: decoded.email, token: idToken };
    return next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
}

module.exports = { verifyFirebaseToken };
