import { GameBase, IAPGameState, IClickResult, IIndividualState, IValidationResult } from "./_base";
import { APGamesInformation } from "../schemas/gameinfo";
import { APRenderRep, RowCol } from "@abstractplay/renderer/src/schemas/schema";
import { APMoveResult } from "../schemas/moveresults";
import { reviver, UserFacingError } from "../common";
import i18next from "i18next";

type playerid = 1 | 2;
const columnLabels = "abcdefghijklmnopqrstuvwxyz".split("");

interface IMoveState extends IIndividualState {
    currplayer: playerid;
    boardEdge: Map<string, playerid>;
    boardCell: Map<string, playerid>;
    lastmove?: string;
}

export interface ITemplState extends IAPGameState {
    winner: playerid[];
    stack: Array<IMoveState>;
};

export class TemplGame extends GameBase {
    public static readonly gameinfo: APGamesInformation = {
        name: "Templ",
        uid: "templ",
        playercounts: [2],
        version: "20240227",
        dateAdded: "2024-03-10",
        // i18next.t("apgames:descriptions.templ")
        description: "apgames:descriptions.templ",
        urls: [],
        people: [],
        variants: [
            { uid: "size-7x7", group: "board" },
        ],
        categories: ["goal>connect", "mechanic>place", "board>shape>rect", "board>connect>rect", "components>simple"],
        flags: ["experimental"],
    };

    public coords2algebraic(x: number, y: number): string {
        return GameBase.coords2algebraic(x, y, this.height);
    }

    public algebraic2coords(cell: string): [number, number] {
        return GameBase.algebraic2coords(cell, this.height);
    }

    private splitWall(wall: string): [number, number, string] {
        // Split the wall into its components.
        // To distinguish between the output from this method and the render output
        // we call the third element "orient" for orientation instead of "side".
        const cell = wall.slice(0, wall.length - 1);
        const orient = wall[wall.length - 1];
        const [x, y] = this.algebraic2coords(cell);
        return [x, y, orient];
    }

    private render2wall(row: number, col: number, side: string): string {
        // Converts click results from renderer into wall notation.
        // For games with interior-only walls, we use the north and east edges.
        // For games with exterior walls (like Dots and Boxes), we use the south and west edges.
        const orientation = side === "S" || side === "N" ? "h" : "v";
        const rowLabel = side === "S" ? this.height - row - 1 : this.height - row;
        const colNumber = side === "W" ? col - 1 : col;
        const colLabel = colNumber < 0 ? "z" : columnLabels[colNumber];
        return colLabel + rowLabel.toString() + orientation;
    }

    private endsWithHV(cell: string): boolean {
        // Check if the cell ends with an "h" or "v".
        const lastChar = cell[cell.length - 1];
        return lastChar === "h" || lastChar === "v";
    }

    public numplayers = 2;
    public currplayer!: playerid;
    public boardEdge!: Map<string, playerid>;
    public boardCell!: Map<string, playerid>;
    public gameover = false;
    public winner: playerid[] = [];
    public stack!: Array<IMoveState>;
    public results: Array<APMoveResult> = [];
    public variants: string[] = [];
    private width = 0;
    private height = 0;
    private dots: string[] = [];

    constructor(state?: ITemplState | string, variants?: string[]) {
        super();
        if (state === undefined) {
            if (variants !== undefined) {
                this.variants = [...variants];
            }
            const fresh: IMoveState = {
                _version: TemplGame.gameinfo.version,
                _results: [],
                _timestamp: new Date(),
                currplayer: 1,
                boardEdge: new Map(),
                boardCell: new Map(),
            };
            this.stack = [fresh];
        } else {
            if (typeof state === "string") {
                state = JSON.parse(state, reviver) as ITemplState;
            }
            if (state.game !== TemplGame.gameinfo.uid) {
                throw new Error(`The Templ game code cannot process a game of '${state.game}'.`);
            }
            this.gameover = state.gameover;
            this.winner = [...state.winner];
            this.variants = state.variants;
            this.stack = [...state.stack];
        }
        [this.width, this.height] = this.getBoardDimensions();
        this.load();
    }

