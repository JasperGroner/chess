import React, { useState, useEffect } from "react"
import { Redirect } from "react-router-dom"
import BoardRow from "./BoardRow"
import Chess from "../../gameModels/Chess"
import TurnDisplay from "./TurnDisplay"
import CapturedPiecesDisplay from "./CapturedPiecesDisplay"
import PopupDisplay from "../PopupDisplay"
import CheckDisplay from "./CheckDisplay"
import PawnUpgradeDisplay from "./PawnUpgradeDisplay"
import { io } from "socket.io-client"

const socket = io({
  autoConnect: false
})

const Board = props => {
  let game, userColor

  const { currentUser} = props

  if (props.location.state) {
    game = props.location.state.game
    userColor = props.location.state.color
  }

  const [ selectedTile, setSelectedTile ] = useState({
    row: null,
    column: null
  })

  const [ popupState, setPopupState ] = useState(false)
  const [ selectable, setSelectable ] = useState(true)
  const [ pawnUpgrade, setPawnUpgrade ] = useState({display: false})
  const [ selectedPieceMoves, setSelectedPieceMoves] = useState([])
  const [ boardState, setBoardState ] = useState(new Chess({blankBoard: true}))
  const [ turn, setTurn ] = useState("")
  const [ check, setCheck ] = useState({})
  const [ checkmate, setCheckmate ] = useState(false)
  const [ capturedPieces, setCapturedPieces ] = useState(boardState.capturedPieces)
  const [ allGameStates, setAllGameStates ] = useState([])
  const [ replayIndex, setReplayIndex ] = useState(false)

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected to back end")
    })

    if (game && game.id) {
      socket.connect()

      socket.emit("load game", {gameId: game.id})

      socket.on("load game", ({game}) => {
        const loadedGame = new Chess({gameState: game.encodedState})
        setBoardState(loadedGame)
        setCapturedPieces(loadedGame.capturedPieces)
        handleTurnColor(loadedGame.turn)
      })

      socket.on("turn switch", ({response}) => {
        boardState.loadGame(response.encodedState)
        handleTurnSwitch(response)
    })

    if (game && game.status === "finished") {
      setSelectable(false)

      socket.emit("get replay states", {gameId: game.id})

      socket.on("replay states", ({gameStates}) => {
        setAllGameStates(gameStates)
        setReplayIndex(gameStates.length - 1)
      })
    }

    } else {
      handleTurnColor("white")
    }

    return(() => {
      if (game && !checkmate) {
        socket.emit("leave game", {gameId: game.id})
      }
      socket.off("connect")
      socket.off("turn switch")
      socket.off("load game")
      socket.off("replay states")
      socket.disconnect()
    })
  }, [])

  const setUpChessRows = () => {
    const rows = []
    for (let i = 0; i < 8; i++) {
      let firstTile
      if (i % 2 === 0) {
        firstTile = "light"
      } else {
        firstTile = "dark"
      }
      rows.push(
        <BoardRow 
          firstTile={firstTile} 
          selectedTile={selectedTile}
          select={select}
          selectable={selectable}
          boardState={boardState}
          selectedPieceMoves={selectedPieceMoves}
          userColor={userColor}
          rowId={userColor === "black" ? 7 - i: i} 
          key={i}
        />
      )
    }
    return rows
  }

  const select = (row, column) => {
    const response = boardState.handleClick(row, column)
    handleResponse(response, row, column)
  }

  const handleResponse = (response, row, column) => {
    setSelectedPieceMoves(response.moves)
    if (response.capturedPieces) {
      setCapturedPieces(response.capturedPieces)
    }
    if ((selectedTile.row === row && selectedTile.column === column) ||
      response.unselect === true) {
      setSelectedTile({row: null, column: null})
    } else {
      setSelectedTile({row, column})
    }
    if (response.pawnUpgrade) {
      setPawnUpgrade(response.pawnUpgrade)
      showPopup()
      setBoardState(boardState)
    } else if (response.turnSwitch) {
      if (game) {
        socket.emit("turn switch", {response, gameId: game.id})
        saveGameState(response.encodedState)
      }
      handleTurnSwitch(response)
    }
  }

  const handleTurnSwitch = (response) => {
    if (response.check) {
      setCheck(response.check)
      if (response.check.black || response.check.white) {
        showPopup()
      }
    }
    if (response.checkmate) {
      setCheckmate(response.checkmate)
      socket.emit("checkmate", {gameId: game.id, winner: turn})
      showPopup()
    }
    if (response.capturedPieces) {
      setCapturedPieces(response.capturedPieces)
    }
    handleTurnColor(response.turnSwitch)
    setBoardState(boardState)
  }

  const showPopup = () => {
    setPopupState(true)
    setSelectable(false)
  }

  const handleTurnColor = (turnColor) => {
    setTurn(turnColor)
    if (userColor !== "both" && turnColor !== userColor) {
      setSelectable(false)
    } else {
      setSelectable(true)
    }
  }

  const saveGameState = (encodedState) => {
    socket.emit("game state", {gameId: game.id, encodedState})
  }

  let rows = setUpChessRows()

  const selfDestruct = event => {
    setSelectable(true)
    setPopupState(false)
  }

  let popup = ""
  if (popupState) {
    if (pawnUpgrade.display) {
      popup = (
        <PopupDisplay selfDestruct={selfDestruct}>
          <PawnUpgradeDisplay 
            pawnUpgrade={pawnUpgrade} 
            boardState={boardState}
            check={check}
            selfDestruct={selfDestruct}
            handleResponse={handleResponse}
            setPawnUpgrade={setPawnUpgrade}
          />
        </PopupDisplay>
      )
    } else if (check.black || check.white || checkmate) {
      popup = (
        <PopupDisplay selfDestruct={selfDestruct}>
          <CheckDisplay check={check} checkmate={checkmate} />
          <button onClick={selfDestruct} className="popup-button button">Okay</button>
        </PopupDisplay>
      )
    }
  }

  if (!currentUser || game) {
    return (
      <div className="sub-page-container-flex">
        {popup}
        <CapturedPiecesDisplay capturedPieces={capturedPieces.white} color="Black" />
        <div className="game-display">
          <TurnDisplay turn={turn} gameStatus={game.status} replayIndex={replayIndex} setReplayIndex={setReplayIndex} allGameStates={allGameStates} boardState={boardState} setBoardState={setBoardState}/>
          <div className ="container">
            {rows}
          </div>
        </div>
        <CapturedPiecesDisplay capturedPieces={capturedPieces.black} color="White" />
      </div>
    )
  } else {
    return (
      <Redirect to ="/" />
    )
  }
}

export default Board