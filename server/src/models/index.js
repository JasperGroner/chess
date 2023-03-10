// include all of your models here using CommonJS requires
const User = require("./User.js")
const Game = require("./Game.js")
const GameState = require("./GameState.js")
const Player = require("./Player.js")
const PuzzleMove = require("./PuzzleMove.js")

module.exports = { User, Game, GameState, Player, PuzzleMove };
