import Bishop from "./Pieces/Bishop"
import King from "./Pieces/King"
import Knight from "./Pieces/Knight"
import Pawn from "./Pieces/Pawn"
import Queen from "./Pieces/Queen"
import Rook from "./Pieces/Rook"

class Board {
    constructor() {
        this.boardModel = []
        this.selectedPiece = null
        this.selectedPieceLocation = {row: null, column: null}
        this.selectedPieceMoves = []
        this.turn = "white"
        this.populateBoard()
    }

    populateBoard() {
        for (let i = 0; i < 8; i++) {
            let row = []
            if (i === 0) {
                row = Board.convertRow(["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"])
            } else if (i === 7) {
                row = Board.convertRow(["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"])
            } else {
                for (let j = 0; j < 8; j++) {
                    if (i === 1) row.push(new Pawn("black"))
                    else if (i === 6) row.push(new Pawn("white"))
                    else row.push(false)
                }
            }
            this.boardModel.push(row)
        }
    }

    handleClick(row, column, turn) {
        if (this.canMove(row, column)) {
            this.boardModel[row][column] = this.selectedPiece
            this.boardModel[this.selectedPieceLocation.row][this.selectedPieceLocation.column] = null
            this.selectedPieceLocation = {row, column}
            const check = this.switchTurn()
            this.selectedPiece = null
            return {moves: [], turnSwitch: this.turn, unselect: true, check: check}
        } else if (this.boardModel[row][column]) {
            if ((this.selectedPieceLocation.row === row && 
                this.selectedPieceLocation.column === column) ||
                this.boardModel[row][column].color !== turn) {
                this.selectedPiece = null
                this.selectedPieceLocation = {}
                return {moves: []}
            } else {
                this.selectedPiece = this.boardModel[row][column]
                this.selectedPieceLocation = {row, column}
                return {moves: this.getSelectedPieceMoves()}
            }
        }
        return {moves: []}
    }

    canMove(row, column) {
        if (this.selectedPiece) {
            for (const move of this.selectedPieceMoves) {
                if (move.row === row && move.column === column) {
                    return true
                }
            }
        }
        return false
    }

    getSelectedPieceMoves() {
        this.selectedPieceMoves = this.getPieceMoves(this.selectedPiece, this.selectedPieceLocation.row, this.selectedPieceLocation.column)
        return this.selectedPieceMoves
    }

    getPieceMoves(piece, pieceRow, pieceColumn) {
        const pieceMoves = []
        const moveSet = piece.moveSet
        moveSet.forEach(move => {
            if (move.repeating) {
                let row = pieceRow + move.vertical
                let column = pieceColumn + move.horizontal
                while (this.isValidMove({row, column}, move)) {
                    pieceMoves.push({row, column})
                    row += move.vertical
                    column += move.horizontal
                }
            } else {
                const row = pieceRow + move.vertical
                const column = pieceColumn + move.horizontal  
                if (this.isValidMove({row, column}, move)) {
                    pieceMoves.push({row, column})
                }
            }
        })

        return  pieceMoves
    }

    isValidMove({row, column}, move) {
        if (this.offBoard(row, column)) {
            return false
        } else if (this.occupiedByAlly(row, column)) {
            return false
        } else if (this.occupiedByEnemy(row - move.vertical, column - move.horizontal)) {
            return false
        } else if (move.specialConditions && !move.specialConditions(this.boardModel, row, column)) {
            return false
        }
        return true
    }

    offBoard(row, column) {
        return (row < 0 || row > this.boardModel.length -1 
            || column < 0 || column > this.boardModel[0].length - 1)
    }

    occupiedByAlly(row, column) {
        return (this.boardModel[row][column] &&
            this.boardModel[row][column].color === this.selectedPiece.color)
    }

    occupiedByEnemy(row, column) {
        return (this.boardModel[row][column] &&
            this.boardModel[row][column].color !== this.selectedPiece.color)
    }

    switchTurn () {
        this.turn = this.turn === "white" ? "black" : "white"
        return this.isCheck()
    }

    isCheck() {
        const check = {none: true}
        const whiteKingLocation = this.getKingLocation("white")
        const blackKingLocation = this.getKingLocation("black")
        for (let i = 0; i < this.boardModel.length; i++) {
            for (let j = 0; j < this.boardModel.length; j++) { 
                // maybe make "getAllPieces" function to handle this
                let piece = this.boardModel[i][j]
                if (piece) {
                    const validMoves = this.getPieceMoves(piece, i, j)
                    validMoves.forEach(move => {
                        if (piece.color === "white" && 
                            move.row === blackKingLocation.row &&
                            move.column === blackKingLocation.column) {
                            check.black = true
                            check.none = false
                        }
                        else if (piece.color === "black" &&
                            move.row === whiteKingLocation.row &&
                            move.column === whiteKingLocation.column) {
                            check.white = true
                            check.none = false
                        }
                    })
                }
            }
        }
        return check
    }

    getKingLocation(color) {
        for (let i = 0; i < this.boardModel.length; i++) {
            for (let j = 0; j < this.boardModel[i].length; j++) {
                if (this.boardModel[i][j] instanceof King &&
                    this.boardModel[i][j].color === color) {
                    
                    return({row: i, column: j})
                }
            }
        } 
    }

    static convertRow(rowArray) {
        for (let i = 0; i < rowArray.length; i++) {
            rowArray[i] = Board.convertPiece(rowArray[i])
        }
        return rowArray
    }

    static convertPiece(name) {
        switch(name) {
            case "wb":
                return new Bishop("white")
            case "bb":
                return new Bishop("black")
            case "wk":
                return new King("white")
            case "bk":
                return new King("black")
            case "wn":
                return new Knight("white")
            case "bn":
                return new Knight("black")
            case "wp":
                return new Pawn("white")
            case "bp":
                return new Pawn("black")
            case "wq":
                return new Queen("white")
            case "bq":
                return new Queen("black")
            case "wr":
                return new Rook("white")
            case "br":
                return new Rook('black')
        }
    }
}

export default Board