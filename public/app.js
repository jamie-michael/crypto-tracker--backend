import animateCSS from "./UI/animateCSS.js";

const btn = document.querySelector('.search-button');
const searchInput = document.querySelector('.search-input');

const APIBtn = document.querySelector('.api-btn');
const searchResults = document.querySelector('.search-results');
const closeSearchInputBtn = document.querySelector('.close-search-input');

let matchList = document.querySelector('.match-list');
const backdrop = document.querySelector('.backdrop');
let trackerList = document.querySelector('.tracker-list');
let marketList = document.querySelector('.market-list');

const marketNavBtn = document.querySelector('.market-nav--btn');
const trackerNavBtn = document.querySelector('.tracker-nav--btn');


let searchTimeout = false;
let databaseTimeout = false;
let searchCache = [];

let activeElement;
let trackerDataCache = [];
let databaseCache = [];

const loadingSpinner = '<i class="fa-solid fa-spinner spinner"></i>';

const intToString = (num) => {
	num = num.toString().replace(/[^0-9.]/g, '');
	if (num < 1000) {
		return num;
	}
	let si = [
		{ v: 1e3, s: 'K' },
		{ v: 1e6, s: 'M' },
		{ v: 1e9, s: 'B' },
		{ v: 1e12, s: 'T' },
		{ v: 1e15, s: 'P' },
		{ v: 1e18, s: 'E' },
	];
	let index;
	for (index = si.length - 1; index > 0; index--) {
		if (num >= si[index].v) {
			break;
		}
	}
	return (
		(num / si[index].v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') +
		si[index].s
	);
};



const closeSearchInputBtnHandler = () => {
	hideSearchResults();
};

const backdropHandler = () => {
	hideSearchResults();
};

const showSearchResults = () => {
	if (!searchResults.classList.contains('show')) {
		searchResults.classList.add('show');
		searchInput.style.border = 'solid 1px #313842';
		toggleBackdrop(50);
	}
};
const hideSearchResults = () => {
	if (searchResults.classList.contains('show')) {
		searchInput.style.removeProperty('border');
		searchResults.classList.remove('show');
		searchInput.value = '';
		toggleBackdrop();
	}
};

const toggleBackdrop = (opacity) => {
	if (backdrop.classList.contains('show')) {
		backdrop.classList.remove('show');
		backdrop.style.removeProperty('opacity');
		backdrop.removeEventListener('click', backdropHandler);
	} else {
		backdrop.style.opacity = `${opacity}%`;
		backdrop.classList.add('show');
		backdrop.addEventListener('click', backdropHandler);
	}
};

const addItemToDatabase = async (coinGeckoID) => {
	const coin = { coinGeckoID };
	await fetch('https://coin-tracker101.herokuapp.com/coins/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(coin),
	});
};


const deleteFromTrackerHandler = async (coinGeckoID) => {
	await fetchDatabase(true);
 
	const coin = databaseCache.find((el) => el.coinGeckoID === coinGeckoID);


	await fetch('https://coin-tracker101.herokuapp.com/coins/' + coin._id, {
		method: 'DELETE',
	});
	updateTrackerListUI();
};

const updateTrackerListUI = async () => {
	await fetchDatabase(true);
	if (databaseCache.length === 0) {
		trackerList.innerHTML = '<div class="no-coins flex-item flex-item--column"><img src="./img/no-coins1.png" alt=""><p>You\'re empty. Add come coins!</p></div>';
	} else {
		await fetchCGCoinData();
		const data = await fetchTrackerData();
		trackerList.innerHTML = outputTrackerListHTML(data);
		addTrackerElementLogic();
	}
};

const updateMarketListUI = async () => {
	await fetchCGCoinData();
	marketList.innerHTML = outputMarketListHTML(searchCache);
	addMarketElementLogic(marketList);
};

const addColorToPercentageIncrease = (el) => {
	if (
		parseFloat(el.querySelector('.twenty-four-hr--percentage').textContent) >=
		0.0
	) {
		el.querySelector('.fa-caret-up').classList.remove('hide');
		el.querySelector('.twenty-four-hr--change').style.color = '#2ebd85';
	} else {
		el.querySelector('.fa-caret-down').classList.remove('hide');
		el.querySelector('.twenty-four-hr--change').style.color = '#f6455f';
	}
};

const addTrackerElementLogic = () => {
	trackerList.childNodes.forEach((el) => {
		const id = el.getAttribute('cgid'); 

		// add delete element event listeners
		const deleteElementBtn = el.querySelector('.delete-btn');
		deleteElementBtn.addEventListener('click', () => {
			deleteFromTrackerHandler(id);
		});

		addColorToPercentageIncrease(el);
	});
};

