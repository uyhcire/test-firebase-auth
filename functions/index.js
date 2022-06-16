const cors = require("cors");
const express = require("express");
const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp({});

const app = express();

// From https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js
//
// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  functions.logger.log("Check if request is authorized with Firebase ID token");

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    functions.logger.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    );
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    functions.logger.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send("Unauthorized");
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    functions.logger.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    functions.logger.error("Error while verifying Firebase ID token:", error);
    res.status(403).send("Unauthorized");
    return;
  }
};

app.use(cors({ origin: true }));
app.use(validateFirebaseIdToken);

// Firebase always uses POST for Callable Functions.
app.post("*", (req, res) => {
  const uid = req.user?.uid;
  if (!uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to create a custom auth token for yourself."
    );
  }

  functions.logger.log("Generating custom auth token for user:", uid);

  admin
    .auth()

    .createCustomToken(uid)
    .then((customAuthToken) => {
      functions.logger.log("Returning custom auth token", customAuthToken);
      res.send({ data: { customAuthToken } });
    });
});

exports.getCustomAuthToken = functions.https.onRequest(app);
