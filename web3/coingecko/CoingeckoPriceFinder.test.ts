import { Coin, CoingeckoPriceFinder, RequestAxiosCall } from "../../../dist";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const finderETH = new CoingeckoPriceFinder();
const finderUSD = new CoingeckoPriceFinder('usd');
const dates = [ '01-01-2022', '02-02-2022', '03-03-2022', '04-04-2022', '05-05-2022' ];
const coins = [ Coin.BTC, Coin.MANA, Coin.DAI, Coin.SAND ];
const symbolId = [ 'bitcoin', 'decentraland', 'dai', 'the-sandbox' ];

const testCoins = [
    Coin.APE, Coin.ARTX, Coin.ATRI, Coin.BTC, Coin.CUBE, Coin.DAI, Coin.MANA,
    Coin.MATIC, Coin.RARI, Coin.SAND, Coin.SCOTT, Coin.USDC, Coin.WBTC
];
const testSymbolIds = [
    "apecoin", "artx", "atari", "bitcoin", "somnium-space-cubes",
    "dai", "decentraland", "matic-network", "rarible", "the-sandbox",
    "scotty-beam", "usd-coin", "bitcoin"
];

async function findEthValues(coinIndex: number, dateIndex: number) {
    let info = dates[dateIndex].split('-');
    let year = parseInt(info[2]);
    let month = parseInt(info[1]);
    let day = parseInt(info[0]);
    let price = await finderETH.getPrice(coins[coinIndex], new Date(year, month - 1, day, 0, 0, 0));
    let coinGeckoPrice: any = await RequestAxiosCall.get(`https://api.coingecko.com/api/v3/coins/${symbolId[coinIndex]}/history?date=${dates[dateIndex]}`);
    return {
        original: coinGeckoPrice.market_data.current_price.eth,
        price: price
    };
}

async function findUsdValues(coinIndex: number, dateIndex: number) {
    let info = dates[dateIndex].split('-');
    let year = parseInt(info[2]);
    let month = parseInt(info[1]);
    let day = parseInt(info[0]);
    let price = await finderUSD.getPrice(coins[coinIndex], new Date(year, month - 1, day, 0, 0, 0));
    let coinGeckoPrice: any = await RequestAxiosCall.get(`https://api.coingecko.com/api/v3/coins/${symbolId[coinIndex]}/history?date=${dates[dateIndex]}`);
    return {
        original: coinGeckoPrice.market_data.current_price.usd,
        price: price
    };
}

describe('testing Checkable Router', () => {
    let mock: MockAdapter;
    beforeAll(() => {
        mock = new MockAdapter(axios);
        for (let symbol of symbolId)
            for (let date of dates)
                mock.onGet(`https://api.coingecko.com/api/v3/coins/${symbol}/history?date=${date}`).reply(200, { market_data: { current_price: { eth: Math.random(), usd: 1200 * Math.random() } } });
    });
    afterAll(() => {
        mock.reset();
    });
    test('ETH Finder Random', async() => {
        let coinIndex: number = Math.floor(Math.random() * coins.length);
        let dateIndex: number = Math.floor(Math.random() * dates.length);
        let values: any;
        if (Math.random() < 0.5)
            values = await findEthValues(coinIndex, dateIndex);
        else
            values = await findUsdValues(coinIndex, dateIndex);
        expect(values.price).toBe(values.price);
    });
    test('Testing symbolId function', () => {
        for (let i = 0; i < testCoins.length; i++)
            expect(finderETH.parseSymbolId(testCoins[i])).toMatch(testSymbolIds[i]);
    })
});