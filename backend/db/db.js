import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();  // Ensure environment variables are loaded

function connect() {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("✅ Connected to MongoDB");
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); // Exit the process on failure
    });
}

export default connect;