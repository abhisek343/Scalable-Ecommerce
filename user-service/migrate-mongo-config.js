module.exports = {
    mongodb: {
        url: process.env.MONGO_URI || "mongodb://localhost:27017",
        databaseName: process.env.DB_NAME || "user_service_db",

        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    migrationsDir: "migrations",
    changelogCollectionName: "changelog",
    migrationFileExtension: ".js",
    useFileHash: false,
    moduleSystem: 'commonjs'
};
