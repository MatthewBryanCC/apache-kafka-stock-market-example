import { Stock, Currency } from "../models/stock.js";
import { Market } from "../market.js";
export class StockFactory {

    /**
     * Helper function to create stocks and add them to the market.
     * This function is used to create stocks with predefined values for testing purposes.
     */
    static createStocks() : void {
        // Placeholder for stock creation logic
        console.log("Creating stocks...");
        
        let stockNames = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"];
        let stockPrices = [150, 2800, 3400, 299, 700];
        let stockMarketCaps = [2500, 1800, 1700, 2200, 800]; // in millions
        let stockVolumes = [1000000, 2000000, 1500000, 1200000, 800000];
        let stockSectors = ["Technology", "Technology", "Consumer Discretionary", "Technology", "Consumer Discretionary"];
        let stockPERatios = [28, 35, 60, 35, 100];
        let stockDividendYields = [0.6, 0, 0, 0.8, 0]; // in percentage
        let stockCurrencies = ["USD", "USD", "USD", "USD", "USD"];
        let stockCompanyNames = ["Apple Inc.", "Alphabet Inc.", "Amazon.com Inc.", "Microsoft Corp.", "Tesla Inc."];
        
        for (let i = 0; i < stockNames.length; i++) {
            let stock = new Stock({
                ticker: stockNames[i],
                companyName: stockCompanyNames[i],
                price: stockPrices[i],
                currency: stockCurrencies[i] as Currency,
                marketCap: stockMarketCaps[i],
                volume: stockVolumes[i],
                sector: stockSectors[i],
                peRatio: stockPERatios[i],
                dividendYield: stockDividendYields[i]
            });
            Market.addStock(stock);
            console.log(`Created stock: ${stock.ticker} - ${stock.companyName}`);
        }
    }
}