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

binance.websockets.prevDay(false, (data) => {
	let coin_name = data.symbol;
	let open = data.open;
	let main_coin = coin_name.slice(-3);
	let main_price = 0;
	if (main_coin == "BTC") {
		main_price = 0.001;
		// Buy 0.002 BTC
	} else if (main_coin == "ETH") {
		main_price = 0.02;	
	} else if (main_coin == "BNB") {
		main_price = 1;
	}
	if (main_price != 0) {
		/*
		*  Clear history and set new current Time
		*/
		let eventTime = new Date(data.closeTime);
		let day = eventTime.getDate()
		let month = eventTime.getMonth() + 1
		let year = eventTime.getFullYear()
		let eventDate = year + "/" + month + "/" + day;

		if (currentTime !== eventDate) {
			currentTime = eventDate;
			buyHistory = [];
			logFile.write('<br/>[INFO] ' + "Start for from " + new Date().toUTCString() + " to " + new Date(data.closeTime).toUTCString());
			// console.log("Start for from ", new Date().toUTCString() , " to ", new Date(closeTime).toUTCString());
		}

		let currentType = 0;
				  			
		if (buyHistory[coin_name] !== undefined) {
			currentType = buyHistory[coin_name];
		}

		check_decrease(coin_name, - data.percentChange, currentType);

		if ( - data.percentChange > 99 && currentType < 99) {
			let price = open - (99/100*open);
			let quantity = parseInt(main_price/price) + 1;
			buy(coin_name, quantity, price, 99);
			return;
		}

		if ( - data.percentChange > 90 && currentType < 90) {
			let price = open - (90/100*open);
			let quantity = parseInt(main_price/price) + 1;
			buy(coin_name, quantity, price, 90);
			return;
		}

		if ( - data.percentChange > 50 && currentType < 50) {
			let price = open - (50/100*open);
			let quantity = parseInt(main_price/price) + 1;
			buy(coin_name, quantity, price, 50);
			return;
		}

  	}

});


function buy(coin_name, quantity , price, type) 
{
	binance.buy(coin_name, quantity, price, {type:'LIMIT'}, (error, response) => {
		if (error) {
			logFile.write('<br/>[ERROR] ' + error);
		}

	  	buyHistory[coin_name] = type;

	  	logFile.write('<br/>[INFO] ' + "Bought " + coin_name + " at " + type + "%.");
	});
}


function check_decrease(coin_name, change, currentType) 
{
	for( let percent = 99; percent >= 9; percent = percent - 10) {
		if (change > percent && currentType < percent) {
			// let price = open - (percent/100*open);
			// let quantity = parseInt(main_price/price);
			// buy(coin_name, quantity, percent);

			logFile.write('<br/>[INFO] ' + coin_name + " has decrease > " + percent + "%");
			// console.log("Notice: ", coin_name, " has decrease > ", change, "%")
			buyHistory[coin_name] = percent;
			return;
		}
	}
}

