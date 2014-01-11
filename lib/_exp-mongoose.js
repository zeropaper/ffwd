var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// Configure for possible deployment
var uristring =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/experiment';

var mongoOptions = { db: { safe: true } };

// Connect to Database
mongoose.connect(uristring, mongoOptions, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Successfully connected to: ' + uristring);
  }
});

var HoldedSchema = new Schema({
  title: String
});
var HolderSchema = new Schema({
  name: String,
  hasManyField: [{type: Schema.Types.ObjectId, ref: 'Holded'}],
  hasOneField: {type: Schema.Types.ObjectId, ref: 'Holded'}
});

var Holded = mongoose.model('Holded', HoldedSchema);
var Holder = mongoose.model('Holder', HolderSchema);

// var firstHolded = new Holded({
//   title: 'first'
// });
// firstHolded.save();

// var secondHolded = new Holded({
//   title: 'second'
// });
// secondHolded.save();

// var thirdHolded = new Holded({
//   title: 'third'
// });
// thirdHolded.save();

function clear(cb) {
  Holded.find({}).remove(function() {
    Holder.find({}).remove(cb);
  });
}

function create(done) {
  async.map([
    {
      title: 'first'
    },
    {
      title: 'second'
    },
    {
      title: 'third'
    }
  ], function(data, cb) {
    Holded.create(data, cb);
  }, function(err, docs) {
    Holder.create({
      name: 'first holder',
      hasManyField: [docs[0]._id, docs[1]._id],
      hasOneField: docs[2]._id
    }, function(err, rec) {
      Holder.findById(rec._id)
        .populate('hasOneField')
        .populate('hasManyField')
        .exec(done);
    });
  });
}

clear(create(function(err, found) {
  console.info('.............found document', found);
}));