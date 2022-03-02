const mongoose = require('mongoose'); 
const Schema = mongoose.Schema;

const CoinSchema = new Schema({
  coinGeckoID: String,
});

module.exports = mongoose.model('Coin', CoinSchema);