/**
 * @file Declares utility functions for radio communication
 */

/**
 * The type of radio message.
 * The value should be a short string (3 characters or less) to save memory.
 * The first character should be a lowercase letter and denote the type of message.
 * - `n` for number
 * - `c` for coordinate
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const RadioMessageKeyRecord = {
    /**
     * A player has joined the game
     * - Payload is of type `number`: the player number that joined.
     */
    playerJoined: "nPj",

    /**
     * A player has left the game.
     * - Payload is of type `number`: the player number that left.
     */
    playerLeft: "nPl",

    /**
     * A player is proceeding to setup the game.
     * - Payload is of type `number`: other player's player number.
     */
    proceedingToSetup: "nP2",

    /**
     * A player is attacking a coordinate.
     * - Payload is of type `Coordinate`: the coordinate being attacked.
     */
    attack: "cAt",

    /**
     * The result of an attack - hit.
     * - Payload is of type `Coordinate`: the coordinate that was hit.
     */
    hit: "cHt",

    /**
     * The result of an attack - miss.
     * - Payload is of type `Coordinate`: the coordinate that was missed.
     */
    miss: "cMs",

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - const is not supported in this typescript
} as const;

/**
 * The possible values for the keys of RadioMessage.
 * @example "nPj" | "nPl" | "cHt"
 */
type RadioMessageKeyValues = (typeof RadioMessageKeyRecord)[keyof typeof RadioMessageKeyRecord];

/**
 * The values that can be sent with a radio message
 * @example { nPj: number, cHt: Coordinate }
 */
// ! Note: this also doesn't work because the version of TypeScript doesn't support a computed property name in an interface .-.
type RadioMessageValues = {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    [RadioMessageKeyRecord.playerJoined]: number;
    // @ts-ignore
    [RadioMessageKeyRecord.playerLeft]: number;
    // @ts-ignore
    [RadioMessageKeyRecord.proceedingToSetup]: number;
    // @ts-ignore
    [RadioMessageKeyRecord.attack]: Coordinate;
    // @ts-ignore
    [RadioMessageKeyRecord.hit]: Coordinate;
    // @ts-ignore
    [RadioMessageKeyRecord.miss]: Coordinate;
    /* eslint-enable @typescript-eslint/ban-ts-comment */
} & {
    [K in RadioMessageKeyValues]: number | Coordinate;
};
// ! Note: this doesn't work because the version of TypeScript used in the micro:bit doesn't support template literal types
// type RadioMessageValues = {
//     // suppress typescript lol
//     /* eslint-disable prettier/prettier, @typescript-eslint/ban-ts-comment */
//     // @ts-ignore
//     [K in RadioMessageKeyRecord]:
//         // @ts-ignore
//         K extends `n${string}` ? number
//         // @ts-ignore
//         : K extends `c${string}` ? Coordinate
//         // @ts-ignore
//         : never;
//     /* eslint-enable prettier/prettier, @typescript-eslint/ban-ts-comment */
// };

/**
 * A callback that is called when a radio message is received
 * @template T - The type of radio message. Should be a key of {@link RadioMessageKeyRecord}
 */
// ! Note: this doesn't work because enum and interface keys are weird on this typescript
type RadioMessageCallback<T extends RadioMessageKeyValues> = (value: RadioMessageValues[T]) => void;

