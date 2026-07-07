const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/online-virtual-classroom", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    try {
      console.log("Connected to MongoDB");

      // Drop the index if it exists
      await mongoose.connection
        .collection("years")
        .dropIndex("code_1")
        .catch(() => {
          console.log("Index did not exist");
        });

      // Check existing years
      const years = await mongoose.connection
        .collection("years")
        .find({})
        .toArray();
      console.log("Existing years:", years);

      // Remove duplicates - keep only unique code entries
      if (years.length > 0) {
        const uniqueCodes = new Set();
        const toDelete = [];
        for (const year of years) {
          if (uniqueCodes.has(year.code)) {
            console.log("Found duplicate:", year.code);
            toDelete.push(year._id);
          } else {
            uniqueCodes.add(year.code);
          }
        }
        if (toDelete.length > 0) {
          await mongoose.connection
            .collection("years")
            .deleteMany({ _id: { $in: toDelete } });
          console.log("Deleted " + toDelete.length + " duplicate entries");
        } else {
          console.log("No duplicates found");
        }
      }

      // Recreate unique index
      await mongoose.connection
        .collection("years")
        .createIndex({ code: 1 }, { unique: true });
      console.log("✅ Unique index on code field recreated successfully");

      // Show final state
      const finalYears = await mongoose.connection
        .collection("years")
        .find({})
        .toArray();
      console.log("Final years:", finalYears);

      process.exit(0);
    } catch (err) {
      console.error("❌ Error:", err.message);
      process.exit(1);
    }
  });
