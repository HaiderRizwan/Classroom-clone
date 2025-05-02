require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    await client.close();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

testConnection();