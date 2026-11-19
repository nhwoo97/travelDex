const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// passport-local-mongoose v9 ships its plugin as `default` when loaded with require().
const passportLocalMongooseModule = require("passport-local-mongoose");
const passportLocalMongoose = passportLocalMongooseModule.default || passportLocalMongooseModule;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  // "Want to go" list, shown on the user's public profile.
  favorites: [{ type: Schema.Types.ObjectId, ref: "Campground" }],
}, { timestamps: true });
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
