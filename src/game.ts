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
     * The game is in the playing phase, where players take turns to attack
     */
    playing,

    /**
     * The game is in the game over phase, where the game has ended
     */
    gameOver,
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
    waitingForOtherPlayer: "W",
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

/**
 * Declares the game class, which contains the game logic and state
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Game {
    /**
     * The radio group ID for the game for players to join
     */
    public readonly radio = new GameRadio();

    /**
     * The id of the player. Automatically generated to a random number
     */
    public playerId: number = randint(1, 2147483647);

    /**
     * The current game state
     */
    public state: GameState = GameState.connecting;

    /**
     * Creates a new game
     */
    public constructor() {
        // Add listeners for connecting to the game
        this.connect();
    }

    /**
     * Logs a message with extra info like the player id and timestamp
     * @param message - The message to log
     */
    public log(message: string) {
        console.log(`${this.playerId} @ ${input.runningTimeMicros()}: ${message}`)
    }

    /**
     * Places the ships on the board
     */
    public placeShips(): void {
        // TODO: Implement ship placement
        console.log("Placing ships...");
    }

    /**
     * Connects to the game
     */
    public connect(): void {
        // If the other player sent a `playerJoined` message, this player is the first person to join
        this.radio.on(RadioMessageKeyRecord.playerJoined, (otherPlayerId: number): void => {
            this.log(`Recieved playerJoined with id ${otherPlayerId}`);

            // Set the game state to setup
            if (!(this.state === GameState.connecting)) {
                console.warn(`Unexpected game state: ${this.state}. Expected ${GameState.connecting}`);
                return;
            }
            this.state = GameState.setup;

            // Place the ships
            this.placeShips();

            // Send a confirmation message to the other player
            this.radio.sendValue(RadioMessageKeyRecord.proceedingToSetup, otherPlayerId);
            this.log(`Sending proceedingToSetup with other id ${otherPlayerId}`);
        });

        // If the other player sent a `proceedingToSetup` message, this player is the second person to join
        this.radio.on(RadioMessageKeyRecord.proceedingToSetup, (thisPlayerId: number): void => {
            this.log(`Recieved proceedingToSetup with id ${thisPlayerId}`);

            // Confirm that the id is the same
            if (!this.playerId || this.playerId !== thisPlayerId) {
                // return;
                console.warn(`Player IDs do not match. Expected ${this.playerId}, got ${thisPlayerId}`);
            }

            // Set the game state to setup
            if (!(this.state === GameState.connecting)) {
                console.warn(`Unexpected game state: ${this.state}. Expected ${GameState.connecting}`);
                return;
            }
            this.state = GameState.setup;

            // Place the ships
            this.placeShips();
        });

        // When the logo is pressed
        input.onButtonPressed(Button.AB, (): void => {
            // Send a message to the other player
            this.radio.sendValue(RadioMessageKeyRecord.playerJoined, this.playerId);
            this.log(`Sending playerJoined with id ${this.playerId}`);
            this.log("Waiting for other player to join...");

            // Show the waiting for other player message
            basic.showString(DisplayCode.waitingForOtherPlayer);
        });
    }
}