const toggleStar = (icon) => {
	if (icon.classList.contains('fa-solid')) {
		icon.classList.remove('fa-solid');
		icon.classList.add('fa-regular');
	} else {
		icon.classList.remove('fa-regular');
		icon.classList.add('fa-solid');
	}
};

const toggleStaredHandler = async (ev) => {
	const id = ev.currentTarget.el.getAttribute('cg-id');
	const icon = ev.currentTarget.icon;
	await fetchDatabase(true);
	const tracked = isCoinBeingTracked(id);
	if (tracked) {
		toggleStar(icon);
		await deleteFromTrackerHandler(id);
	} else {
		toggleStar(icon);
		await addItemToDatabase(id);
	}
};

const addMarketElementLogic = (list) => {
	list.childNodes.forEach((el) => {
		const removeAddToTrackedEventListener = () => {
			el.removeEventListener('click');
		};

		if (isCoinBeingTracked(el.getAttribute('cg-id'))) {
			const icon = el.querySelector('.track').childNodes[0];
			toggleStar(icon);
			// icon.removeEventListener('click', addcoin);
			icon.addEventListener('click', toggleStaredHandler);
			icon.el = el;
			icon.icon = icon;
			
		} else {
			const icon = el.querySelector('.track').childNodes[0];
			icon.addEventListener('click', toggleStaredHandler);
			icon.el = el;
			icon.icon = icon;
		}
		addColorToPercentageIncrease(el);
	});
};

const outputTrackerListHTML = (data) => {
	const html = data
		.map(
			(el) =>
				`<li class="element" CGID="${el.id}">
	<div class="grid-item rank">
		<p>#${el.market_cap_rank}</p>
	</div>
	<div class="grid-item image tiny-image-render">
		<img src="${el.image}" alt="" />
	</div>
	<div class="grid-item symbol">
		<p>${el.symbol.toUpperCase()}</p>
	</div>
	<div class="grid-item name">
		<p>${el.name}</p>
	</div>
	<div class="twenty-four-hr--change flex-item grid-item">
		<i class="fa-solid fa-caret-up hide"></i>
		<i class="fa-solid fa-caret-down hide"></i>
		<p class="twenty-four-hr--percentage">
			${
				el.price_change_percentage_24h
					? el.price_change_percentage_24h.toFixed(1)
					: ''
			}%
		</p>
	</div>
	<div class="grid-item price">
		<p>$${el.current_price}</p>
	</div>
	<div class="grid-item delete">
		<i class="fa-regular fa-trash-can delete-btn"></i>
	</div>
</li>`
		)
		.join('');

	return html;
};

const outputMarketListHTML = (data) => {
	const html = data
		.map(
			(el) =>
				`<li class="element" cg-id="${el.id}">
	<div class="grid-item rank">
		<p>#${el.market_cap_rank}</p>
	</div>
	<div class="grid-item image tiny-image-render">
		<img src="${el.image}" alt="" />
	</div>
	<div class="grid-item symbol">
		<p>${el.symbol.toUpperCase()}</p>
	</div>
	<div class="grid-item name">
		<p>${el.name}</p>
	</div>
	<div class="twenty-four-hr--change flex-item grid-item">
		<i class="fa-solid fa-caret-up hide"></i>
		<i class="fa-solid fa-caret-down hide"></i>
		<p class="twenty-four-hr--percentage">
			${
				el.price_change_percentage_24h
					? el.price_change_percentage_24h.toFixed(1)
					: ''
			}%
		</p>
	</div>
	<div class="grid-item price">
		<p>$${el.current_price}</p>
	</div>
	<div class="grid-item track"><i class="fa-regular fa-star remove-from-tracker--btn"></i></div>
	</li>`
		)
		.join('');

	return html;
};

const fetchTrackerData = async () => {
	await fetchCGCoinData();
	await fetchDatabase();
	const trackerData = databaseCache.map((el1) => {
		return searchCache.find((el2) => el2.id === el1.coinGeckoID);
	});
	return trackerData;
};

const fetchDatabase = async (overrideTimeout) => {
	if (databaseTimeout && !overrideTimeout) return databaseCache;

	databaseTimeout = true;

	const res = await fetch('https://coin-tracker101.herokuapp.com/coins/');
	databaseCache = await res.json();

	// stop FetchSerachData from fetching for a set period of time.
	new Promise(() => {
		setTimeout(() => {
			searchTimeout = false;
		}, 5000);
	});
};

