require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const lyricsFinder = require("lyrics-finder");
//const searchAlbums = require("album-finder");
const SpotifyWebApi = require("spotify-web-api-node");
const PORT = 3001;

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
//let auth_code = 0;
let spotifyApi;

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refresh_token
  spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  })

  spotifyApi
    .refreshAccessToken()
    .then(data => {
      spotifyApi.setAccessToken(data.body["access_token"]);
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      })
    })
    .catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
})

app.post("/login", (req, res) => {
  const code = req.body.code
  auth_code =req.body.code
  console.log(auth_code);
  spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,

  })

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      spotifyApi.setAccessToken(data.body["access_token"]);
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      })
    })
    .catch(err => {
      res.sendStatus(400)
    })
})


app.get("/album/:id", async (req, res) => {
  //console.log(auth_code)
  const code = req.params.id
  //const art = req.query.id
  //auth_code

  //const data = await spotifyApi.authorizationCodeGrant(auth_code)
  //console.log(data);
  //const album = (await spotifyApi.getArtistAlbums(''))
  const artist = (await spotifyApi.getAlbum(code))
  console.log({artist});
  res.json({artist});
  
  });

app.get("/lyrics/:artist/:track", async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.params.artist, req.params.track)) || "No Lyrics Found"
  res.json({ lyrics })
})

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
