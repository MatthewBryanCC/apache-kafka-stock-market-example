export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'SEK' | 'NZD';
export class Stock {
    ticker: string;
    companyName: string;
    currency: Currency;
    price: number;
    marketCap: number; // in millions
    volume: number;
    sector: string;
    peRatio: number;
    dividendYield: number;

    constructor(params: {
        ticker: string;
        companyName: string;
        price: number;
        currency: Currency;
        marketCap: number;
        volume: number;
        sector: string;
        peRatio: number;
        dividendYield: number;
    }) {
        this.ticker = params.ticker;
        this.companyName = params.companyName;
        this.price = params.price;
        this.currency = params.currency;
        this.marketCap = params.marketCap;
        this.volume = params.volume;
        this.sector = params.sector;
        this.peRatio = params.peRatio;
        this.dividendYield = params.dividendYield;
    }

    /**
     * Simulates a price change for the stock based on a random fluctuation.
     * * @returns {number} - The new price of the stock after the fluctuation.
     */
    simulatePriceChange() : number {
        const volatility = 0.002; // 0.2% typical fluctuation
        const randomFactor = (Math.random() * 2 - 1) * volatility; // -0.2% to +0.2%
        const newPrice = this.price * (1 + randomFactor);

        this.price = parseFloat(newPrice.toFixed(2));
        return this.price;
    }

    /**
     * Prints a summary of the stock information to the console.
     */
    public printSummary() : void {
        console.log(
        `${this.companyName} (${this.ticker}): $${this.price.toFixed(2)} ${this.currency}, Market Cap: $${this.marketCap}M, P/E: ${this.peRatio}, Dividend Yield: ${this.dividendYield}%`
        );
    }
    /**
     * Prints the current stock price to the console.
     */
    public printStockPrice() : void {
        console.log(`Current price of ${this.ticker}: $${this.price.toFixed(2)}`);
    }
}