require("dotenv").config();
const { log } = require("node:console");
const app = require("./app");
const port = process.env.PORT || 5000;

const connectDB = require("./src/config/db");

connectDB();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
