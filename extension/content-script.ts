import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";

import { firebaseConfig } from "./config";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const _logIn = (customAuthToken) => {
  signInWithCustomToken(auth, customAuthToken);
};

// Check for a custom auth token when the content script first loads
chrome.storage.sync.get(["customAuthToken"], (result) => {
  if (result.customAuthToken) {
    _logIn(result.customAuthToken);
  }

  // The user could log in or change accounts at any point, so we need to always be listening for new custom auth tokens.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && "customAuthToken" in changes) {
      const customAuthToken = changes.customAuthToken.newValue;
      if (customAuthToken) {
        _logIn(customAuthToken);
      }
    }
  });
});

auth.onAuthStateChanged((user) => {
  // Can use this callback to check whether we are being logged in as the right user
});
