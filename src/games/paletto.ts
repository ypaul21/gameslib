import { GameBase, IAPGameState, IClickResult, IIndividualState, IValidationResult } from "./_base";
import { APGamesInformation } from "../schemas/gameinfo";
import { APRenderRep } from "@abstractplay/renderer/src/schemas/schema";
import { APMoveResult } from "../schemas/moveresults";
// Added shuffle import
import { reviver, UserFacingError, shuffle } from "../common";
import i18next from "i18next";

type playerid = 1 | 2 | 3 | 4;

interface IMoveState extends IIndividualState {
    currplayer: playerid;
    board: Map<string, number>;
    lastmove?: string;
}

export interface IPalettoState extends IAPGameState {
    winner: playerid[];
    stack: Array<IMoveState>;
    numplayers: number;
};

export class PalettoGame extends GameBase {
    public static readonly gameinfo: APGamesInformation = {
        name: "Paletto",
        uid: "paletto",
        playercounts: [2, 3, 4],
        version: "20250420",
        dateAdded: "2025-04-20",
        // i18next.t("apgames:descriptions.paletto")
        description: "apgames:descriptions.paletto",
        urls: [
            "https://spielstein.com/games/paletto/rules",
            "https://boardgamegeek.com/boardgame/101463/paletto",
        ],
        people: [
            {
                type: "designer",
                name: "Dieter Stein",
                urls: ["https://spielstein.com/"]
            },
            {
                type: "coder",
                name: "ypaul",
                urls: [],
                apid: "46f6da78-be02-4469-94cb-52f17078e9c1",
            },
        ],
        variants: [
            { uid: "size-7", group: "board" },
        ],
        categories: ["goal>connect", "mechanic>place", "board>shape>rect", "board>connect>rect", "components>simple"],
        flags: ["experimental"],
    };

    public coords2algebraic(x: number, y: number): string {
        return GameBase.coords2algebraic(x, y, this.boardSize);
    }

    public algebraic2coords(cell: string): [number, number] {
        return GameBase.algebraic2coords(cell, this.boardSize);
    }

    public numplayers!: number;
    public currplayer!: playerid;
    public board!: Map<string, number>;
    public gameover = false;
    public winner: playerid[] = [];
    public stack!: Array<IMoveState>;
    public results: Array<APMoveResult> = [];
    public variants: string[] = [];
    private boardSize = 0;
    private dots: string[] = [];

    constructor(state: number | IPalettoState | string, variants?: string[]) { // Changed state type
        super();
        if (typeof state === "number") {
            if ( (variants !== undefined) && (variants.length > 0) ) {
                this.variants = [...variants];
            }
            this.numplayers = state;
            if (this.numplayers < 2 || this.numplayers > 4) {
                throw new Error("Paletto is only playable by 2, 3, or 4 players.");
            }
            this.boardSize = this.getBoardSize();
            const initialBoard = this.getInitialBoard(this.boardSize);
            const fresh: IMoveState = {
                _version: PalettoGame.gameinfo.version,
                _results: [],
                _timestamp: new Date(),
                currplayer: 1,
                board: initialBoard,
            };
            this.stack = [fresh];
        } else {
            if (typeof state === "string") {
                state = JSON.parse(state, reviver) as IPalettoState;
            }
            if (state.game !== PalettoGame.gameinfo.uid) {
                throw new Error(`The Paletto game code cannot process a game of '${state.game}'.`);
            }
            this.numplayers = state.numplayers;
            this.gameover = state.gameover;
            this.winner = [...state.winner];
            this.variants = state.variants;
            this.stack = [...state.stack];
            this.boardSize = this.getBoardSize();
        }
        this.load();
    }

    public load(idx = -1): PalettoGame {
        if (idx < 0) {
            idx += this.stack.length;
        }
        if (idx < 0 || idx >= this.stack.length) {
            throw new Error("Could not load the requested state from the stack.");
        }

        const state = this.stack[idx];
        if (state === undefined) {
            throw new Error(`Could not load state index ${idx}`);
        }
        this.results = [...state._results];
        this.currplayer = state.currplayer;
        this.board = new Map(state.board);
        this.lastmove = state.lastmove;
        return this;
    }

    private getBoardSize(): number {
        // Get board size from variants.
        if (this.variants !== undefined && this.variants.length > 0 && this.variants[0] !== undefined && this.variants[0].length > 0) {
            const sizeVariants = this.variants.filter(v => v.includes("size"))
            if (sizeVariants.length > 0) {
                const size = sizeVariants[0].match(/\d+/);
                return parseInt(size![0], 10);
            }
            if (isNaN(this.boardSize)) {
                throw new Error(`Could not determine the board size from variant "${this.variants[0]}"`);
            }
        }
        return 6;
    }

