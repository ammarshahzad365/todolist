const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
require("dotenv").config();

//for online deployments
var port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

const app = express();
const password = process.env.MONGODB_ATLAS_PASSWORD;
//mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect('mongodb+srv://ammarshahzad365:' + encodeURIComponent(password) +'@todolistcluster.mpajytd.mongodb.net/', {useNewUrlParser: true});

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//----------------------------------Mongoose----------------------------------//
const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todo list!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

//----------------------------------Routes----------------------------------//
//Home route
app.get("/", function(req, res) {

  Item.find({}).then(function(items){
    if(items.length === 0){ //if there are no items in the DB, insert default items
      Item.insertMany(defaultItems).then(function(){
        console.log("Successfully saved default items to DB."); //log to console
      }).catch(function(err){ 
        console.log(err); 
      });
      res.redirect("/"); //redirect to home route to display default items
    } else {
      res.render("list", {listTitle: "Today", newListItems: items}); //render list.ejs with items from DB
    }})
    .catch(function(err){
      console.log(err);
    });
});

//Delete route
app.post("/delete", function(req, res){
  const deleteItem = req.body.checkbox;
  const itemId = deleteItem.split(";")[0];
  const listName = deleteItem.split(";")[1];

  if(listName==="Today"){
    Item.findByIdAndDelete(itemId).then(function(){
      console.log("Successfully deleted item from DB.");

      res.redirect("/");
    }).catch(function(err){
      console.log(err);
    });

  } else {

    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}).then(function(){
      console.log("Successfully deleted item from list: " + listName);

      res.redirect("/" + listName);
    }).catch(function(err){
      console.log(err);
    });
  }
});

//Create new post route
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(listName);


  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save().then(function(){
      console.log("Successfully saved item to DB.");
      res.redirect("/");
    }).catch(function(err){
      console.log(err);
    });
    
  } else {
      List.findOne({name: listName}).exec().then((foundList) => {
        foundList.items.push(newItem);
        foundList.save().then(function(){
          console.log("Successfully saved item to list: " + listName);
          res.redirect("/" + listName);
        }).catch(function(err){
          console.log(err);
        });
    }).catch(function(err){
      console.log(err);
    });
}});

//Custom list route
app.get("/:customPage", (req, res)=>{

  if(req.params.customPage === "favicon.ico"){
    return;
  }

  let listName = lodash.capitalize(req.params.customPage);
  List.findOne({name: listName}).then((foundList) => {
    if(!foundList){ //if no list found
      //Create a new list
      const list = new List({
        name: listName,
        items: defaultItems
      });
      list.save().then(function(){ //make sure list is saved before redirecting
        res.redirect("/" + listName);
      });
    } else {
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  });
});

//About route
app.get("/about", function(req, res){
  res.render("about");
});

//----------------------------------Server----------------------------------//
app.listen(port, function() {
  console.log("Server started on port " + port);
});
