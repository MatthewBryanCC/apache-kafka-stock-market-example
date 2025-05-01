import { Stock } from './models/stock.js';
import { KafkaService } from './kafka-service.js';
import appConfig from './config.json' with { "type": "json"};

export class Market {
    static #instance : Market;
    private _stockList: Map<string, Stock>;
    private _kafkaService: KafkaService; // Kafka service instance
    public stockList : Map<string, Stock>;

    private constructor() { } // Private constructor to prevent instantiation from outside the class.

    /**
     * Singleton instance of the Market class.
     * @returns {Market} - The singleton instance of the Market class.
     */
    static get instance() : Market {
        if (!Market.#instance) {
            //Market constructor is private, so we can only create an instance here.
            // This is a singleton pattern.
            Market.#instance = new Market();
            Market.#instance._stockList = new Map<string, Stock>();
            if( appConfig.OUTPUT_INFO ) console.log("[Market]: Market instance created. Kafka service initialized.");
            Market.#instance._kafkaService = new KafkaService(); // Initialize the Kafka service instance
        }
        return Market.#instance;
    }

    /**
     * Ticks the market, simulating price changes for each stock and printing their summaries.
     */
    public static tickMarket() : void {
        if (Market.#instance) {
            Market.#instance._stockList.forEach((stock) => {
                stock.simulatePriceChange(); // Simulate price change for each stock
                if( appConfig.DEBUG_MODE ) stock.printStockPrice(); // Print the updated stock information
            });
            Market.sendStockDataToKafka(); // Send the updated stock data to Kafka
        } else {
            console.error("Market instance is not initialized.");
        }
    }

    /**
     * Returns the list of stocks stored by the market.
     * @returns {Map<string, Stock>} - The list of stocks stored by the market.
     */
    public static get stockList() : Map<string, Stock> {
        if (Market.#instance) {
            return Market.#instance._stockList;
        }
        console.error("Market instance is not initialized.");  
        return new Map<string, Stock>();
    }

    /**
     * Adds a new stock to the list of stocks stored by the market.
     * @param stock - The stock to be added to the market.
     */
    public static addStock(stock: Stock) : void {
        if (Market.#instance) {
            Market.#instance._stockList.set(stock.ticker, stock);
        } else {
            console.error("Market instance is not initialized.");
        }
    }

    /**
     * Removes a stock from the list of stocks stored by the market.
     * @param ticker - The ticker symbol of the stock to be removed.
     */
    public static removeStock(ticker: string) : void {
        if (Market.#instance) {
            Market.#instance._stockList.delete(ticker);
        } else {
            console.error("Market instance is not initialized.");
        }
    } 
    
    /**
     * Serializes the stock data to a JSON string.
     * @returns {string} - The JSON string representation of the stock data.
     */
    public static serialiseStockDataToJson() : string {
        if (Market.#instance) {
            const stockData = Array.from(Market.#instance._stockList.values()).map(stock => ({
                ticker: stock.ticker,
                companyName: stock.companyName,
                price: stock.price,
                currency: stock.currency,
                marketCap: stock.marketCap,
                volume: stock.volume,
                sector: stock.sector,
                peRatio: stock.peRatio,
                dividendYield: stock.dividendYield
            }));
            return JSON.stringify(stockData, null, 2); // Pretty print JSON with 2 spaces
        } else {
            console.error("Market instance is not initialized.");
            return "[]"; // Return an empty array if the instance is not initialized
        }
    }

    /**
     * Sends the serialized stock data to Kafka.
     * This method uses the Kafka service to send the stock data to a Kafka topic ('stock-ticker-topic' by default).
     */
    public static async sendStockDataToKafka() : Promise<void> {
        if (Market.#instance) {
            const stockData = Market.serialiseStockDataToJson(); // Serialize stock data to JSON
            await Market.#instance._kafkaService.sendMessage(stockData); // Send the serialized data to Kafka
        } else {
            console.error("Market instance is not initialized.");
        }
    }
}