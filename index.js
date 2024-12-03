const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

const app = express()

// middleware
app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@simple-crud.ce5cqwx.mongodb.net/?retryWrites=true&w=majority&appName=Simple-crud`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const menuCollection = client.db('Bistro-Boss-v1').collection('menu')
const cartCollection = client.db('Bistro-Boss-v1').collection('cart')


app.get('/menu', async (req, res) => {
    const result = await menuCollection.find().toArray()
    res.send(result)
})
app.post('/cart', async (req, res) => {
    const cartItem = req.body;
    const result = await cartCollection.insertOne(cartItem)
    res.send(result)
})
app.get('/cart', async (req, res) => {
    const email = req.query.email
    const query = { email: email }
    const result = await cartCollection.find(query).toArray()
    res.send(result)
})
app.delete('/cart/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await cartCollection.deleteOne(query)
    res.send(result)
})

// mongodb funtion
async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is runing properly')
})
app.listen(port, () => {
    console.log(`server is runing on port ${port}`);
})
