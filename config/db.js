const mongoose = require('mongoose')

const connectDB = async () => {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })

    console.log(`MongoDB connected: ${connection.connection.host}`)
}

module.exports = connectDB