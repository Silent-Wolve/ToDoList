import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import dotenv from "dotenv";

const app = express();

dotenv.config();

// var items = [];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

const hidden_key = process.env.HIDDEN_KEY;

mongoose.connect("mongodb+srv://admin-Tatah:"+hidden_key+"@cluster0.5vvi1.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcom to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete and item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

//Rendering Database Items to the ToDoList
app.get("/", async (req, res) => {
   
    var foundItems = await Item.find();
    if (foundItems.length === 0){
        Item.insertMany(defaultItems).then(function(){
            console.log("Successfully saved default items to DB.");
        }).catch(function(err){
            console.log(err);
        })

        res.redirect("/"); 
    
    } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
})

//Creating Custom List using Express Route Parameters
app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    let foundList = await List.findOne({name: customListName});
    if(!foundList){
        //Create a new list
        const list = new List({
            name: customListName,
            items: defaultItems
        });
    
         list.save()
         res.redirect("/" + customListName);

    } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }

})

// Adding New Items to the ToDoList
app.post("/", async (req, res) => {
       const itemName = req.body.newItem;
       const listName = req.body.list;

       const item = new Item({
        name: itemName
       });

       if(listName === "Today"){
        item.save();
        res.redirect("/");
       } else {
        let foundList = await List.findOne({name: listName});
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
       }
})

//Deleting Items from the ToDoList
app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(checkedItemId).then(function(err){
            if(!err){
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    
    } else {

        let foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}); 
        res.redirect("/" + listName);
    }
    
})

app.listen(3000, () => {
    console.log("Server is up and running!");
})