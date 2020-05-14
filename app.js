const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("<MONGO-ATLAS LINK>", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = Item({
  name: "Welcome to todolist"
});

const item2 = Item({
  name: "Use checkbox to delete an item"
});

const item3 = Item({
  name: "Todolist keeps your data secure"
});

const defaultItems = [item1, item2, item3];

// DON'T GET CONFUSED: Defining a schema for lists. However, the default list 'Today' on "/" route doesn't follow this schema.
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);



// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted!");
        }
      });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName == "Today") {
    // Since the default list behaves differently
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);

      // This will update list with new data
      foundList.save();

      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (!err) {
        console.log("Successfully Deleted!");
        res.redirect("/");
      }
    });
  } else {
    // $pull operator will pull an item from an array more efficiently than a for loop. findOneAndUpdate will also return the 'foundlist' but we don't need it int this case.
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }else{
        console.log(err);
      }
    });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = lodash.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    } else {
      console.log(err);
    }
  });

});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server has successfully.");
});
