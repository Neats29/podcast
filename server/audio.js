"use strict";
const speech = require("@google-cloud/speech");
const fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");
const { Writable } = require("stream");
const client = new speech.SpeechClient();
const tempfile = require("tempfile");

async function createSnippet({ url, startTime, endTime }) {
  console.log("creating snippet", url, startTime, endTime);
  const audioBytes = await new Promise((resolve, reject) => {
    const tmp = tempfile(".mp3");
    ffmpeg(url)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(tmp)
      .on("end", function(err) {
        if (err) {
          reject(err);
          return;
        }

        let buff;
        try {
          buff = fs.readFileSync(tmp);
          fs.unlinkSync(tmp);
        } catch (err) {
          reject(err);
          return;
        }

        resolve(buff);
      })
      .on("error", reject)
      .run();
  });

  const audio = {
    content: audioBytes.toString("base64")
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
  console.log("Extracting text");
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join("\n");

  console.log("transcription", transcription);
  return { text: transcription };
}

module.exports = {
  createSnippet
};

if (require.main === module)
  [
    createSnippet({
      url: process.argv[2],
      startTime: Number(process.argv[3])
    })
      .then(r => console.log(r))
      .catch(e => console.error(e))
  ];
