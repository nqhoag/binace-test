const binance = require('node-binance-api');
const fs = require('fs');

var logFile = fs.createWriteStream('/var/www/html/index.html', { flags: 'a' });

// const 

binance.options({
  'APIKEY':'#',
  'APISECRET':'#',
  // 'test':true
});

let currentTime = null;
let buyHistory = [];

setInterval(() => {
	binance.prices((error, ticker) => {
	  for (var key in ticker) {
		
		let coin_name = key
		let main_coin = coin_name.slice(-3);
		let main_price = 0;
		if (main_coin == "BTC") {
			main_price = 0.001;
			// Buy 0.002 BTC
		} else if (main_coin == "ETH") {
			main_price = 0.0001;	
		} else if (main_coin == "BNB") {
			main_price = 1;
		}

		if (main_price != 0) {
		  	check_coin(coin_name, main_price);
		}
	  }

	});

}, 10000);


function buy(coin_name, quantity, type) 
{
	binance.marketBuy(coin_name, quantity, (error, response) => {
		if (error) {
			logFile.write('<br/>[ERROR] ' + error);
		}

	  	buyHistory[coin_name] = type;

	  	logFile.write('<br/>[INFO] ' + "Bought " + coin_name + " at " + type + "%.");
	});
}

function get_price(coin_name, cb_func) 
{
	binance.prices(coin_name, (error, ticker) => {
		cb_func(error, ticker)
	});
}

function check_decrease(coin_name, change, open, currentType) 
{
	for( let percent = 99; percent >= 9; percent = percent - 10) {
		if ((change/open)*100 > percent && currentType < percent) {
			// let price = open - (percent/100*open);
			// let quantity = parseInt(main_price/price);
			// buy(coin_name, quantity, percent);

			logFile.write('<br/>[INFO] ' + coin_name + " has decrease > " + percent + "%");
			// console.log("Notice: ", coin_name, " has decrease > ", percent, "%")
			buyHistory[coin_name] = 40;

			return;
		}
	}
}


function check_coin(coin_name, main_price) 
{
	binance.candlesticks(coin_name, "1d", function(error, ticks) {
		  		if (error) {
		  			return;
		  		}

				if (ticks.length > 1) {
					let last_tick = ticks[ticks.length - 1];
					let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;

					/*
			  		*  Clear history and set new current Time
			  		*/
			  		if (currentTime !== closeTime) {
			  			currentTime = closeTime;
			  			buyHistory = [];
			  			logFile.write('<br/>[INFO] ' + "Start for from " + new Date().toUTCString() + " to " + new Date(closeTime).toUTCString());
			  			// console.log("Start for from ", new Date().toUTCString() , " to ", new Date(closeTime).toUTCString());
			  		}

			  		let currentType = 0;
			  		
			  		if (buyHistory[coin_name] !== undefined) {
			  			currentType = buyHistory[coin_name];
			  		}

					let change = open - close;
					if (change > 0) {
						
						check_decrease(coin_name, change, open, currentType);

						if ((change/open)*100 > 99.1 && currentType < 99.1) {
							let price = open - (99.1/100*open);
							let quantity = parseInt(main_price/price);
							buy(coin_name, quantity, 99.1);
							return;
						}

						if ((change/open)*100 > 90 && currentType < 90) {
							let price = open - (90/100*open);
							let quantity = parseInt(main_price/price);
							buy(coin_name, quantity, 90);

							return;
						}

						if ((change/open)*100 > 50 && currentType < 50) {
							let price = open - (90/100*open);
							let quantity = parseInt(main_price/price);
							buy(coin_name, quantity, 50);

							return;
						}
					}
				}
			}, {limit: 2});
}

