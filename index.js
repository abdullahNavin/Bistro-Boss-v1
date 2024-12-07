const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
const userCollection = client.db('Bistro-Boss-v1').collection('user')

// jwt 
app.post('/jwt', async (req, res) => {
    const userInfo = req.body;
    const token = jwt.sign(userInfo, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1hr' })
    res.send({ token })
})
// middleWare
const verifyToken = (req, res, next) => {
    // console.log(req.headers.authorization); //
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Unauthorize access' })
    }
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorize access' })
        }
        req.decoded = decoded
        next()

    })
}
const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email
    const query = { email: email }
    const user = await userCollection.findOne(query)
    const isAdmin = user?.role === 'admin'
    if (!isAdmin) {
        return res.status(403).send('Forbiden access')
    }
    next()
}


// menu related api
app.get('/menu', async (req, res) => {
    const result = await menuCollection.find().toArray()
    res.send(result)
})
// cart section
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
app.delete('/cart/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await cartCollection.deleteOne(query)
    res.send(result)
})

// user section
app.post('/user', async (req, res) => {
    const userInfo = req.body;
    const query = { email: userInfo.email }
    const isValid = await userCollection.findOne(query)
    if (isValid) {
        return res.send({ message: 'user alrady exist is database', insertedId: true })
    }
    const result = await userCollection.insertOne(userInfo)
    res.send(result)
})
app.get('/user', verifyToken, verifyAdmin, async (req, res) => {
    const result = await userCollection.find().toArray()
    res.send(result)
})
app.delete('/user/:email',verifyToken,verifyAdmin, async (req, res) => {
    const email = req.params.email;
    const filter = { email: email }
    const deleteUserCart = await cartCollection.deleteMany(filter)
    const result = await userCollection.deleteOne(filter)
    res.send(result)
})
app.patch('/user/:id',verifyToken,verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const updateRole = {
        $set: { role: 'admin' }
    }
    const result = await userCollection.updateOne(filter, updateRole)
    res.send(result)
})
// user Admin 
app.get('/user/admin/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbiden access' })
    }
    const query = { email: email }
    const user = await userCollection.findOne(query)
    // console.log(user);
    let admin = false
    if (user) {
        admin = user?.role === 'admin'
    }
    res.send({ admin })
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
