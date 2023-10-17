const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const util = require('util');
const { DateTime } = require('luxon');

const app = express();
const port = 4000;

const con = mysql.createConnection({
  host: 'db_host',
  user: 'db_user',
  password: 'db_password',
  database: 'db_name',
});

con.connect(err => {
  if (err) {
    console.error('Database connection failed', err);
    return;
  }
  console.log('Connected to the database');
});

const queryAsync = util.promisify(con.query).bind(con);

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './upload'); // Change to your desired upload directory
  },
  filename: (req, file, cb) => {
    const time = DateTime.now();
    const filename = time + path.extname(file.originalname);
    req.filename = filename;
    cb(null, filename);
  },
});

const upload = multer({ storage });

app.post('/upload_image', upload.single('my_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filename = req.filename;

    await queryAsync('INSERT INTO my_table(image) VALUES (?)', [filename]);
    console.log('Uploaded image successfully');
    res.status(200).json({ message: 'Image uploaded successfully' });
  } catch (err) {
    console.error('Error uploading image', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Client Side (React Native)
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

function App() {
  const [image, setImage] = useState({
    image_uri: '',
    image_name: '',
    image_type: '',
  });

  const selectImage = async () => {
    const selection = await launchImageLibrary({ mediaType: 'photo' });
    if (selection.didCancel) {
      console.log('Image selection cancelled');
    } else if (selection.error) {
      console.error('Image selection error', selection.error);
    } else {
      const mainImage = selection.assets[0];
      setImage({
        ...image,
        image_uri: mainImage.uri,
        image_name: mainImage.fileName,
        image_type: mainImage.type,
      });
    }
  };

  const uploadImage = () => {
    if (!image.image_uri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    const formData = new FormData();
    formData.append('my_image', {
      uri: image.image_uri,
      name: image.image_name,
      type: image.image_type,
    });

    fetch('http://your_server_ip:4000/upload_image', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(response => {
        if (response.ok) {
          Alert.alert('Success', 'Image uploaded successfully');
        } else {
          Alert.alert('Error', 'Failed to upload image');
        }
      })
      .catch(error => {
        console.error('Network error', error);
        Alert.alert('Error', 'Network error');
      });
  };

  return (
    <View>
      <Pressable onPress={selectImage}>
        <Text>Select Image</Text>
      </Pressable>
      <Pressable onPress={uploadImage}>
        <Text>Upload Image</Text>
      </Pressable>
    </View>
  );
}

export default App;
