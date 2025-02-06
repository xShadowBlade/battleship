/**
 * @file Battleship using micro:bit
 */

/**
 * The type of radio message.
 * The value should be a short string (3 characters or less) to save memory.
 * The first character should be a lowercase letter and denote the type of message.
 * - `n` for number
 * - `c` for coordinate
 */
interface IRadioMessageEnum {
    /**
     * A player has joined the game
     * - Payload is of type `number`: the player number that joined.
     */
    playerJoined: "nPj";

    /**
     * A player has left the game.
     * - Payload is of type `number`: the player number that left.
     */
    playerLeft: "nPl";

    /**
     * A player is proceeding to setup the game.
     * - Payload is of type `number`: other player's player number.
     */
    proceedingToSetup: "nP2";

    /**
     * A player has placed all their ships.
     * - Payload is of type `number`: the player number that placed all their ships.
     */
    shipsPlaced: "nPl";

    /**
     * A player is starting the game.
     * - Payload is of type `number`: the player number that started the game.
     */
    startGame: "nSg";

    /**
     * A player is attacking a coordinate.
     * - Payload is of type `Coordinate`: the coordinate being attacked.
     */
    attack: "cAt";

    /**
     * The result of an attack - hit.
     * - Payload is of type `Coordinate`: the coordinate that was hit.
     */
    hit: "cHt";

    /**
     * The result of an attack - miss.
     * - Payload is of type `Coordinate`: the coordinate that was missed.
     */
    miss: "cMs";
}

/**
 * See {@link IRadioMessageEnum} for a full description
 */
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
const RadioMessageEnum: IRadioMessageEnum = {
    playerJoined: "nPj",
    playerLeft: "nPl",
    proceedingToSetup: "nP2",
    shipsPlaced: "nPl",
    startGame: "nSg",
    attack: "cAt",
    hit: "cHt",
    miss: "cMs",
};

// Create a new game
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const battleshipGameInstance = new Game();
