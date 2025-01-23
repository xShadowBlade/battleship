/**
 * @file Definition of ship classes and ships
 */

/**
 * A class of ship such as Carrier, Battleship, Cruiser, Submarine, Destroyer
 */
interface ShipClass {
    /**
     * The name of the ship class
     * @example "Carrier"
     */
    name: string;

    /**
     * The size of the ship class
     * @example 5
     */
    // Use uint8 for memory efficiency
    size: uint8;

    /**
     * The number of ships of this class
     * @example 1
     */
    count: uint8;
}

/**
 * A list of ship classes
 */
const shipClasses = [
    {
        name: "Carrier",
        size: 5,
        count: 1,
    },
    {
        name: "Battleship",
        size: 4,
        count: 1,
    },
    {
        name: "Cruiser",
        size: 3,
        count: 1,
    },
    {
        name: "Submarine",
        size: 3,
        count: 1,
    },
    {
        name: "Destroyer",
        size: 2,
        count: 1,
    },

    // ! Note: in this typescript version, the following line doesn't work because the version of TypeScript doesn't support as const or satisfies ShipClass[]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
] as const;
// ] as const satisfies ShipClass[];

/**
 * The name of a ship class, from the list of ship classes
 */
type ShipClassName = (typeof shipClasses)[number]["name"];

/**
 * The orientation of a ship, either horizontal or vertical
 */
enum ShipOrientation {
    /**
     * The ship is placed horizontally, from left (x = 0) to right (+x)
     */
    horizontal,

    /**
     * The ship is placed vertically, from top (y = 0) to bottom (+y)
     */
    vertical,
}

/**
 * A 2D coordinate on the 5x5 LED grid.
 * The first element is the x coordinate, the second element is the y coordinate.
 * - The x coordinate is the column number, ranging from 0 to 4. *0 is the leftmost column*.
 * - The y coordinate is the row number, ranging from 0 to 4. *0 is the top row*.
 */
type Coordinate = [uint8, uint8];

/**
 * Represents a generic ship of any ship class
 */
class Ship {
    /**
     * The name of the ship class.
     * Gotten from the ship class object.
     */
    public name: ShipClassName;

    /**
     * The size of the ship class.
     */
    public size: uint8;

    /**
     * The x coordinate of the ship's head
     */
    public x: uint8;

    /**
     * The y coordinate of the ship's head
     */
    public y: uint8;

    /**
     * The orientation of the ship
     */
    public orientation: ShipOrientation;

    /**
     * Create a new ship
     * @param name - The name of the ship class
     * @param x - The x coordinate of the ship's head
     * @param y - The y coordinate of the ship's head
     * @param orientation - The orientation of the ship
     * @example new Ship("Carrier", 0, 0, ShipOrientation.Horizontal)
     */
    public constructor(name: ShipClassName, x: number, y: number, orientation: ShipOrientation) {
        // Set the parameters based on the ship class and constructor arguments
        this.name = name;
        this.size = shipClasses.find((shipClass: ShipClass) => shipClass.name === name).size;
        this.x = x;
        this.y = y;
        this.orientation = orientation;
    }

    /**
     * Get the coordinates of the ship
     * @returns An array of coordinates
     * @example [ [0, 0], [1, 0], [2, 0], [3, 0], [4, 0] ] // Carrier at (0, 0) horizontally
     * @example [ [0, 0], [0, 1], [0, 2] ] // Cruiser at (0, 0) vertically
     */
    public getCoordinates(): Coordinate[] {
        const coordinates: Coordinate[] = [];

        // Loop through the size of the ship and add the coordinates to the array
        for (let i = 0; i < this.size; i++) {
            if (this.orientation === ShipOrientation.horizontal) {
                coordinates.push([this.x + i, this.y]);
            } else {
                coordinates.push([this.x, this.y + i]);
            }
        }

        return coordinates;
    }

    /**
     * Check if the ship coordinates are valid
     * - The ship must be within the 5x5 grid (x and y coordinates must be between 0 and 4)
     * @param coordinates - The coordinates of the ship
     * @returns True if the coordinates are valid, false otherwise
     */
    private isCoordinatesValid(coordinates: Coordinate[] = this.getCoordinates()): boolean {
        // Check if the coordinates are within the grid
        for (let i = 0; i < coordinates.length; i++) {
            const [x, y] = coordinates[i];

            if (x < 0 || x > 4 || y < 0 || y > 4) {
                return false;
            }
        }

        return true;
    }
}
