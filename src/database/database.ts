import { Pool } from 'pg'; // Import the Pool class from the pg module
import { Stock } from '../models/stock.js';
import appConfig from '../config.json' with { "type": "json"}; // Import the configuration file
import dotenv from 'dotenv';

export class Database {
    static #instance: Database;
    private _pool : Pool;
    private constructor() {}

    /**
     * Singleton instance of the Database class.
     * @returns {Database} - The singleton instance of the Database class.
     */
    public static get instance(): Database {
        if (!Database.#instance) {
            // Load environment variables from .env file
            dotenv.config();

            Database.#instance = new Database();
            Database.#instance._pool = null; // Initialize the database client
            Database.#instance.connect();
        }
        return Database.#instance;
    }
    /**
     * Used to create a new database connection pool.
     * @returns {Pool} - The database connection pool.
     */
    private createPool() : Pool {
        if (this._pool) {
            console.error("[Stock Ticker Service]: Database pool already exists.");
            return this._pool;
        }
        try {
            this._pool = new Pool({
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                password: process.env.DB_PASSWORD,
                port: parseInt(process.env.DB_PORT || '5432'),
            });
            return this._pool;
        } catch (error) {
            console.error("[Stock Ticker Service]: Failed to create database pool:", error);
            return null;
        }
    }

    /**
     * Checks if the specified table exists in the database.
     * * @param tableName - The name of the table to check.
     * * @returns {Promise<boolean>} - A promise that resolves to true if the table exists, false otherwise.
     */
    private async tableExists(tableName: string): Promise<boolean> {
        if (!this._pool) {
            console.error("[Stock Ticker Service]: No active database connection.");
            return false;
        }
        try {
            const query = `SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_name = $1
            )`;
            const result = await this._pool.query(query, [tableName]);
            return result.rows[0].exists;
        } catch (error) {
            console.error("[Stock Ticker Service]: Error checking if table exists:", error);
            return false;
        }
    }

    /**
     * Connects to the database and initializes the connection pool.
     * If the connection is already established, it does nothing.
     */
    public async connect(): Promise<void> {
        if (this._pool) {
            console.log("[Stock Ticker Service]: Already connected to the database.");
            return;
        }
        try {
            // Initialize the database client here (e.g., using pg for PostgreSQL)
            this.createPool();

            if( appConfig.OUTPUT_INFO ) console.log("[Stock Ticker Service]: Connected to the database.");
            // Check if the table exists
            const tableName = process.env.TABLE_NAME || 'stocks';
            const tableExists = await this.tableExists(tableName);
            if (!tableExists) {
                console.log("[Stock Ticker Service]: Table does not exist. Attempting to create it...");
                await this.createDatabaseTable(tableName);
            }
        } catch (error) {
            console.error("[Stock Ticker Service]: Failed to connect to the database: ", error);
        }
    }

    /**
     * Creates the database table if it does not exist which holds all stock information.
     * @param tableName - The name of the table to be created.
     * @returns 
     */
    public async createDatabaseTable(tableName: string): Promise<void> {
        if (!this._pool) {
            console.error("[Stock Ticker Service]: No active database connection. Reconnecting...");
            this.createPool();
        }
        try {
            let query = `CREATE TABLE ${tableName} (
                id SERIAL PRIMARY KEY,
                ticker VARCHAR(10) NOT NULL,
                companyName VARCHAR(100) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                marketCap NUMERIC(15, 2) NOT NULL,
                volume INT NOT NULL,
                sector VARCHAR(50) NOT NULL,
                peRatio NUMERIC(5, 2) NOT NULL,
                dividendYield NUMERIC(5, 2) NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            await this._pool.query(query);
            if(this.tableExists(tableName)) {
                console.log("[Stock Ticker Service]: Table created successfully.");
            } else {
                console.error("[Stock Ticker Service]: Table creation failed.");
            }
        } catch (error) {
            console.error("[Stock Ticker Service]: Failed to create the database:", error);
        }
    }

    /**
     * 
     * @param query - The SQL query to be executed.
     * @param params
     */
    public async query(query: string, params: any[]): Promise<any> {
        if (!Database.#instance._pool) {
            this.createPool();
        }
        try {
            const result = await Database.#instance._pool.query(query, params);
            return result;
        } catch (error) {
            console.error("[Stock Ticker Service]: Error executing query:", error);
            return null;
        }
    }

    /**
     * Enumerates through the stock data and saves it to the database.
     * If the stock already exists, it updates the existing record.
     * @param stock - The stock data to be saved in the database.
     */
    public static async saveStockData(stock: Map<string, Stock>): Promise<void> {
        if (!Database.#instance._pool) {
            Database.#instance.createPool();
        }
        try {
            const tableName = process.env.TABLE_NAME || 'stocks';
            for (const [ticker, stockData] of stock) {
                const exists = await Database.checkIfStockExists(ticker);
                if (exists) {
                    const query = `UPDATE ${tableName} SET
                        companyName = $1,
                        currency = $2,
                        price = $3,
                        marketCap = $4,
                        volume = $5,
                        sector = $6,
                        peRatio = $7,
                        dividendYield = $8,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE ticker = $9`;
                    await Database.#instance.query(query, [
                        stockData.companyName,
                        stockData.currency,
                        stockData.price,
                        stockData.marketCap,
                        stockData.volume,
                        stockData.sector,
                        stockData.peRatio,
                        stockData.dividendYield,
                        ticker
                    ]);
                } else {
                    const query = `INSERT INTO ${tableName} (
                        ticker, companyName, currency, price, marketCap, volume, sector, peRatio, dividendYield
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
                    await Database.#instance.query(query, [
                        ticker,
                        stockData.companyName,
                        stockData.currency,
                        stockData.price,
                        stockData.marketCap,
                        stockData.volume,
                        stockData.sector,
                        stockData.peRatio,
                        stockData.dividendYield
                    ]);
                }
            }
            if( appConfig.OUTPUT_INFO ) console.log("[Stock Ticker Service]: Stock data saved successfully.");
        } catch (error) {
            console.error("[Stock Ticker Service]: Failed to save the database:", error);
        }
    }

    /**
     * Checks if a stock with the specified ticker exists in the database.
     * * @param ticker - The stock ticker to check.
     */
    private static async checkIfStockExists(ticker: string): Promise<boolean> {
        if (!Database.#instance._pool) {
            Database.#instance.createPool();
        }
        try {
            const query = `SELECT EXISTS (
                SELECT 1
                FROM stocks
                WHERE ticker = $1
            )`;
            const result = await Database.#instance.query(query, [ticker]);
            if( appConfig.DEBUG_MODE) console.log("[Stock Ticker Service]: Checking if stock exists:", result);
            return result.rows[0].exists;
        } catch (error) {
            console.error("[Stock Ticker Service]: Error checking if stock exists:", error);
            return false;
        }
    }
}