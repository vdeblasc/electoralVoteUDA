import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/api/status', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API Gateway del Sistema de Votación corriendo correctamente',
        blockchainConnected: false // Cambiaremos esto cuando conectemos Fabric
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[Servidor]: API Gateway ejecutándose en http://localhost:${PORT}`);
});