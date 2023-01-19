const admin = require('firebase-admin')
const credentials = require('./key.json')

const firebaseConfig = {
    apiKey: "AIzaSyB0ZXsMriQ1sq3OIArvBOqw3m5rX4HN1o4",
    authDomain: "socialmedia-4c55d.firebaseapp.com",
    projectId: "socialmedia-4c55d",
    storageBucket: "socialmedia-4c55d.appspot.com",
    messagingSenderId: "1007355852547",
    appId: "1:1007355852547:web:3bd47a14c06a6e7fb8db36"
  };

  admin.initializeApp({
    credential:admin.credential.cert(credentials)
  });
  
  const db=admin.firestore()
  const User=db.collection('User')
  module.exports=User