const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const dnsPromises = dns.promises;

mongoose.connect(process.env.MONGO_URI);

const urlSchema = mongoose.Schema({
  url: { type: String, required: true },
  _id: Number
}, { _id: false });

urlSchema.plugin(AutoIncrement);

const URL = mongoose.model('URL', urlSchema);


app.use(cors({optionSuccessStatus: 200}));

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
    res.send('Welcome to url shorter server')
});

app.post('/api/shorturl/new', function(req, res) {
  let parsed = url.parse(req.body.url, true);

  if (!parsed.host) {
    res.json({"error":"invalid URL"});
    return;
  }

  dnsPromises.lookup(parsed.host)
  .then((result) => {
    return URL.findOne({url: req.body.url});
  })
  .then((result) => {
    if (result) return result;
    let url = new URL({url: req.body.url});
    return url.save();
  })
  .then((result) => {
    res.json({
      original_url: req.body.url,
      short_url: result._id
    });
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: "invalid URL"
    });
    return;
  });
});


app.get('/api/shorturl/:id', async function(req, res) {
  URL.findOne({_id: req.params.id})
  .then((result) => {
    if (!result) {
      res.json({
        error: 'No short url found for given input'
      });
      return;
    }
    res.redirect(result.url);
  })
  .catch(() => {
      res.json({
        error: 'Something went wrong here'
      });
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});