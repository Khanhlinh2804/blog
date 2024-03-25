const { default: mongoose } = require('mongoose');
const mongodb = require('mongoose');

const connectDB = async () => {

    try {
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log(`Database connect success`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB;