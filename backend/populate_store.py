"""
Script to populate the XP store with initial items
Run this once to add store items to the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def populate_store():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if items already exist
    existing_count = await db.xp_store_items.count_documents({})
    if existing_count > 0:
        print(f"Store already has {existing_count} items. Skipping population.")
        return
    
    # Store items to populate
    items = [
        # SIMPLE (50-150 XP)
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Básico Azul",
            "item_type": "avatar",
            "classification": "simple",
            "xp_cost": 50,
            "asset_url": "🧒",
            "description": "Avatar simples com tema azul"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Óculos de Sol",
            "item_type": "accessory",
            "classification": "simple",
            "xp_cost": 80,
            "asset_url": "🕶️",
            "description": "Óculos escuros estilosos"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Boné Vermelho",
            "item_type": "accessory",
            "classification": "simple",
            "xp_cost": 100,
            "asset_url": "🧢",
            "description": "Boné vermelho casual"
        },
        
        # COMMON (200-400 XP)
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Ninja",
            "item_type": "avatar",
            "classification": "common",
            "xp_cost": 250,
            "asset_url": "🥷",
            "description": "Avatar ninja furtivo"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Chapéu de Cowboy",
            "item_type": "accessory",
            "classification": "common",
            "xp_cost": 300,
            "asset_url": "🤠",
            "description": "Chapéu de cowboy do velho oeste"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Coroa Dourada",
            "item_type": "accessory",
            "classification": "common",
            "xp_cost": 350,
            "asset_url": "👑",
            "description": "Coroa dourada de rei"
        },
        
        # IMPORTANT (500-800 XP)
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Super-Herói",
            "item_type": "avatar",
            "classification": "important",
            "xp_cost": 500,
            "asset_url": "🦸",
            "description": "Avatar de super-herói poderoso"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Capacete de Astronauta",
            "item_type": "accessory",
            "classification": "important",
            "xp_cost": 600,
            "asset_url": "👨‍🚀",
            "description": "Capacete espacial high-tech"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Mochila Jetpack",
            "item_type": "accessory",
            "classification": "important",
            "xp_cost": 750,
            "asset_url": "🎒",
            "description": "Mochila com propulsão"
        },
        
        # RARE (900-1500 XP)
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Mago",
            "item_type": "avatar",
            "classification": "rare",
            "xp_cost": 1000,
            "asset_url": "🧙",
            "description": "Poderoso avatar mago místico"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Robô",
            "item_type": "avatar",
            "classification": "rare",
            "xp_cost": 1200,
            "asset_url": "🤖",
            "description": "Avatar robô futurista"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Máscara de Dragão",
            "item_type": "accessory",
            "classification": "rare",
            "xp_cost": 1300,
            "asset_url": "🐉",
            "description": "Máscara lendária de dragão"
        },
        
        # DIAMOND (2000+ XP)
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Dragão Dourado",
            "item_type": "avatar",
            "classification": "diamond",
            "xp_cost": 2500,
            "asset_url": "🐲",
            "description": "Avatar épico de dragão dourado lendário"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Avatar Unicórnio Místico",
            "item_type": "avatar",
            "classification": "diamond",
            "xp_cost": 3000,
            "asset_url": "🦄",
            "description": "Avatar raro de unicórnio místico com poderes mágicos"
        },
        {
            "id": str(uuid.uuid4()),
            "item_name": "Troféu de Campeão",
            "item_type": "accessory",
            "classification": "diamond",
            "xp_cost": 2000,
            "asset_url": "🏆",
            "description": "Troféu exclusivo de campeão supremo"
        }
    ]
    
    # Insert items
    result = await db.xp_store_items.insert_many(items)
    print(f"✅ Successfully populated store with {len(result.inserted_ids)} items!")
    
    # Display items by classification
    for classification in ["simple", "common", "important", "rare", "diamond"]:
        items_in_class = [item for item in items if item["classification"] == classification]
        print(f"\n{classification.upper()}:")
        for item in items_in_class:
            print(f"  - {item['item_name']} ({item['item_type']}) - {item['xp_cost']} XP - {item['asset_url']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_store())
