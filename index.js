import express from "express";
import bodyParser from "body-parser";

import * as dotenv from "dotenv";
dotenv.config();
const app = express();
import cors from "cors";
import http, { createServer } from "http";
// import { corsData } from "./utils/corsLink.js";
// import { socketData } from "./utils/socketLink.js";
import { Server } from "socket.io";
import socketManager from "./components/listeners/socket.js";

app.use(cors());


//=========SOCKET============
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
var socketsManager = socketManager(io);

httpServer.listen(3131, function () {
  console.log("App listening on port 3030!");
});
