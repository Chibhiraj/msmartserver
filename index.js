const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const uri = "mongodb+srv://chibhiraj:Chibhiraj@mydb.uzc7ogf.mongodb.net/meshrd";
const port = 3001;
const path = require("path");
const mqtt = require("mqtt");

app.use(cors());
app.use(express.json());

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dbConn = mongoose.connection;

dbConn.on("error", console.error.bind(console, "Connection Error"));
dbConn.on("open", function () {
  console.log("DB Connection successful");
});

app.use(express.static(path.join(__dirname, "../build")));

const mqttBrokerUrl = "mqtt://test.mosquitto.org:1883";

const options = {
  username: "your-username",
  password: "your-password",
};

// const client = mqtt.connect(mqttBrokerUrl, options);
const client = mqtt.connect(mqttBrokerUrl);

client.on("connect", () => {
  console.log("Connected to MQTT broker");
});

client.on("error", (err) => {
  console.error("MQTT connection error: ", err);
});

const HallSchema = new mongoose.Schema({
  Light1: { type: Boolean, default: false },
  Light2: { type: Boolean, default: false },
  TvFan: { type: Boolean, default: false },
  SofaFan: { type: Boolean, default: false },
});


const MyRoomSchema = new mongoose.Schema({
  RLight: { type: Boolean, default: false },
  RFan: { type: Boolean, default: false },
  RAc: { type: Boolean, default: false },
  RWifi: { type: Boolean, default: false },
});


const Hall = mongoose.model("Hall", HallSchema);
const MyRoom = mongoose.model("MyRoom", MyRoomSchema);


app.get("/api/hall", async (req, res) => {
  try {
    const hallState = await Hall.findOne({});
    res.status(200).json(hallState);
  } catch (error) {
    console.error("Error fetching hall state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/myroom", async (req, res) => {
  try {
    const myRoomState = await MyRoom.findOne({});
    res.status(200).json(myRoomState);
  } catch (error) {
    console.error("Error fetching myroom state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/hall", async (req, res) => {
  try {
    const updatedHall = await Hall.findOneAndUpdate({}, req.body);
    const topic = "topic/viktestPOC";
    const id = "48:E7:29:6D:73:4A";
    const {Light1,Light2,SofaFan,TvFan}=req.body;
    const message = JSON.stringify({
    id: id,
    1: Light1,
    2: Light2,
    3: TvFan,
    4: SofaFan
  });

  client.publish(topic, message, (err) => {
    if (err) {
      console.error("Publish error: ", err);
      return res.status(500).json({ error: "Failed to publish message" });
    }
    return res.json({ success: true, topic, message});
  });

  } catch (error) {
    console.error("Error saving hall state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/myroom", async (req, res) => {
  try {
    const updatedHall = await MyRoom.findOneAndUpdate({}, req.body);
    const topic = "topic/viktestPOC";
    const id = "48:E7:29:6D:73:4A";
    const {RLight,RFan,RAc,RWifi}=req.body;
    const message = JSON.stringify({
    id: id,
    1: RLight,
    2: RFan,
    3: RAc,
    4: RWifi
  });

  client.publish(topic, message, (err) => {
    if (err) {
      console.error("Publish error: ", err);
      return res.status(500).json({ error: "Failed to publish message" });
    }
    return res.json({ success: true, topic, message});
  });

  } catch (error) {
    console.error("Error saving hall state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});




app.post("/api/publish", (req, res) => {
  const topic = "topic/viktestPOC";
  const id = "48:E7:29:6D:73:4A";
  const message = JSON.stringify({
    id: id,
    1: 0,
    2: 1,
    3: 0,
    4: 0
  });

  if (!topic || !message) {
    return res.status(400).json({ error: "Topic and message are required" });
  }

  client.publish(topic, message, (err) => {
    if (err) {
      console.error("Publish error: ", err);
      return res.status(500).json({ error: "Failed to publish message" });
    }
    return res.json({ success: true, topic, message });
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
