/**
 * @file Game logic class
 */

/**
 * Possible states of the game
 */
const enum GameState {
    /**
     * The game is in the connecting phase, where players are joining the game.
     * Players can join the game by holding A+B on the micro:bit at the same time.
     */
    connecting,

    /**
     * The game is in the setup phase, where players place their ships
     */
    setup,

    /**
     * The game is in the waiting for other player to setup phase, where one player has placed their ships
     * and is waiting for the other player to place their ships
     */
    waitingForOtherPlayerToSetup,

    /**
     * The game is in the playing phase, where players take turns to attack
     */
    playing,

    /**
     * The game is in the game over phase, where the game has ended
     */
    gameOver,
}

/**
 * The player number of this client
 *
 */
const enum PlayerNumber {
    /**
     * Not yet assigned a number
     */
    notConnected,
    one,
    two,
}

/**
 * Possible display codes
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const DisplayCode = {
    /**
     * Waiting for the other player to join,
     * after the player has sent a `playerJoined` message
     */
    waitingForOtherPlayer: "Z",
};

abstract class RenderableObject {
    public abstract getRenderCoordinates(): Coordinate[];
}

/**
 * Possible error codes
 */
// enum ErrorCodes {
//     /**
//      * The player ID does not match the expected player ID
//      */
//     playerIdMismatch = "PID",
// }

type GameRender = RenderableObject[];
type GameRenderSet = GameRender[];

/**
 * The game graphics class, which handles the game's graphics.
 */
class GameGraphics {
    /***
     * A list of the coordinates of the game render sets
     */
    private readonly gameRenders: GameRenderSet = [
        // The ship placement render set
        [],
        // The attack render set
        [],
    ];

    /**
     * The current render set index that is being displayed
     */
    private _currentRenderSetIndex = 0;

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    public constructor() {
        // Set the initial render set
    }

    public get currentRenderSetIndex(): number {
        return this._currentRenderSetIndex;
    }

    public set currentRenderSetIndex(index: number) {
        this._currentRenderSetIndex = index;
        this.render();
    }

    /**
     * Adds a render set to the game renders
     * @param renderSet - the render set to add
     */
    public addRenderSet(renderSet: GameRender = []): void {
        this.gameRenders.push(renderSet);
    }

    /**
     * Adds a coordinate list to the current render set
     * @param index - the index of the render set
     * @param sprite - the sprite to add
     */
    public addCoordinateListToRenderSet(index: number, sprite: RenderableObject): void {
        this.gameRenders[index].push(sprite);
    }

    /**
     * Renders the current render set
     */
    public render(): void {
        // Clear the screen
        basic.clearScreen();

        // Iterate over each coordinate list in the current render set
        // for (const coordinateList of this.gameRenders[this.currentRenderSetIndex]) {
        for (let i = 0; i < this.gameRenders[this.currentRenderSetIndex].length; i++) {
            const coordinateList = this.gameRenders[this.currentRenderSetIndex][i].getRenderCoordinates();

            // Iterate over each coordinate in the coordinate list
            // for (const coordinate of coordinateList) {
            for (let j = 0; j < coordinateList.length; j++) {
                const coordinate = coordinateList[j];

                // Plot the coordinate on the LED grid
                led.plot(coordinate[0], coordinate[1]);
            }
        }
    }
}

/**
 * A cursor to move around the screen
 */
class Cursor implements RenderableObject {
    /**
     * Whether or not the cursor is blinking
     * @default true
     */
    // public static IS_BLINKING = true;

    /**
     * How long to hold the blink, in milliseconds (showing)
     * @default 1000
     */
    // public static BLINK_DURATION_HOLD_MS = 1000;

    /**
     * How long to wait for the blink, in milliseconds (not showing)
     * @default 1000
     */
    // public static BLINK_DURATION_WAIT_MS = 5000;

    /**
     * The x coordinate
     */
    public x: uint8;

    /**
     * The y coordinate
     */
    public y: uint8;

    /**
     * Whether or not the cursor is hidden
     */
    public isHidden = false;

    /**
     * Creates a new cursor
     * @param x - the starting x coordinate
     * @param y - the starting y coordinate
     */
    public constructor(x = 0, y = 0) {
        // Set the values and normalize
        this.x = x;
        this.y = y;
        this.normalizeCoordinates();

        // Register event handlers

        // B to move right 1
        input.onButtonPressed(Button.B, () => this.moveCursor(1, 0));

        // A to move down 1
        input.onButtonPressed(Button.A, () => this.moveCursor(0, 1));
    }

    /**
     * @returns The coordinates as [x, y]
     */
    public getCoordinate(): Coordinate {
        return [this.x, this.y];
    }

    public getRenderCoordinates(): Coordinate[] {
        return this.isHidden ? [] : [this.getCoordinate()];
    }

