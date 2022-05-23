import { useState, useEffect } from "react"
import useAuth from "./useAuth"
import Player from "./Player"
import TrackSearchResult from "./TrackSearchResult"
import { Container, Form } from "react-bootstrap"
import SpotifyWebApi from "spotify-web-api-node"
import axios from "axios"

const spotifyApi = new SpotifyWebApi({
  clientId: "db01385a20014443af47b95f572509e1",
})

export default function Dashboard({ code }) {
  const accessToken = useAuth(code)
  const [result, setResult] = useState();
  const [something, setSomething] = useState({"items":[{"name":"flower_boy","price":17.99}]});
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [playingTrack, setPlayingTrack] = useState()
  const [lyrics, setLyrics] = useState("")

  function chooseTrack(track) {
    setPlayingTrack(track)
    setSearch("")
    setLyrics("")
  }

  useEffect(() => {
    const fetchData = async () => {
      try{
        const productRes = await axios.post("https://cse361microservice.herokuapp.com/service/calculator/10", something)
        if (productRes.data.total) {
          console.log(productRes.data.total)
          setResult(productRes.data.total)
        }
      } catch (err) {
        console.log({ err })
      }
    }

    fetchData()
  }, [])


  useEffect(() => {
    if (!playingTrack) return

    axios
      .get("http://localhost:3001/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then(res => {
        setLyrics(res.data.lyrics)
      })
  }, [playingTrack])

  useEffect(() => {
    if (!accessToken) return
    spotifyApi.setAccessToken(accessToken)
  }, [accessToken])

  useEffect(() => {
    if (!search) return setSearchResults([])
    if (!accessToken) return

    let cancel = false
    spotifyApi.searchAlbums(search).then(res => {
      if (cancel) return
      setSearchResults(
        res.body.albums.items.map(album => {
          const smallestAlbumImage = album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image
              return smallest
            },
            album.images[0]
          )

          return {
            artist: album.artists[0].name,
            title: album.name,
            uri: album.uri,
            albumUrl: smallestAlbumImage.url,
          }
        })
      )
    })

    return () => (cancel = true)
  }, [search, accessToken])

  return (
    <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
      <Form.Control
        type="search"
        placeholder="Use the Search to find artists and tracks on Spotify"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div>
        {result ?
        <h2>
          {result["flower_boy"]}
        <br></br>
         {result["total_after_tax"]}
        </h2> : <div></div>
      }
      </div>
      <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
        {searchResults.map(track => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            chooseTrack={chooseTrack}
          />
        ))}
        {searchResults.length === 0 && (
          <div className="text-center" style={{ whiteSpace: "pre" }}>
            {lyrics}
          </div>
        )}
      </div>
      <div>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </Container>
  )
}
