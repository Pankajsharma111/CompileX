const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", ejsMate);
app.get("/", (req, res) => {
  console.log("Working");
  res.send("Working Properly");
});
app.get("/branches", (req, res) => {
  console.log("Working apple");
  // res.send("Working Properly of apple path");
  res.render("branches/index");
});
app.get("/branches/:branch", (req, res) => {
  let { branch } = req.params;
  console.log("Working apple", branch);
  // res.send(`Working Properly of path ${branch}`);
  res.render("branches/semester");
});
// app.get("/branches",())
app.listen("8080", () => {
  console.log("Server is listing on port 8080");
});
// app.use((req, res) => {
//   res.send("I'm listing for everything");
//   console.log(req);
// });
// app.get("/*anyname", (req, res) => {
// res.send("this is workign for all");
// });

// app.get("/:name/:id", (req, res) => {
//   let { name, id } = req.params;
//   res.send("Hello : " + name + "," + id);
// });
// app.get("/name", (req, res) => {
//   let { q } = req.query;
//   res.send("Hello : " + q);
// });c
