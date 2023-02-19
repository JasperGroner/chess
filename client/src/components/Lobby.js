import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io({
  autoConnect: false
})

const Lobby = props => {
  let gameId
  if (props.location.state) {
    gameId = props.location.state.game.id
  }

  const [ activeGameList, setActiveGameList ] = useState([])
  const [ joinedGameId, setJoinedGameId ] = useState(gameId)
  const [ startingGame, setStartingGame ] = useState({})

  useEffect(() => {
    socket.connect()

    socket.emit("get available games")

    socket.emit("join lobby")

    if (props.location.state &&
        props.location.state.game) {
      socket.emit("update available games")
    }

    socket.on("available games", ({games}) => {
      setActiveGameList(games)
    })

    socket.on("game starting", ({startingGame}) => {
      setStartingGame(startingGame)
    })

    return(() => {
      socket.emit("leave lobby")
      socket.off("available games")
      socket.off("game starting")
    })
  }, [])

  const joinGame = event => {
    event.preventDefault()
    const gameId = event.currentTarget.id
    setJoinedGameId(gameId)
    socket.emit("join game", {gameId, availableColor: "white"})
  }

  const activeGameReact = activeGameList.map(game => {
    return <a href="#" onClick={joinGame} key={game.id} id={game.id} className="main-menu--item">{game.name}</a>
  })

  if (joinedGameId && startingGame.id === joinedGameId) {
    return (
      <Redirect to={{
        pathname: "/chess",
        state: {
          game: startingGame
        }
      }}/>
    )
  }



  return (
    <div className="sub-page-container">
      <div className="centered-content">
      <h1>Gamers' Lobby</h1>
      <div className="lobby--active-game-display--frame">
        <h2>Available Games:</h2>
        <div className="lobby--active-game-display">
          {activeGameReact}
        </div>
      </div>
      </div>
    </div>
  )
}

export default Lobby