    public load(idx = -1): TemplGame {
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
        this.boardEdge = new Map(state.boardEdge);
        this.boardCell = new Map(state.boardCell);
        this.lastmove = state.lastmove;
        return this;
    }

    private getBoardDimensions(): [number, number] {
        // Get board size from variants.
        if (this.variants !== undefined && this.variants.length > 0 && this.variants[0] !== undefined && this.variants[0].length > 0) {
            const sizeVariants = this.variants.filter(v => v.includes("size"));
            if (sizeVariants.length > 0) {
                // Extract the size from the variant.
                // Variant is expected to be in the format "size-6-7".
                const size = sizeVariants[0].match(/size-(\d+)x(\d+)/);
                if (size !== null && size.length === 3) {
                    return [parseInt(size[1], 10), parseInt(size[2], 10)];
                }
            }
        }
        return [5, 5]
    }

    public moves(player?: playerid): string[] {
        if (player === undefined) {
            player = this.currplayer;
        }
        if (this.gameover) { return []; }
        const moves: string[] = [];
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                const cell = this.coords2algebraic(i, j);
                if (this.boardCell.has(cell)) { continue; }
                moves.push(cell);
            }
        }
        for (let i = 0; i < this.width - 1; i++) {
            for (let j = 0; j < this.height; j++) {
                const wallV = this.coords2algebraic(i, j) + "v";
                if (this.boardEdge.has(wallV)) { continue; }
                moves.push(wallV);
            }
        }
        for (let i = 0; i < this.width; i++) {
            for (let j = 1; j < this.height; j++) {
                const wallH = this.coords2algebraic(i, j) + "h";
                if (this.boardEdge.has(wallH)) { continue; }
                moves.push(wallH);
            }
        }
        return moves;
    }

    public randomMove(): string {
        const moves = this.moves();
        return moves[Math.floor(Math.random() * moves.length)];
    }

    public handleClick(move: string, row: number, col: number, piece?: string): IClickResult {
        try {
            let newmove = "";
            const cell = this.coords2algebraic(col, row);
            if (piece === undefined || piece === "") {
                newmove = cell;
            } else {
                const newWall = this.render2wall(row, col, piece);
                newmove = newWall;
            }
            const result = this.validateMove(newmove) as IClickResult;
            if (!result.valid) {
                if (newmove.includes("/")) {
                    result.move = newmove.split("/")[0];
                } else if (newmove.includes("-")) {
                    result.move = move;
                } else {
                    result.move = "";
                }
            } else {
                result.move = newmove;
            }
            return result;
        } catch (e) {
            return {
                move,
                valid: false,
                message: i18next.t("apgames:validation._general.GENERIC", { move, row, col, piece, emessage: (e as Error).message })
            };
        }
    }

    public validateMove(m: string): IValidationResult {
        const result: IValidationResult = { valid: false, message: i18next.t("apgames:validation._general.DEFAULT_HANDLER") };
        if (m.length === 0) {
            result.valid = true;
            result.complete = -1;
            result.canrender = true;
            result.message = i18next.t("apgames:validation.templ.INITIAL_INSTRUCTIONS");
            return result;
        }
        result.valid = true;
        result.complete = 1;
        result.message = i18next.t("apgames:validation._general.VALID_MOVE");
        return result;
    }

    public move(m: string, { partial = false, trusted = false } = {}): TemplGame {
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
        if (this.endsWithHV(m)) {
            this.boardEdge.set(m, this.currplayer);
            const [, , orient] = this.splitWall(m);
            this.results.push({ type: "place", where: m, what: orient });
        } else {
            this.boardCell.set(m, this.currplayer);
            this.results.push({ type: "place", where: m });
        }
        if (partial) { return this; }

        this.lastmove = m;
        this.currplayer = this.currplayer % 2 + 1 as playerid;

        this.checkEOG();
        this.saveState();
        return this;
    }

    protected checkEOG(): TemplGame {
        const otherPlayer = this.currplayer % 2 + 1 as playerid;
        if (false) {
            this.gameover = true;
            this.winner = [otherPlayer];
        }
        if (this.gameover) {
            this.results.push({ type: "eog" });
            this.results.push({ type: "winners", players: [...this.winner] });
        }
        return this;
    }

    public state(): ITemplState {
        return {
            game: TemplGame.gameinfo.uid,
            numplayers: 2,
            variants: this.variants,
            gameover: this.gameover,
            winner: [...this.winner],
            stack: [...this.stack],
        };
    }

    protected moveState(): IMoveState {
        return {
            _version: TemplGame.gameinfo.version,
            _results: [...this.results],
            _timestamp: new Date(),
            currplayer: this.currplayer,
            lastmove: this.lastmove,
            boardEdge: new Map(this.boardEdge),
            boardCell: new Map(this.boardCell),
        };
    }

    public render(): APRenderRep {
        // Build piece string
        let pstr = "";
        for (let row = 0; row < this.height; row++) {
            if (pstr.length > 0) {
                pstr += "\n";
            }
            for (let col = 0; col < this.width; col++) {
                const cell = this.coords2algebraic(col, row);
                if (this.boardCell.has(cell)) {
                    const player = this.boardCell.get(cell);
                    if (player === 1) {
                        pstr += "A";
                    } else {
                        pstr += "B";
                    }
                } else {
                    pstr += "-";
                }
            }
        }
        pstr = pstr.replace(new RegExp(`-{${this.width}}`, "g"), "_");

        const markers: any[] = []
        for (const [wall, player] of this.boardEdge.entries()) {
            const [x, y, orient] = this.splitWall(wall);
            if (orient === "h") {
                markers.push({ type: "line", points: [{ row: y, col: x }, { row: y, col: x + 1 }], colour: player, width: 6, shorten: 0.075 });
            } else {
                markers.push({ type: "line", points: [{ row: y + 1, col: x + 1 }, { row: y, col: x + 1 }], colour: player, width: 6, shorten: 0.075 });
            }
        }

        // Build rep
        const rep: APRenderRep =  {
            board: {
                style: "squares-beveled",
                width: this.width,
                height: this.height,
                strokeWeight: 1,
                markers,
            },
            options: ["clickable-edges"],
            legend: {
                A: [{ name: "piece", colour: 1 }],
                B: [{ name: "piece", colour: 2 }],
            },
            pieces: pstr,
        };

        // Add annotations
        rep.annotations = [];
        if (this.stack[this.stack.length - 1]._results.length > 0) {
            for (const move of this.stack[this.stack.length - 1]._results) {
                if (move.type === "place") {
                    if (move.what === undefined) {
                        const [x, y] = this.algebraic2coords(move.where!);
                        rep.annotations.push({ type: "enter", targets: [{ row: y, col: x }] });
                    } else {
                        const [x, y, orient] = this.splitWall(move.where!);
                        if (orient === "h") {
                            markers.push({ type: "line", points: [{ row: y, col: x }, { row: y, col: x + 1 }], colour: "#FFFF00", width: 6, shorten: 0.075, opacity: 0.5 });
                        } else {
                            markers.push({ type: "line", points: [{ row: y + 1, col: x + 1 }, { row: y, col: x + 1 }], colour: "#FFFF00", width: 6, shorten: 0.075, opacity: 0.5 });
                        }
                    }
                }
            }
        }
        if (this.dots.length > 0) {
            const points = [];
            for (const cell of this.dots) {
                const [x, y] = this.algebraic2coords(cell);
                points.push({ row: y, col: x });
            }
            rep.annotations.push({ type: "dots", targets: points as [RowCol, ...RowCol[]] });
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

    public clone(): TemplGame {
        return new TemplGame(this.serialize());
    }
}
