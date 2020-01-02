"use strict";
const speech = require("@google-cloud/speech");
const fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");

const Koa = require("koa");
const router = require("koa-router")();
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const fetch = require("node-fetch");
const parsePodcast = require("node-podcast-parser");

const app = new Koa();

// Creates a client
const client = new speech.SpeechClient();

app.use(koaBody());
app.use(cors());

router
  .get("/episodes", episodes)
  .post("/snippet", snippet)
  .get("/getNote", getNote);

app.use(router.routes());

async function episodes(ctx) {
  console.log("Looking up podcast in iTunes API", ctx.request.query.id);
  const podcast = await fetch(
    `https://itunes.apple.com/lookup?id=${ctx.request.query.id}`
  ).then(r => r.json());

  if (!podcast || !podcast.results || podcast.results.length !== 1) {
    console.log("Podcast not found");
    ctx.status = 404;
    ctx.body = {
      error: "Not found"
    };
  }

  console.log("Downloading feed", podcast.results[0].feedUrl);
  const xml = await fetch(podcast.results[0].feedUrl).then(r => r.text());

  console.log("Parsing XML", xml.substring(0, 30));
  parsePodcast(xml, (err, data) => {
    if (err) {
      console.error("Error parsing podcast feed url", err);
      ctx.status = 400;
      ctx.body = {
        error: err.message
      };
      return;
    }

    console.log(data);

    ctx.body = data;
  });
}

async function snippet(ctx) {
  const data = ctx.request.body;
  const start = Math.floor(JSON.parse(data).startTime / 1000);
  const duration = 10;
  // if the selection is earlier than 10 secs into the audio, then do from the begining
  let begin = 0;
  const x = start - duration;
  if (x > 0) {
    begin = x;
  }

  ffmpeg("./after-short.mp3")
    .setStartTime(begin)
    .setDuration(duration)
    .output("output.mp3")
    .on("end", async function(err) {
      if (!err) {
        console.log("conversion Done");
      }
    })
    .on("error", function(err) {
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
    encoding: "MPEG-1",
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

app.listen(process.env.PORT);

// a button to play
// a button to create a 1 min snippet --> call `ffmpeg -i INPUT.mp3 -ss START -to END OUTPUT.mp3` (eg: ffmpeg -i ~/Downloads/tim.mp3 -ss 300 -to 350 5.mp3)
// convert the audio into speech
// show on screen
