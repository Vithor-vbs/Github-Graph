import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";

const app = express();
const url = "mongodb://localhost:27017";
const dbName = "githubCache";
const collectionName = "repos";

const port = 5000;

let db;

const connectDB = async () => {
  if (!db) {
    try {
      const client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      db = client.db(dbName);
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB", error);
      throw error;
    }
  }
  return db;
};

app.use(cors());
app.use(json());

app.get("/cache/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    const cachedData = await collection.findOne({ username });
    res.json(cachedData ? cachedData.filteredData : null);
  } catch (error) {
    console.error("Error getting cached data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/cache/all", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    const cachedData = await collection.find({}).toArray();
    res.json(cachedData);
  } catch (error) {
    console.error("Error getting all cached data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/cache", async (req, res) => {
  const { username, filteredData } = req.body;
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    await collection.updateOne(
      { username },
      { $set: { username, filteredData } },
      { upsert: true }
    );
    res.status(200).json({ message: `Data cached for user: ${username}` });
  } catch (error) {
    console.error("Error caching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/cache/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    await collection.deleteOne({ username });
    res.status(200).json({ message: `Data deleted for user: ${username}` });
  } catch (error) {
    console.error("Error deleting cached data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/cache", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    res.status(200).json({ message: "All cached data deleted" });
  } catch (error) {
    console.error("Error deleting all cached data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
