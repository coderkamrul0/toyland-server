const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.mjrrjle.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const toysCollection = client.db("toyLab").collection("toys");

    // get all toys
    app.get("/allToys", async (req, res) => {
      const result = await toysCollection.find({}).limit(20).toArray();
      res.send(result);
    });

    // get all toys by category
    app.get("/toys/:category", async (req, res) => {
      if (
        req.params.category == "Baby" ||
        req.params.category == "Barbie" ||
        req.params.category == "American"
      ) {
        const result = await toysCollection
          .find({ category: req.params.category })
          .toArray();
        return res.send(result);
      } else {
        const result = await toysCollection.find({}).toArray();
        res.send(result);
      }
    });

    // my toys
    app.get("/myToys/:email", async (req, res) => {
      const result = await toysCollection
        .find({ seller_email: req.params.email })
        .sort({ price: req.query.sort === "asc" ? 1 : -1 })
        .toArray();
      res.send(result);
    });

    const indexKeys = { name: 1 };
    const indexOptions = { name: "name" };
    const result = await toysCollection.createIndex(indexKeys, indexOptions);

    app.get("/toySearchByName/:name", async (req, res) => {
      const search = req.params.name;
      const result = await toysCollection
        .find({
          $or: [{ name: { $regex: search, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    // insert a toy
    app.post("/addToy", async (req, res) => {
      const toy = req.body;
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    });

    // toy details
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(filter);
      res.send(result);
    });

    // update
    app.patch("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const updateToyData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateToy = {
        $set: {
          name: updateToyData.name,
          picture: updateToyData.picture,
          price: updateToyData.price,
          rating: updateToyData.rating,
          quantity: updateToyData.quantity,
          details: updateToyData.details,
        },
      };
      const result = await toysCollection.updateOne(filter, updateToy);
      res.send(result);
    });

    // delete
    app.delete("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
