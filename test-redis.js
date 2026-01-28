// Quick test Redis connection
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || "rediss://default:AeUFAAIncDFjYWRiYTU3ZGQ3NDQ0ZjQ5YjA1MzMwZDkyOWEzNWVkNnAxNTg2Mjk@calm-thrush-58629.upstash.io:6379");

async function testRedis() {
  try {
    console.log('🔌 Connecting to Redis...');

    // Ping test
    const pong = await redis.ping();
    console.log('✅ Ping:', pong);

    // Push test
    const testData = {
      id: 123,
      name: 'Test User',
      timestamp: Date.now()
    };

    await redis.lpush('test-queue', JSON.stringify(testData));
    console.log('✅ Pushed to queue:', testData);

    // Pop test
    const data = await redis.rpop('test-queue');
    console.log('✅ Popped from queue:', JSON.parse(data));

    // Check queue length
    const queueLength = await redis.llen('registration-queue');
    console.log('📊 Current registration-queue length:', queueLength);

    console.log('\n🎉 All tests passed! Redis is ready to use!');

    redis.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testRedis();
