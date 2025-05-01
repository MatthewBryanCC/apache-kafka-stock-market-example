import appConfig from './config.json' with { "type": "json"};
import { Market } from './market.js';
import { StockFactory } from './factories/StockFactory.js';
import { Database } from './database/database.js';

class Application {
    private _applicationStartTime : number;
    private _applicationTime : number;
    private _historicalData! : any[]; // Placeholder for historical data type
    private _market : Market; // Singleton instance of the Market class
    private _database : Database = Database.instance; // Singleton instance of the Database class

    /**
     * Loads the configuration file and historical data, and starts the application loop.
     * @constructor
     */
    constructor() {
        this._applicationStartTime = Date.now();
        this._applicationTime = 0;
        this._market = Market.instance; // Get the singleton instance of the Market class

        if( appConfig.OUTPUT_INFO ) console.log("[Stock Ticker Service]: Application started");

        // Load configuration and historical data.
        let configResult = this.loadConfig();
        if (!configResult) {
            console.error("[Stock Ticker Service]: Failed to load configuration file - application failed to launch.");
            return;
        }
        let historicalDataResult = this.loadHistoricalData();
        if (!historicalDataResult) {
            console.error("[Stock Ticker Service]: Failed to load historical data - application failed to launch.");
            return;
        }

        // Start the application loop.
        this.run();
    }

    /***
     * Load the configuration file and set the application mode.
     * @returns {boolean} - Returns true if the configuration file was loaded successfully, false otherwise.
     */
    private loadConfig() : boolean {
        console.log("Loading configuration...");
        if (!appConfig) {
            console.error("Failed to load configuration file.");
            return false;
        }
        return true;
    }
    
    /***
     * Load historical data from the PostgreSQL database. This function is incomplete and needs to be implemented to fetch data from the database.
     * For now, it creates stocks using the StockFactory.
     * @returns {boolean} - Returns true if the historical data was loaded successfully, false otherwise.
     */
    private loadHistoricalData() : boolean {
        StockFactory.createStocks(); // Create stocks using the StockFactory
        if( appConfig.OUTPUT_INFO) console.log("[Stock Ticker Service]: Loading historical data...");
        if( Market.stockList.size > 0 ) {
            if( appConfig.OUTPUT_INFO) console.log("[Stock Ticker Service]: Historical data loaded successfully.");
            return true;
        }
        return false;
    }

    /**
     * Run the application.
     * This method starts the main loop of the application, which updates the application time and ticks every second.
     */
    private run() : void {
        if( appConfig.OUTPUT_INFO ) console.log("[Stock Ticker Service]: Running application...");
        setInterval(() => this.tickApplication(), appConfig.BROADCAST_INTERVAL); // Tick every second
        setInterval(() => this.tickArchive(), appConfig.ARCHIVE_INTERVAL); // Archive every 10 seconds
        
    }

    /**
     * Archive the stock data.
     * This method saves the stock data to the database and logs the archiving process to the console.
     */
    private tickArchive() : void {
        if( appConfig.OUTPUT_INFO ) console.log("[Stock Ticker Service]: Archiving data...");
        Database.saveStockData(Market.stockList); // Save the stock data to the database
    }

    /**
     * Tick the application.
     * This method updates the application time and logs the current application time to the console.
     */
    private tickApplication() : void {
        this.updateTime();
        Market.tickMarket(); // Tick the market to simulate price changes
    }

    /**
     * Update the application time.
     * This method calculates the elapsed time since the application started and updates the application time.
     */
    private updateTime() : void {
        const currentTime = Date.now();
        const deltaTime = currentTime - this._applicationStartTime;
        this._applicationTime = deltaTime / 1000; // Convert to seconds
    }
}

const app = new Application();