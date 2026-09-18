const { MongoClient } = require("mongodb");

require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI);

const gameMetadataSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: [
            "gameId",
            "title",
            "developer",
            "publisher",
            "genres",
            "aliases",
            "notes",
            "sources",
            "updatedAt"
        ],
        properties: {
            gameId: {
                bsonType: ["int", "long"],
                description: "PostgreSQL game ID"
            },
            title: {
                bsonType: "string"
            },
            developer: {
                bsonType: "string"
            },
            publisher: {
                bsonType: "string"
            },
            genres: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            },
            aliases: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            },
            notes: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            },
            sources: {
                bsonType: "array",
                items: {
                    bsonType: "object",
                    required: ["name", "url", "note"],
                    properties: {
                        name: {
                            bsonType: "string"
                        },
                        url: {
                            bsonType: "string"
                        },
                        note: {
                            bsonType: "string"
                        }
                    }
                }
            },
            updatedAt: {
                bsonType: "date"
            }
        }
    }
};

async function connectMongoDB() {
    await client.connect();

    const db = client.db("game_release_database");

    const collections = await db
        .listCollections({ name: "game_metadata" })
        .toArray();

    if (collections.length === 0) {
        await db.createCollection("game_metadata", {
            validator: gameMetadataSchema,
            validationLevel: "strict",
            validationAction: "error"
        });
    } else {
        await db.command({
            collMod: "game_metadata",
            validator: gameMetadataSchema,
            validationLevel: "strict",
            validationAction: "error"
        });
    }

    await db.collection("game_metadata").createIndex(
        { gameId: 1 },
        { unique: true }
    );

    console.log("Connected to MongoDB database");

    return db;
}

module.exports = connectMongoDB;