    /**
     * Moves the cursor a specifed amount and normalize.
     * @param x - the x coordinate to move by
     * @param y - the y coordinate to move by
     */
    private moveCursor(x: number, y: number): void {
        this.x += x;
        this.y += y;

        this.normalizeCoordinates();
    }

    /**
     * Mutates `this.x` and `this.y` to be within 0-4
     */
    private normalizeCoordinates(): void {
        // Normalize x
        this.x = this.x % 5;
        if (this.x < 0) this.x += 5;

        // Normalize y
        this.y = this.y % 5;
        if (this.y < 0) this.y += 5;
    }
}

/**
 * Declares the game class, which contains the game logic and state
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Game {
    public readonly radio = new GameRadio();
    private readonly graphics = new GameGraphics();
    public readonly cursor = new Cursor();

    /**
     * The current game state
     */
    public state: GameState = GameState.connecting;

    private otherPlayerState: GameState = GameState.connecting;

    /**
     * The client's player number
     */
    public playerNumber: PlayerNumber = PlayerNumber.notConnected;

    /**
     * The current turn
     */
    private currentTurn: PlayerNumber = PlayerNumber.one;

    /**
     * The ships placed by the player
     */
    private shipsPlaced: Ship[] = [];

    /**
     * Creates a new game
     */
    public constructor() {
        this.cursor.isHidden = true;

        // Add listeners for connecting to the game
        this.connect();
    }

    /**
     * @returns Whether or not it is the player's turn
     */
    public isMyTurn(): boolean {
        return this.playerNumber === this.currentTurn;
    }

    /**
     * Connects to the game
     */
    public connect(): void {
        // If the other player sent a `playerJoined` message, this player is the second person to join
        this.radio.on(RadioMessageEnum.playerJoined, (otherPlayerId: number): void => {
            // Set the game state to setup
            if (this.state !== GameState.connecting) {
                console.warn(`Unexpected game state: ${this.state}. Expected ${GameState.connecting}`);
                return;
            }
            this.state = GameState.setup;
            this.playerNumber = PlayerNumber.two;

            // Send a confirmation message to the other player
            this.radio.sendValue(RadioMessageEnum.proceedingToSetup, otherPlayerId);
            this.otherPlayerState = GameState.setup;

            // Blink
            basic.showString(DisplayCode.waitingForOtherPlayer);
            basic.pause(1000);
            basic.clearScreen();
            // Animation
            game.addScore(0);

            // Place the ships
            this.placeShips();
        });

        // If the other player sent a `proceedingToSetup` message, this player is the first person to join
        this.radio.on(RadioMessageEnum.proceedingToSetup, (thisPlayerId: number): void => {
            // this.radio.log(`Received proceedingToSetup with id ${thisPlayerId}`);

            // Confirm that the id is the same
            if (!this.radio.playerId || this.radio.playerId !== thisPlayerId) {
                // return;
                this.radio.log(`[WARN]: Player IDs do not match. Expected ${this.radio.playerId}, got ${thisPlayerId}`);
            }

            // Set the game state to setup
            if (this.state !== GameState.connecting) {
                this.radio.log(`[WARN]: Unexpected game state: ${this.state}. Expected ${GameState.connecting}`);
                return;
            }
            this.state = GameState.setup;
            this.otherPlayerState = GameState.setup;
            this.playerNumber = PlayerNumber.one;

            // Blink
            basic.pause(1000);
            basic.clearScreen();
            game.addScore(0);

            // Place the ships
            this.placeShips();
        });

        // When the logo is pressed
        input.onButtonPressed(Button.AB, (): void => {
            // If it is not in the connecting state, return
            if (this.state !== GameState.connecting) return;

            // Send a message to the other player
            this.radio.sendValue(RadioMessageEnum.playerJoined, this.radio.playerId);
            // this.radio.log(`Sending playerJoined with id ${this.playerId}`);
            // this.radio.log("Waiting for other player to join...");

            // Show the waiting for other player message
            basic.showString(DisplayCode.waitingForOtherPlayer);
        });
    }

    /**
     * Places the ships on the board
     */
    public placeShips(): void {
        // TODO: refactor
        this.radio.log("Placing ships...");
        this.cursor.isHidden = false;
        this.state = GameState.waitingForOtherPlayerToSetup;

        // When the other player has placed their ships
        this.radio.on(RadioMessageEnum.shipsPlaced, (otherPlayerId: number): void => {
            // If the current game state is waiting for the other player to setup, send a message to the other player and start the game
            if (this.state === GameState.waitingForOtherPlayerToSetup) {
                // Set the game state to playing
                this.state = GameState.playing;

                // Send a message to the other player to start the game
                this.radio.sendValue(RadioMessageEnum.startGame, this.radio.playerId);
                this.otherPlayerState = GameState.playing;

                // Show a message indicating that the game is starting
                basic.showString("Start");

                // Start the game
                this.playGame();
                return;
            }
        });

        this.radio.on(RadioMessageEnum.startGame, (otherPlayerId: number): void => {
            // Set the game state to playing
            this.state = GameState.playing;
            this.otherPlayerState = GameState.playing;

            // Show a message indicating that the game is starting
            basic.showString("Start");

            // Start the game
            this.playGame();
        });

        // Iterate over each ship class
        // for (const shipClass of shipClasses) {
        for (let shipIndex = 0; shipIndex < shipClasses.length; shipIndex++) {
            const shipClass = shipClasses[shipIndex];

            for (let i = 0; i < shipClass.count; i++) {
                let shipPlaced = false;

                while (!shipPlaced) {
                    // Show the cursor position

                    // Wait for the user to press A or B to move the cursor
                    basic.pause(100);

                    // Check if the user pressed A+B to place the ship
                    if (input.buttonIsPressed(Button.AB)) {
                        // Create a new ship at the cursor position
                        const ship = new Ship(shipClass.name, this.cursor.x, this.cursor.y, ShipOrientation.horizontal);

                        // Check if the ship coordinates are valid
                        if (ship.isCoordinatesValid() === true) {
                            // Place the ship
                            shipPlaced = true;

                            // Show the ship on the LED grid
                            // for (const coordinate of ship.getCoordinates()) {
                            //     led.plot(coordinate[0], coordinate[1]);
                            // }
                            this.graphics.addCoordinateListToRenderSet(0, ship);

                            this.shipsPlaced.push(ship);

                            // Log the ship placement
                            this.radio.log(`Placed ${shipClass.name} at (${this.cursor.x}, ${this.cursor.y})`);
                        } else {
                            // Show an error message
                            basic.showString("Err");
                            basic.pause(500);
                            basic.clearScreen();
                        }
                    }
                }
            }
        }

        // Show a message indicating that all ships have been placed
        basic.showString("Done");

        // Send a message to the other player to indicate that the ships have been placed
        this.radio.sendValue(RadioMessageEnum.shipsPlaced, this.radio.playerId);
    }

    /**
     * Plays the game
     */
    public playGame(): void {
        // When the player presses A+B, they confirm an attack
        input.onButtonPressed(Button.AB, () => {
            if (!this.isMyTurn()) {
                basic.showString("Wait");
                return;
            }

            // Send attack coordinates to the other player
            this.radio.sendValue(RadioMessageEnum.attack, this.cursor.getCoordinate());
            // isMyTurn = false;
            // basic.showString("Sent");

            this.currentTurn = this.currentTurn === PlayerNumber.one ? PlayerNumber.two : PlayerNumber.one;
        });

        // When the other player attacks
        this.radio.on(RadioMessageEnum.attack, (coordinate: Coordinate): void => {
            // const coordinate = this.decodeCoordinate(encodedCoord);

            // Check if the coordinate is a hit
            if (this.isHit(coordinate)) {
                basic.showString("Hit");
                this.radio.sendValue(RadioMessageEnum.hit, coordinate);
            } else {
                basic.showString("Miss");
                this.radio.sendValue(RadioMessageEnum.miss, coordinate);
            }
        });

        // Receive hit/miss response from the opponent
        this.radio.on(RadioMessageEnum.hit, (coordinate: Coordinate): void => {
            // this.markEnemyHit(coordinate);
            basic.showString("Hit!");
            // isMyTurn = true;

            // this.currentTurn = this.currentTurn === PlayerNumber.one ? PlayerNumber.two : PlayerNumber.one;
        });

        this.radio.on(RadioMessageEnum.miss, (coordinate: Coordinate): void => {
            basic.showString("Miss!");
            // isMyTurn = true;

            // this.currentTurn = this.currentTurn === PlayerNumber.one ? PlayerNumber.two : PlayerNumber.one;
        });
    }

    /**
     * @param coordinate - The coordinate to check
     * @returns Whether or not the coordinate is a hit
     */
    private isHit(coordinate: Coordinate): boolean {
        // For each ship, check if the coordinate is a hit
        // for (const ship of this.shipsPlaced) {
        for (let i = 0; i < this.shipsPlaced.length; i++) {
            const ship = this.shipsPlaced[i];
            const shipCoordinates = ship.getCoordinates();

            // for (const shipCoordinate of ship.getCoordinates()) {
            for (let j = 0; j < shipCoordinates.length; j++) {
                const shipCoordinate = shipCoordinates[j];

                if (shipCoordinate[0] === coordinate[0] && shipCoordinate[1] === coordinate[1]) {
                    return true;
                }
            }
        }

        return false;
    }
}
