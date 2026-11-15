require("dotenv").config();
const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground");
if (!process.env.DB_URL) throw new Error("Set DB_URL before running the seed script.");
if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") throw new Error("Seeding deletes existing campground records. Set ALLOW_DESTRUCTIVE_SEED=true only if you intentionally want to replace them.");
const sample = array => array[Math.floor(Math.random() * array.length)];
async function seedDB() {
  await mongoose.connect(process.env.DB_URL);
  await Campground.deleteMany({});
  const User = require("../models/user");
  const author = await User.findOne();
  if (!author) throw new Error("Create a user account before seeding campgrounds.");
  const records = [];
  for (let i = 0; i < 100; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    records.push({
      author: author._id,
      location: `${city.city}, ${city.state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description: "A sample travel destination. Add details about this location.",
      price: Math.floor(Math.random() * 20) + 10,
      geometry: { type: "Point", coordinates: [Number(city.longitude), Number(city.latitude)] },
      images: [],
    });
  }
  await Campground.insertMany(records);
  console.log(`Inserted ${records.length} sample locations.`);
}
seedDB().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await mongoose.disconnect(); });
