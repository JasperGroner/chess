import express from "express"
import { ValidationError } from "objection"
import { Game, Player, GameState } from "../../../models/index.js"
import GameSerializer from "../../../serializers/GameSerializer.js"
import cleanUserInput from "../../../services/cleanUserInput.js"
import gamesGameStatesRouter from "./gamesGameStatesRouter.js"
import handlePuzzleUpdate from "../../../services/handlePuzzleUpdate.js"

const gamesRouter = new express.Router()

gamesRouter.get("/type/:gameType", async (req, res) => {
  let userId
  const gameType = req.params.gameType
  if (gameType !== "puzzle") {
    userId = req.user.id
  }
  try { 
    let games = await Game.query().where("gameType", gameType).orderBy("createdAt")
    if (gameType === "puzzle") {
      games = await handlePuzzleUpdate(games)
    }
    const serializedGames = await GameSerializer.getSummarySwitcher({games, userId, gameType})
    res.status(200).json({games: serializedGames})
  } catch(error) {
    res.status(500).json({ errors: error })
  }
})

gamesRouter.get("/type/:gameType/:status", async (req, res) => {
  const userId = req.user.id
  const { gameType, status } = req.params
  try { 
    const games = await Game.query().where("gameType", gameType).where("status", status)
    const serializedGames = await GameSerializer.getSummarySwitcher({games, userId, gameType})
    res.status(200).json({games: serializedGames})
  } catch(error) {
    res.status(500).json({ errors: error })
  }
})

gamesRouter.get("/:gameId", async (req, res) => {
  let userId
  const gameId = req.params.gameId
  try {
    const game = await Game.query().findById(gameId)
    if (game.gameType !== "puzzle") {
      userId = req.user.id
    }
    const serializedGame = await GameSerializer.getDetailSwitch(game, userId)
    res.status(200).json({ game: serializedGame })
  } catch(error) {
    res.status(500).json({ errors: error })
  }
})

gamesRouter.delete("/:gameId", async(req, res) => {
  const gameId = req.params.gameId
  try {
    const deletedGame = await Game.query().deleteById(gameId)
    res.status(200).json({ gameId })
  } catch(error) {
    res.status(500).json({ errors: error })
  }
})

gamesRouter.post("/", async (req, res) => {
  const userId = req.user.id
  const { body } = req
  if (body.game.gameType === "network") {
    body.game.status = "looking"
  } else {
    body.game.status = "playing"
  }
  const formPayload = cleanUserInput(body.game)
  try {
    const newGame = await Game.query().insertAndFetch(formPayload)
    const newPlayer = await Player.query().insertAndFetch({userId, gameId: newGame.id, color: body.color})
    const newGameState = await GameState.query().insertAndFetch({gameId: newGame.id, encodedState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"})
    const serializedGame = await GameSerializer.getDetailByUser(newGame, userId)
    return res.status(200).json({game: serializedGame})
  } catch(error) {
    if (error instanceof ValidationError) {
      return res.status(422).json({ errors: error.data })
    }
    return res.status(500).json({ errors: error })
  }
})

gamesRouter.use("/:gameId/gameState", gamesGameStatesRouter)

export default gamesRouter