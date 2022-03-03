const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  console.log('GETGETGETGET');
  
  res.sendFile('../frontend/index' , {root: __dirname});
});


module.exports = router;