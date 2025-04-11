const express = require('express');
const cors = require('cors');
const app = express();
const admin = require('firebase-admin')
const credentials = require('./key.json')

// Configuración de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de express-fileupload
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const firebaseConfig = {
    apiKey: "AIzaSyB0ZXsMriQ1sq3OIArvBOqw3m5rX4HN1o4",
    authDomain: "socialmedia-4c55d.firebaseapp.com",
    projectId: "socialmedia-4c55d",
    storageBucket: "socialmedia-4c55d.appspot.com",
    messagingSenderId: "1007355852547",
    appId: "1:1007355852547:web:3bd47a14c06a6e7fb8db36"
};

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const db = admin.firestore()
const User = db.collection('User')
const Post = db.collection('Post')
const RelationShip = db.collection('RelationShip')
const Messages = db.collection('Messages')

// Exportar la app configurada
module.exports = { User, Post, RelationShip, Messages }