import { createClient } from 'redis';

const redisClient = createClient();
redisClient.connect();

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
export default redisClient;