/**
 * Handles radio communication for the game
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class GameRadio {
    /**
     * The radio group ID for the game for players to join
     */
    public static readonly radioGroupId: number = 64;

    /**
     * Converts a 2D coordinate to a single number
     * @param coordinates - The 2D coordinate to convert
     * @returns The single number representation of the coordinate
     * @example
     * GameRadio.coordinatesToNumber([0, 0]) // 0
     * GameRadio.coordinatesToNumber([1, 0]) // 1
     * GameRadio.coordinatesToNumber([0, 1]) // 5
     * GameRadio.coordinatesToNumber([2, 3]) // 17
     */
    public static coordinatesToNumber(coordinates: Coordinate): number {
        return coordinates[0] + 5 * coordinates[1];
    }

    /**
     * Converts a single number to a 2D coordinate
     * @param number - The single number to convert
     * @returns The 2D coordinate representation of the number
     * @example
     * GameRadio.numberToCoordinates(0) // [0, 0]
     * GameRadio.numberToCoordinates(1) // [1, 0]
     * GameRadio.numberToCoordinates(5) // [0, 1]
     * GameRadio.numberToCoordinates(17) // [2, 3]
     */
    public static numberToCoordinates(number: number): Coordinate {
        return [number % 5, Math.floor(number / 5)];
    }

    // private eventListeners: Record<RadioMessageKeyRecord, RadioMessageCallback<RadioMessageKeyRecord>[]>;

    /**
     * The event listeners for the radio messages
     */
    private eventListeners: {
        [T in RadioMessageKeyValues]?: RadioMessageCallback<T>[];
    } = {};

    /**
     * Create a new GameRadio instance
     */
    public constructor() {
        // Connect to the radio
        radio.setGroup(GameRadio.radioGroupId);

        // Send a test message so the simulator shows 2 microbits
        radio.sendNumber(0);

        // Set the message handler
        radio.onReceivedValue((messageType: string, value: number): void => {
            // Debug
            console.log(`Received message: "${messageType}" with value "${value}"`);

            // Get the key for the message type
            const key = messageType as RadioMessageKeyValues;

            // Get the callbacks for the message type
            const callbacks = this.eventListeners[key];

            // If there are no callbacks, return
            if (!callbacks) {
                return;
            }

            // Get the value of the message
            // ! Note: enum/interface keys
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            let messageValue: RadioMessageValues[RadioMessageKeyRecord];

            console.log(key.charAt(0));

            // Determine the type of message and convert the value
            switch (key.charAt(0)) {
                case "n":
                    messageValue = value;
                    break;
                case "c":
                    messageValue = GameRadio.numberToCoordinates(value);
                    break;
                default:
                    // By default, just use the value
                    console.warn(`Unknown message type: ${key}`);
                    messageValue = value;
                    break;
            }

            // Call all the callbacks
            for (let i = 0; i < callbacks.length; i++) {
                const callback = callbacks[i];

                // @ts-expect-error - The value is the correct type
                callback(messageValue);
            }
        });
    }

    /**
     * Add a callback to be called when a radio message is received
     * @param messageType - The type of radio message to listen for
     * @param callback - The callback to call when the message is received
     * @template T - The type of radio message. Should be a key of {@link RadioMessageKeyRecord}
     */
    public on<T extends RadioMessageKeyValues>(messageType: T, callback: RadioMessageCallback<T>): void {
        // Create the array if it doesn't exist
        if (!this.eventListeners[messageType]) {
            this.eventListeners[messageType] = [];
        }

        // Add the callback to the array
        this.eventListeners[messageType].push(callback);
    }

    /**
     * Send a radio message
     * @param messageType - The type of radio message to send
     * @param value - The value of the message to send
     * @template T - The type of radio message. Should be a key of {@link RadioMessageKeyRecord}
     */
    public sendValue(messageType: string, value: number | Coordinate): void {
        // Get the value of the message
        let messageValue: number;

        // Determine the type of message and convert the value
        // console.log(messageType.charAt(0));

        switch (messageType.charAt(0)) {
            case "n":
                messageValue = value as number;

                // Debug
                console.log(`Sending message: "${messageType}" with value "${messageValue}"`);

                break;
            case "c":
                messageValue = GameRadio.coordinatesToNumber(value as Coordinate);

                // Debug
                console.log(
                    `Sending message: "${messageType}" with value "${messageValue}", coordinates: ${(value as Coordinate)[0]}, ${(value as Coordinate)[1]}`,
                );

                break;
            default:
                // By default, just use the value
                console.warn(`Unknown message type: ${messageType}`);
                messageValue = value as number;
                console.warn(`Sending message: "${messageType}" with value "${messageValue}"`);
                break;
        }

        // Send the message
        radio.sendValue(messageType as never as string, messageValue);
    }
}