    private fillCell(
        cellIndex: number,
        boardSize: number,
        board: Map<string, number>,
        pieceCounts: Map<number, number>
    ): boolean {
        // Base case: All cells filled
        if (cellIndex === boardSize * boardSize) {
            return true;
        }

        const x = cellIndex % boardSize;
        const y = Math.floor(cellIndex / boardSize);
        const cell = this.coords2algebraic(x, y);

        // Create a list of all possible colors (1 to boardSize) and shuffle it once.
        const colorsToTry = shuffle(Array.from({ length: boardSize }, (_, i) => i + 1));

        for (const color of colorsToTry) {
            // Check if this color is available (count > 0)
            if (pieceCounts.get(color)! > 0) {
                // Check constraints with already placed neighbors (top and left)
                let validPlacement = true;
                // Check top neighbor
                if (y > 0) {
                    const topNeighbourCell = this.coords2algebraic(x, y - 1);
                    if (board.has(topNeighbourCell) && board.get(topNeighbourCell) === color) {
                        validPlacement = false;
                    }
                }
                // Check left neighbor
                if (validPlacement && x > 0) {
                    const leftNeighbourCell = this.coords2algebraic(x - 1, y);
                    if (board.has(leftNeighbourCell) && board.get(leftNeighbourCell) === color) {
                        validPlacement = false;
                    }
                }

                if (validPlacement) {
                    // Place the piece
                    board.set(cell, color);
                    pieceCounts.set(color, pieceCounts.get(color)! - 1);

                    // Recurse to the next cell
                    if (this.fillCell(cellIndex + 1, boardSize, board, pieceCounts)) {
                        return true; // Solution found down this path
                    }

                    // Backtrack: Undo placement if recursion failed
                    pieceCounts.set(color, pieceCounts.get(color)! + 1);
                    board.delete(cell);
                }
            }
        }

        // No valid color found for this cell, trigger backtracking
        return false;
    }

    private getInitialBoard(boardSize: number): Map<string, number> {
        // Initialize piece counts: `boardSize` pieces for each color 1 to `boardSize`.
        const pieceCounts = new Map<number, number>();
        for (let num = 1; num <= boardSize; num++) {
            pieceCounts.set(num, boardSize);
        }

        const board = new Map<string, number>();
        // Start the backtracking process from the first cell (index 0)
        const success = this.fillCell(0, boardSize, board, pieceCounts);

        if (!success) {
            // This should theoretically not happen if a solution always exists,
            // but it's a safeguard. Could potentially fall back to the generate-and-test
            // method or throw a more specific error.
            throw new Error("Failed to generate a valid initial board layout using backtracking. This might indicate an issue with the constraints or board size.");
        }

        return board;
    }

    public moves(player?: playerid): string[] {
        if (player === undefined) {
            player = this.currplayer;
        }
        if (this.gameover) { return []; }
        const moves: string[] = [];
        return moves;
    }

    public randomMove(): string {
        const moves = this.moves();
        return moves[Math.floor(Math.random() * moves.length)];
    }

    public handleClick(move: string, row: number, col: number, piece?: string): IClickResult {
        try {
            const cell = this.coords2algebraic(col, row);
            let newmove = "";
            newmove = cell;
            const result = this.validateMove(newmove) as IClickResult;
            if (!result.valid) {
                result.move = "";
            } else {
                result.move = newmove;
            }
            return result;
        } catch (e) {
            return {
                move,
                valid: false,
                message: i18next.t("apgames:validation._general.GENERIC", { move, row, col, piece, emessage: (e as Error).message })
            }
        }
    }

    public validateMove(m: string): IValidationResult {
        const result: IValidationResult = {valid: false, message: i18next.t("apgames:validation._general.DEFAULT_HANDLER")};
        if (m.length === 0) {
            result.valid = true;
            result.complete = -1;
            result.canrender = true;
            result.message = i18next.t("apgames:validation.paletto.INITIAL_INSTRUCTIONS");
            return result;
        }
        result.valid = true;
        result.complete = 1;
        result.message = i18next.t("apgames:validation._general.VALID_MOVE");
        return result;
    }