const isCoinBeingTracked = (id) => {
	let coinExists = false;
	databaseCache.forEach((e) => {
		if (id === e.coinGeckoID) {
			coinExists = true;
			return;
		}
	});
	return coinExists;
};

const addCoinToTrackerHandler = async (el) => {
	const CGID = el.getAttribute('cg-id');

	const tracked = isCoinBeingTracked(CGID);
	if (!tracked) {
		await addItemToDatabase(CGID);
		await animateCSS(el, 'fadeOutRight');
		updateTrackerListUI();
		// const marketEl = marketList.find(el => el.getAttribute('cg-id') === CGID)
		const marketEl = marketList.childNodes.forEach(el => {
			const id = el.getAttribute('cg-id');
			if (id === CGID) {
				el.childNodes.forEach(el2 => {
					if (el2.nodeType !== 3 && el2.classList.contains('track')) {
						toggleStar(el2.childNodes[0]);
					}
				})
				
				
			}
		});
		
		if (backdrop.classList.contains('show')) {
			backdropHandler();
		}
	} else {
		animateCSS(el, 'headShake');
	}
};

const fetchCGCoinData = async (overrideTimeout) => {
	if (searchTimeout && !overrideTimeout) return searchCache;

	searchTimeout = true;
	let allData = [];
	let currentPage = 0;

	while (currentPage <= 2) {

		currentPage++;
		const response = await fetch(
			`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${currentPage}&sparkline=false`
		);
		let data = await response.json();
		data.forEach((e) => allData.push(e));
	}

	// stop FetchSerachData from fetching for 30 seconds.
	new Promise(() => {
		setTimeout(() => {
			searchTimeout = false;
		}, 60000);
	});

	searchCache = allData;
	return allData;
};

const addSearchElementEventListeners = (list) => {
	list.childNodes.forEach((el) => {
		el.addEventListener('click', () => {
			addCoinToTrackerHandler(el);
		});
	});
};

const searchInputHandler = async () => {
	await fetchCGCoinData();
	let matches = [];
	const query = searchInput.value;

	searchCache.map((coin) => {
		if (
			coin.name.toLowerCase().includes(query.toLowerCase()) ||
			coin.symbol.toLowerCase().includes(query.toLowerCase())
		) {
			if (query !== '') {
				matches.push(coin);
			}
		}
	});
	if (matches.length > 0) {
		const elementList = outputSearchHTML(matches);
		addSearchElementEventListeners(elementList);
		showSearchResults();
	} else if (matches.length === 0 && query !== '') {
		const html = `<li class="no-search-results">No results</li>`;
		matchList.innerHTML = html;
		showSearchResults();
	} else {
		matches = [];
		matchList.innerHTML = '';
		hideSearchResults();
	}
};

const outputSearchHTML = (matches) => {
	const html = matches
		.map(
			(match) => `
			<li class="flex-item" cg-id="${match.id}">
			<div class="flex-item">
				<img src="${match.image}" class="tiny-image-render" alt="" />
				<p>${match.name} ${match.symbol.toUpperCase()}</p>
			</div>
			<p class="rank">#${match.market_cap_rank}</p>
		</li>
			`
		)
		.join('');
	matchList.innerHTML = html;
	return matchList;
};

const trackerNavBtnHandler = async () => {
	if (trackerList.classList.contains('show')) return;
	trackerList.innerHTML = loadingSpinner;
	marketList.classList.remove('show');
	trackerList.classList.add('show');
	trackerNavBtn.classList.toggle('active');
	marketNavBtn.classList.toggle('active');
	await updateTrackerListUI();
};

const marketNavBtnHandler = async () => {
	if (marketList.classList.contains('show')) return;
	marketList.innerHTML = loadingSpinner;
	marketList.classList.add('show');
	trackerList.classList.remove('show');
	marketNavBtn.classList.toggle('active');
	trackerNavBtn.classList.toggle('active');
	await updateMarketListUI();
};

const pageLoadTrackerData = async () => {
	marketNavBtn.classList.toggle('active');
	marketList.innerHTML = loadingSpinner;
	marketList.classList.toggle('show');
	await fetchDatabase();
	await fetchCGCoinData();
	await updateMarketListUI();
};

pageLoadTrackerData();
// APIBtn.addEventListener('click', APIBtnHandler);
searchInput.addEventListener('input', searchInputHandler);
closeSearchInputBtn.addEventListener('click', closeSearchInputBtnHandler);
marketNavBtn.addEventListener('click', marketNavBtnHandler);
trackerNavBtn.addEventListener('click', trackerNavBtnHandler);

// btn.addEventListener('click', btnHandler);
