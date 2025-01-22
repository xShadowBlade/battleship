/**
 * @file Game logic class
 */
import { shipClasses } from "./ship";
import type { ShipClass } from "./ship";

/**
 * Declares the game class, which contains the game logic and state
 */
export class Game {
    /**
     * The radio group ID for the game for players to join
     */
    public static readonly RADIO_GROUP_ID: uint8 = 64;

    /**
     * The number of players in the game
     */
    // public static readonly PLAYER_COUNT: uint8 = 2;

    public constructor() {
        // Connect to the radio
        radio.setGroup(Game.RADIO_GROUP_ID);
    }
}
