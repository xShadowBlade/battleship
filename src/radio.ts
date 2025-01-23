/**
 * @file Declares utility functions for radio communication
 */

import type { Coordinate } from "./ship";

/**
 * The type of radio message.
 * The value should be a short string (3 characters or less) to save memory.
 * The first character should be a lowercase letter and denote the type of message.
 * - `n` for number
 * - `c` for coordinate
 */
export enum RadioMessageKey {
    /**
     * A player has joined the game
     * - Payload is of type `number`: the player number that joined.
     */
    PlayerJoined = "nPj",

    /**
     * A player has left the game.
     * - Payload is of type `number`: the player number that left.
     */
    PlayerLeft = "nPl",

    /**
     * A player is attacking a coordinate.
     * - Payload is of type `Coordinate`: the coordinate being attacked.
     */
    Attack = "cAt",

    /**
     * The result of an attack - hit.
     * - Payload is of type `Coordinate`: the coordinate that was hit.
     */
    Hit = "cHt",

    /**
     * The result of an attack - miss.
     * - Payload is of type `Coordinate`: the coordinate that was missed.
     */
    Miss = "cMs",
}

/**
 * The values that can be sent with a radio message
 */
// ! Note: this also doesn't work because the version of TypeScript doesn't support a computed property name in an interface .-.
export interface RadioMessageValues {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    [RadioMessageKey.PlayerJoined]: number;
    // @ts-ignore
    [RadioMessageKey.PlayerLeft]: number;
    // @ts-ignore
    [RadioMessageKey.Attack]: Coordinate;
    // @ts-ignore
    [RadioMessageKey.Hit]: Coordinate;
    // @ts-ignore
    [RadioMessageKey.Miss]: Coordinate;
    /* eslint-enable @typescript-eslint/ban-ts-comment */
}
// ! Note: this doesn't work because the version of TypeScript used in the micro:bit doesn't support template literal types
// type RadioMessageValues = {
//     // suppress typescript lol
//     /* eslint-disable prettier/prettier, @typescript-eslint/ban-ts-comment */
//     // @ts-ignore
//     [K in RadioMessageKey]:
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
 * @template T - The type of radio message. Should be a key of {@link RadioMessageKey}
 */
export type RadioMessageCallback<T extends RadioMessageKey> = (value: RadioMessageValues[T]) => void;

/**
 * Handles radio communication for the game
 */
export class GameRadio {
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

    // private eventListeners: Record<RadioMessageKey, RadioMessageCallback<RadioMessageKey>[]>;

    /**
     * The event listeners for the radio messages
     */
    private eventListeners: {
        [T in RadioMessageKey]?: RadioMessageCallback<T>[];
    } = {};

    /**
     * The message handler for the radio messages
     * @param messageType - The type of the message received
     * @param value - The value of the message received
     */
    private onMessageReceived(messageType: string, value: number): void {
        // Debug
        console.log(`Received message: "${messageType}" with value "${value}"`);

        // Get the key for the message type
        const key = messageType as RadioMessageKey;

        // Get the callbacks for the message type
        const callbacks = this.eventListeners[key];

        // If there are no callbacks, return
        if (!callbacks) {
            return;
        }

        // Get the value of the message
        let messageValue: RadioMessageValues[RadioMessageKey];

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
        for (const callback of callbacks) {
            // @ts-expect-error - The value is the correct type
            callback(messageValue);
        }
    }

    /**
     * Create a new GameRadio instance
     */
    public constructor() {
        // Connect to the radio
        radio.setGroup(GameRadio.radioGroupId);

        // Set the message handler
        radio.onReceivedValue(this.onMessageReceived);
    }

    /**
     * Add a callback to be called when a radio message is received
     * @param messageType - The type of radio message to listen for
     * @param callback - The callback to call when the message is received
     * @template T - The type of radio message. Should be a key of {@link RadioMessageKey}
     */
    public on<T extends RadioMessageKey>(messageType: T, callback: RadioMessageCallback<T>): void {
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
     * @template T - The type of radio message. Should be a key of {@link RadioMessageKey}
     */
    public sendValue<T extends RadioMessageKey>(messageType: T, value: RadioMessageValues[T]): void {
        // Debug
        console.log(`Sending message: "${messageType}" with value "${value}"`);

        // Get the key for the message type
        const key = messageType as string;

        // Get the value of the message
        let messageValue: number;

        // Determine the type of message and convert the value
        switch (key.charAt(0)) {
            case "n":
                messageValue = value as number;
                break;
            case "c":
                messageValue = GameRadio.coordinatesToNumber(value as Coordinate);
                break;
            default:
                // By default, just use the value
                console.warn(`Unknown message type: ${key}`);
                messageValue = value as number;
                break;
        }

        // Send the message
        radio.sendValue(key, messageValue);
    }
}
