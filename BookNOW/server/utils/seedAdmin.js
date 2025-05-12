require('dotenv').config({ path: '../.env' }); 

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db'); 
const User = require('../models/User'); 


const seedAdminUser = async () => {
    
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    const adminName = process.env.DEFAULT_ADMIN_NAME;

    if (!adminEmail || !adminPassword || !adminName) {
        console.error('Error: Default admin user credentials (EMAIL, PASSWORD, NAME) not found in .env file.');
        return false; 
    }

    try {
        
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists. No action taken.');
            return true; 
        }

        
        const userWithEmail = await User.findOne({ email: adminEmail });
        if (userWithEmail) {
            console.log(`User with email ${adminEmail} exists but is not admin. Updating role...`);
            userWithEmail.role = 'admin';
            userWithEmail.isApproved = true;
            await userWithEmail.save();
            console.log(`Updated user ${adminEmail} to admin role.`);
            return true; 
        }

        
        console.log('No admin user found. Creating default admin...');

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        
        await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isApproved: true
        });

        console.log(`Default admin user created successfully with email: ${adminEmail}`);
        return true; 

    } catch (error) {
        console.error('Error during admin user seeding:', error.message);
        return false; 
    }
};


const runSeed = async () => {
    console.log('Connecting to DB for admin seeding...');
    await connectDB(); 

    const success = await seedAdminUser(); 

    if (success) {
        console.log('Admin seeding process completed.');
    } else {
        console.log('Admin seeding process failed.');
    }

    console.log('Disconnecting from DB...');
    await mongoose.disconnect(); 
    process.exit(success ? 0 : 1); 
};


runSeed();