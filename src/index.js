const path = require("path");
const express = require("express");
const getFileReadMiddleware = require("./file-reader");
const delay = require("./delay");

const app = express();

// const subapp1 = express();
// app.locals.greeting = "hello world";
// subapp1.get("/", (req, res, next) => {
//   console.log("locals: " + JSON.stringify(req.app.locals, null, 4));
// });

// app.use(subapp1);

app.use(
  getFileReadMiddleware([
    path.join(__dirname, "..", "edit_me_1"),
    path.join(__dirname, "..", "edit_me_2")
  ])
);

/**
 * This is an intentionally slow request
 */
app.get("/", async (req, res) => {
  console.log("============== New Request ==============");
  // verify memoization works
  await res.locals.readFile("edit_me_1");
  await res.locals.readFile("edit_me_1");
  await res.locals.readFile("edit_me_1");

  const editMe1 = await res.locals.readFile("edit_me_1");
  console.log(`I read edit_me_1 as: ${editMe1}`);
  console.log(
    "You now have 5 seconds to edit 'edit_me_2' - but I will show the value from _before_ you edited it!"
  );
  await delay(5000);

  const editMe2 = await res.locals.readFile("edit_me_2");
  console.log(`I read edit_me_2 as: ${editMe2}`);

  res.send("look at the console 👇");
});

const server = app.listen(8080, () => {
  const { address, port } = server.address();
  console.log(`🚀  Express Server ready at: ${address}:${port}`);
});
