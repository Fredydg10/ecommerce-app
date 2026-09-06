/**
 * ==========================================
 * SERVIDOR BACKEND - E-COMMERCE (Híbrido)
 * PostgreSQL (Supabase) + MongoDB (Atlas) + Stripe
 * ==========================================
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // ⚠️ IMPORTANTE PARA STRIPE

// Imports de MongoDB
const connectMongoDB = require('./mongodb');
const ProductMongo = require('./models/ProductMongo');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// 1. CONEXIONES A BASES DE DATOS
// ==========================================

// A) PostgreSQL (Supabase) - Forzamos SSL para evitar desconexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // ⚠️ CLAVE: Forzar SSL siempre para Supabase
});

// Paracaídas: Si la conexión se cae, no tumbar el servidor, solo avisar
pool.on('error', (err, client) => {
  console.error('⚠️ [BACKEND] Conexión inactiva a PostgreSQL cerrada:', err.message);
});

if (process.env.CI !== 'true') {
  pool.connect((err) => {
    if (err) console.error('❌ Error DB PostgreSQL:', err.message);
    else console.log('✅ Conexión a PostgreSQL (E-commerce) exitosa');
  });

  // B) MongoDB (Atlas)
  connectMongoDB().catch(err => {
    console.error('❌ Error crítico al conectar con MongoDB:', err);
  });
}

// ==========================================
// 2. RUTAS POSTGRESQL (Datos Estructurados)
// ==========================================

// GET - Obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('🔴 [BACKEND] ERROR PostgreSQL:', error.message);
    res.status(500).json({ error: 'Error al obtener productos', detalle: error.message });
  }
});

// GET - Obtener un producto por ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST - Crear una nueva orden (Checkout)
app.post('/api/orders', async (req, res) => {
  const { user_id, items, total_amount } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Crear la orden
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING id',
      [user_id, total_amount]
    );
    const orderId = orderResult.rows[0].id;

    // 2. Insertar los items de la orden y restar stock
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT'); // Confirmar transacción
    res.status(201).json({ mensaje: 'Orden creada con éxito', orderId });
  } catch (error) {
    await client.query('ROLLBACK'); // Cancelar si hay error
    console.error('🔴 [BACKEND] Error en transacción:', error);
    res.status(500).json({ error: 'Error al crear la orden' });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. RUTAS MONGODB (Datos Flexibles/Dinámicos)
// ==========================================

// GET - Obtener todos los productos de MongoDB
app.get('/api/mongo/products', async (req, res) => {
  try {
    const products = await ProductMongo.find();
    res.json(products);
  } catch (error) {
    console.error('🔴 [BACKEND] Error MongoDB:', error.message);
    res.status(500).json({ error: 'Error al obtener productos de MongoDB' });
  }
});

// GET - Insertar productos de prueba con atributos dinámicos
app.get('/api/mongo/seed', async (req, res) => {
  try {
    const productosDemo = [
      {
        name: 'Laptop Alienware X15',
        category: 'laptop',
        price: 2500,
        stock: 5,
        description: 'Laptop gaming de alta gama',
        image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
        attributes: {
          ram: '32GB DDR5',
          cpu: 'Intel i9-13900H',
          gpu: 'RTX 4080',
          storage: '1TB NVMe SSD',
          pantalla: '15.6" QHD 240Hz'
        }
      },
      {
        name: 'Camiseta Gamer Pro',
        category: 'ropa',
        price: 25,
        stock: 100,
        description: 'Camiseta oficial de esports',
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        attributes: {
          talla: ['S', 'M', 'L', 'XL'],
          color: 'Negro',
          material: '100% Algodón',
          genero: 'Unisex'
        }
      },
      {
        name: 'Silla Ergonómica Pro',
        category: 'mobiliario',
        price: 450,
        stock: 15,
        description: 'Silla gamer con soporte lumbar',
        image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500',
        attributes: {
          material: 'Cuero sintético',
          color: 'Negro/Rojo',
          peso_maximo: '150kg',
          reclinable: true,
          reposabrazos: '4D ajustables'
        }
      }
    ];

    await ProductMongo.insertMany(productosDemo);
    res.json({ mensaje: '✅ 3 productos insertados en MongoDB', cantidad: productosDemo.length });
  } catch (error) {
    console.error('🔴 [BACKEND] Error al insertar en MongoDB:', error.message);
    res.status(500).json({ error: 'Error al insertar productos' });
  }
});

// ==========================================
// 4. RUTAS DE PAGO (STRIPE) ⚠️ ¡AQUÍ ESTÁ LA MAGIA!
// ==========================================
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { total_amount } = req.body;

    // Stripe maneja los montos en centavos (ej: $10.50 = 1050 centavos)
    const amountInCents = Math.round(total_amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd', // O 'mxn', 'cop', 'eur' según tu país
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('🔴 Error en Stripe:', error.message);
    res.status(500).json({ error: 'Error al crear el intento de pago' });
  }
});

// ==========================================
// 5. RUTA DE PRUEBA
// ==========================================
app.get('/', (req, res) => res.json({ mensaje: 'API E-commerce Híbrida funcionando 🛒🚀' }));

// ==========================================
// 6. EXPORTACIÓN Y ARRANQUE
// ==========================================
module.exports = app;

// Solo levantamos el servidor si se ejecuta DIRECTAMENTE (no en tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor E-commerce corriendo en http://localhost:${PORT}`);
  });
}