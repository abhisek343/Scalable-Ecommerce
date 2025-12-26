module.exports = {
    async up(db, client) {
        // Create indexes for users collection
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ createdAt: -1 });

        console.log('Created indexes on users collection');
    },

    async down(db, client) {
        // Drop the indexes (keep the _id index)
        await db.collection('users').dropIndex('email_1');
        await db.collection('users').dropIndex('createdAt_-1');

        console.log('Dropped indexes on users collection');
    }
};
