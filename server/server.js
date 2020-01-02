"use strict";
const speech = require("@google-cloud/speech");
const fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");
const { Writable } = require("stream");

const Koa = require("koa");
const router = require("koa-router")();
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const fetch = require("node-fetch");
const parsePodcast = require("node-podcast-parser");
const { createSnippet } = require('./audio');

const app = new Koa();

// Creates a client
const client = new speech.SpeechClient();

app.use(koaBody());
app.use(cors());

router
  .get("/episodes", episodes)
  .post("/snippet", snippet)
  .get("/getNote", getNote)
  .post("/createSnippet", createSnippetHandler);

app.use(router.routes());

async function episodes(ctx) {
  console.log("Looking up podcast in iTunes API", ctx.request.query.id);
  const podcast = await fetch(
    `https://itunes.apple.com/lookup?id=${ctx.request.query.id}`
  ).then(r => r.json());

  if (!podcast || !podcast.results || podcast.results.length !== 1) {
    throw new Error("Not found");
  }

  console.log("Downloading feed", podcast.results[0].feedUrl);
  const xml = await fetch(podcast.results[0].feedUrl).then(r => r.text());

  console.log("Parsing XML", xml.substring(0, 30));
  const data = await new Promise((resolve, reject) => {
    parsePodcast(xml, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });

  if (!ctx.request.query.guid) {
    ctx.body = data;
    return;
  }

  const guid = Buffer.from(ctx.request.query.guid, "base64").toString();
  ctx.body = data.episodes.find(x => x.guid === guid);
}

async function snippet(ctx) {
  const data = ctx.request.body;
  console.log("DATA", data)
  const pausedAt = Math.floor(JSON.parse(data).startTime / 1000);
  let duration = 10;
  // if the selection is earlier than 10 secs into the audio, then do from the begining
  let begin = 0;
  const x = pausedAt - duration;
  if (x > 0) {
    begin = x;
    duration = pausedAt
  }

  ffmpeg("./after-short.mp3")
    .setStartTime(begin)
    .setDuration(duration)
    .output("output.mp3")
    .on("end", async function (err) {
      if (!err) {
        console.log("conversion Done");
      }
    })
    .on("error", function (err) {
      console.log("error: ", +err);
    })
    .run();
}

async function getNote(ctx) {
  console.log("GET NOTE!!");
  // The name of the audio file to transcribe
  const fileName = "./output.mp3";

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString("base64");

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes
  };
  const config = {
    // encoding: "MPEG-1",
    sampleRateHertz: 16000,
    languageCode: "en-US"
  };
  const request = {
    audio: audio,
    config: config
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join("\n");
  // console.log(`Transcription: ${transcription}`);

  ctx.body = { text: transcription };
}



/// -----------------

async function createSnippetHandler(ctx) {
  console.log(ctx.request.body);

  const result = await createSnippet({
    url: ctx.request.body.url,
    startTime: ctx.request.body.startTime,
    endTime: ctx.request.body.endTime,
  })

  ctx.body = result;
}

app.listen(process.env.PORT);

// a button to play
// a button to create a 1 min snippet --> call `ffmpeg -i INPUT.mp3 -ss START -to END OUTPUT.mp3` (eg: ffmpeg -i ~/Downloads/tim.mp3 -ss 300 -to 350 5.mp3)
// convert the audio into speech
// show on screen
