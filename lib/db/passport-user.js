var mongoose = require('mongoose');
var supergoose = require('supergoose');
var Schema = mongoose.Schema;
var passportSchema = new Schema({
  provider:     String,
  id:           String,
  displayName:  String,
  name: {
    familyName: String,
    middleName: String,
    givenName:  String
  },
  emails: [Schema.Types.Mixed],
  photos: [{
    value:      String
  }]
});

passportSchema.plugin(supergoose, {});
var PassportUser = module.exports = mongoose.model('_PassportUser', passportSchema);
