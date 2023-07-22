const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
//for lodash
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

//item schema
const itemSchema = {
  name: String,
};

//model document
const Item = mongoose.model("Item", itemSchema);

//default items
const item1 = new Item({
  name: "Welcome to your your todolist",
});


const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemSchema],
};
//List model
const List = mongoose.model("List", listSchema);

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find({})
    .then((item) => {
      if (item.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully saved default items");
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: item });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const Name = _.capitalize(req.params.customListName);

  List.findOne({ name: Name })
    .then((data) => {
      if (!data) {
        // Create a new list
        const list = new List({
          name: Name,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + Name);
      } else {
        //show existing list
        res.render("list", { listTitle: data.name, newListItems: data.items });
      }
    })
    .catch(() => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(() => {
        console.log(err);
      });
  }
});

app.post("/delete", (req, res) => {
  const ID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(ID)
      .then(() => {
        console.log("Successfully removed the item");
        res.redirect("/");
      })
      .catch(() => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: ID } } })
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch(() => {
        console.log(err);
      });
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
