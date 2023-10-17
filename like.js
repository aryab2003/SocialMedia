

// Client-Side (React)
import React, { useState, useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

function LikeButton({ post_id, userId }) {
  const [likeState, setLikeState] = useState([]);
  const [likeCount, setLikeCount] = useState(0);

 
  const API_URL = 'http://server_ip_address:4000';

  const fetchLikes = async () => {
    try {
      const response = await fetch(`${API_URL}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id }),
      });

      if (response.ok) {
        const json = await response.json();
        return json.length;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching likes:', error);
      return 0;
    }
  };

  const toggleLike = async () => {
    try {
      const currentLikes = await fetchLikes();

      const ids = { user_id: userId, post_id };

      const response = await fetch(`${API_URL}/likeToggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });

      if (response.ok) {
        const json = await response.json();
        const isLiked = json.length === 0;
        setLikeCount(isLiked ? currentLikes + 1 : currentLikes - 1);
        setLikeState(prev => (isLiked ? [...prev, post_id] : prev.filter(item => item !== post_id)));
      } else {
        console.error('Error toggling like:', response.status);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  useEffect(() => {
    fetchLikes().then(count => setLikeCount(count));
  }, [post_id, userId]);

  return (
    <Pressable
      onPress={toggleLike}
      style={{
        height: 28,
        width: 90,
        backgroundColor: '#313030',
        borderRadius: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        flexDirection: 'row',
        marginLeft: 15,
      }}
    >
      <FontAwesomeIcon
        name={'thumbs-up'}
        color={likeState.includes(post_id) ? '#1195DF' : 'gray'}
        size={20}
      />
      <Text>{likeCount}</Text>
    </Pressable>
  );
}

export default LikeButton;

// Server-Side 
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const con = mysql.createConnection({
  host: 'your_database_host',
  user: 'your_database_user',
  password: 'your_database_password',
  database: 'your_database_name',
});

con.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

app.post('/likeToggle', async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const result = await con.promise().execute('SELECT * from likes where post_id=? and user_id=?', [post_id, user_id]);

    if (result[0].length === 0) {
      // Insert like
      await con.promise().execute('INSERT into likes(post_id,user_id) values(?,?)', [post_id, user_id]);
    } else {
      // Delete like
      await con.promise().execute('DELETE FROM likes where post_id = ? and user_id = ?', [post_id, user_id]);
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).send('Error toggling like');
  }
});


app.post('/likes', (req, res) => {
  const { user_id, post_id } = req.body;

  con.query(
    'SELECT * from likes where post_id=? and user_id=?',
    [post_id, user_id],
    (err, result) => {
      if (err) {
        console.error('Error retrieving data:', err);
        res.status(500).send('Error retrieving data');
      } else {
        console.log('Data retrieved successfully!');
        res.status(200).json(result);
      }
    }
  );
});

// Additional routes and server configuration as needed

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
