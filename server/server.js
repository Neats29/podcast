"use strict";
const Koa = require("koa");
const router = require("koa-router")();
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const fetch = require("node-fetch");
const parsePodcast = require("node-podcast-parser");
const audio = require("./audio");

const app = new Koa();

app.use(koaBody());
app.use(cors());

router.get("/episodes", episodes);
router.post("/createSnippet", createSnippet);

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
  ctx.body = {
    ...data,
    episode: data.episodes.find(x => x.guid === guid)
  };
}

async function createSnippet(ctx) {
  const { url, startTime, endTime } = ctx.request.body;
  console.log("url", url);
  console.log("startTime", startTime);
  console.log("endTIme", endTIme);

  const result = await audio.createSnippet({
    url,
    startTime,
    endTime
  });

  ctx.body = result;
}

app.listen(process.env.PORT, () => {
  console.log("Server started on", process.env.PORT);
});
