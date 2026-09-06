const mongoose = require('mongoose');

// La URI debe venir SOLO del .env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI no está definida en el archivo .env');
}

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión a MongoDB Atlas exitosa');
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectMongoDB;