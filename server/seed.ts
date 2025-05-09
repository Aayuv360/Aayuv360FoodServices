import { db } from './db';
import { users, meals } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { milletMeals } from './mealItems';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Hash password for database
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Check if admin user exists
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).execute();
    
    // Add admin user if it doesn't exist
    if (adminUser.length === 0) {
      console.log('Adding admin user...');
      
      await db.insert(users).values({
        username: 'admin',
        password: await hashPassword('admin123'), // Secure in a real app
        name: 'Admin User',
        email: 'admin@aayuv.com',
        phone: '+91 9876543210',
        address: 'Hyderabad, Telangana',
        role: 'admin',
        createdAt: new Date()
      }).execute();
      
      console.log('Admin user created successfully');
    }
    
    // Check if manager user exists
    const managerUser = await db.select().from(users).where(eq(users.username, 'manager')).execute();
    
    // Add manager user if it doesn't exist
    if (managerUser.length === 0) {
      console.log('Adding manager user...');
      
      await db.insert(users).values({
        username: 'manager',
        password: await hashPassword('manager123'), // Secure in a real app
        name: 'Manager User',
        email: 'manager@aayuv.com',
        phone: '+91 9876543211',
        address: 'Gachibowli, Hyderabad',
        role: 'manager',
        createdAt: new Date()
      }).execute();
      
      console.log('Manager user created successfully');
    }
    
    // Check if guest user exists
    const guestUser = await db.select().from(users).where(eq(users.username, 'guest')).execute();
    
    // Add guest user if it doesn't exist
    if (guestUser.length === 0) {
      console.log('Adding guest user...');
      
      await db.insert(users).values({
        username: 'guest',
        password: await hashPassword('guest'), // Secure in a real app
        name: 'Guest User',
        email: 'guest@example.com',
        phone: null,
        address: null,
        role: 'user',
        createdAt: new Date()
      }).execute();
      
      console.log('Guest user created successfully');
    }
    
    // Check if there are meals in the database
    const existingMeals = await db.select().from(meals).execute();
    
    // Add sample meals if none exist
    if (existingMeals.length === 0 && milletMeals.length > 0) {
      console.log('Adding sample meals...');
      
      // Insert all millet meals
      for (const meal of milletMeals) {
        await db.insert(meals).values({
          ...meal,
          available: true
        }).execute();
      }
      
      console.log(`${milletMeals.length} sample meals added successfully`);
    }
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}