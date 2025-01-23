/**
 * @file Game logic class
 */
import { GameRadio } from "./radio";

/**
 * Declares the game class, which contains the game logic and state
 */
export class Game {
    /**
     * The radio group ID for the game for players to join
     */
    public radio = new GameRadio();

    /**
     * Creates a new game
     */
    public constructor() {
        // this.radio = new GameRadio();
    }
}