    public move(m: string, {partial = false, trusted = false} = {}): PalettoGame {
        if (this.gameover) {
            throw new UserFacingError("MOVES_GAMEOVER", i18next.t("apgames:MOVES_GAMEOVER"));
        }

        let result;
        m = m.toLowerCase();
        m = m.replace(/\s+/g, "");
        if (!trusted) {
            result = this.validateMove(m);
            if (!result.valid) {
                throw new UserFacingError("VALIDATION_GENERAL", result.message);
            }
            if (!partial && !this.moves().includes(m)) {
                throw new UserFacingError("VALIDATION_FAILSAFE", i18next.t("apgames:validation._general.FAILSAFE", { move: m }));
            }
        }
        if (m.length === 0) { return this; }
        this.dots = [];
        this.results = [];
        this.results.push({ type: "place", where: m });
        this.board.set(m, this.currplayer);

        this.lastmove = m;
        // Update player cycling logic
        this.currplayer = (this.currplayer % this.numplayers + 1) as playerid;

        this.checkEOG();
        this.saveState();
        return this;
    }

    protected checkEOG(): PalettoGame {
        // Update player calculation logic (example, actual logic depends on game rules)
        // This assumes the player *before* the current player wins if EOG is triggered now.
        const winningPlayer = ((this.currplayer + this.numplayers - 2) % this.numplayers + 1) as playerid;
        if (false) { // Replace false with actual win condition check
            this.gameover = true;
            this.winner = [winningPlayer];
        }
        if (this.gameover) {
            this.results.push({ type: "eog" });
            this.results.push({ type: "winners", players: [...this.winner] });
        }
        return this;
    }

    public state(): IPalettoState {
        return {
            game: PalettoGame.gameinfo.uid,
            numplayers: this.numplayers,
            variants: this.variants,
            gameover: this.gameover,
            winner: [...this.winner],
            stack: [...this.stack],
        };
    }

    protected moveState(): IMoveState {
        return {
            _version: PalettoGame.gameinfo.version,
            _results: [...this.results],
            _timestamp: new Date(),
            currplayer: this.currplayer,
            lastmove: this.lastmove,
            // Needs to be Map<string, number> to match class property
            board: new Map(this.board),
        };
    }

    public render(): APRenderRep {
        // Build piece string
        let pstr = "";
        for (let row = 0; row < this.boardSize; row++) {
            if (pstr.length > 0) {
                pstr += "\n";
            }
            let rstr = "";
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.coords2algebraic(col, row);
                if (this.board.has(cell)) {
                    const contents = this.board.get(cell);
                    if (contents !== undefined && contents > 0) {
                        // Convert number (1-based) to letter (A=1, B=2, ...)
                        rstr += String.fromCharCode(64 + contents);
                    } else {
                        rstr += "-";
                    }
                } else {
                    rstr += "-";
                }
            }
            // Replace runs of '-' with '_' followed by the count
            pstr += rstr.replace(/-+/g, (match) => `_${match.length}`);
        }

        // Dynamically generate the legend
        const legend: { [key: string]: [{ name: string; colour: number }] } = {};
        for (let i = 1; i <= this.boardSize; i++) {
            const pieceChar = String.fromCharCode(64 + i);
            legend[pieceChar] = [{ name: "piece", colour: i }];
        }

        // Build rep
        const rep: APRenderRep =  {
            board: {
                style: "squares",
                width: this.boardSize,
                height: this.boardSize,
            },
            legend,
            pieces: pstr,
        };

        // @ts-ignore
        rep.annotations = [];
        if (this.results.length > 0) {
            for (const move of this.results) {
                if (move.type === "place") {
                    const [x, y] = this.algebraic2coords(move.where!);
                    rep.annotations.push({ type: "enter", targets: [{ row: y, col: x }] });
                } else if (move.type === "move") {
                    const [fromX, fromY] = this.algebraic2coords(move.from);
                    const [toX, toY] = this.algebraic2coords(move.to);
                    rep.annotations.push({ type: "move", targets: [{ row: fromY, col: fromX }, { row: toY, col: toX }] });
                }
            }
        }
        if (this.dots.length > 0) {
            const points = [];
            for (const cell of this.dots) {
                const [x, y] = this.algebraic2coords(cell);
                points.push({ row: y, col: x });
            }
            // @ts-ignore
            rep.annotations.push({ type: "dots", targets: points });
        }
        return rep;
    }

    public status(): string {
        let status = super.status();

        if (this.variants !== undefined) {
            status += "**Variants**: " + this.variants.join(", ") + "\n\n";
        }

        return status;
    }

    public clone(): PalettoGame {
        return new PalettoGame(this.serialize());
    }
}
