const express = require('express');
const router = express.Router();
const Coin = require('../models/Coin');


// Get all coins
router.get('/', async (req, res) => {
	try {
		const coins = await Coin.find();
    res.json(coins);
	} catch (err) {
		res.json({ message: err });
	}
});

// Add new coin
router.post('/', async (req, res) => {
	const coin = new Coin({
		coinGeckoID: req.body.coinGeckoID,
	});
	try {
		const savedCoin = await coin.save();
		res.json(savedCoin);
	} catch (err) {
		res.json({ message: err });
	}
});

// Delete coin
router.delete('/:coinID', async (req, res) => {
  try {
    const removeCoin =  await Coin.remove({ _id: req.params.coinID });
    res.json(removeCoin);
  } catch (err) {
    res.json({ message: err })
  }
})

module.exports = router;
