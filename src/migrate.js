const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ================= CONFIGURATION =================
const DRY_RUN = false; // Set to FALSE to actually write data

// --- MIGRATION FLAGS ---
const MIGRATE_PRODUCTS = true;    // Set to true to migrate products
const MIGRATE_SPARE_PARTS = false; // Set to true to migrate spare parts

// Product Settings
const PRODUCT_SOURCE_GROUP = 'products';
const PRODUCT_TARGET_COLLECTION = 'products_staging';

// Spare Part Settings
const PART_SOURCE_GROUP = 'spareParts';
const PART_TARGET_COLLECTION = 'spareParts_staging';

const BATCH_SIZE = 500;
// =================================================

async function migrateProducts() {
    console.log(`\n📦 --- STARTING PRODUCT MIGRATION ---`);
    let batch = db.batch();
    let opCounter = 0;
    let totalFound = 0;

    const snapshot = await db.collectionGroup(PRODUCT_SOURCE_GROUP).get();
    console.log(`Found ${snapshot.size} products. Processing...`);

    for (const doc of snapshot.docs) {
        const oldData = doc.data();
        // Ensure it's nested under a company: companies/{cid}/products/{pid}
        if (!doc.ref.parent.parent) continue;
        const companyId = doc.ref.parent.parent.id;

        const newData = {
            ...oldData,
            companyId: companyId,
            _migratedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (DRY_RUN) {
             if (totalFound < 2) {
                 console.log(`[DRY RUN] Product would save to: ${PRODUCT_TARGET_COLLECTION}/${doc.id}`);
             }
        } else {
            batch.set(db.collection(PRODUCT_TARGET_COLLECTION).doc(doc.id), newData, { merge: true });
            opCounter++;
             if (opCounter === BATCH_SIZE) {
                await batch.commit();
                console.log(`📦 Committed batch of ${BATCH_SIZE} products.`);
                batch = db.batch();
                opCounter = 0;
            }
        }
        totalFound++;
    }

    if (!DRY_RUN && opCounter > 0) await batch.commit();
    console.log(`📦 Product migration finished. Processed: ${totalFound}`);
}

async function migrateSpareParts() {
    console.log(`\n⚙️ --- STARTING SPARE PART MIGRATION ---`);
    let batch = db.batch();
    let opCounter = 0;
    let totalFound = 0;

    const snapshot = await db.collectionGroup(PART_SOURCE_GROUP).get();
    console.log(`Found ${snapshot.size} spare parts. Processing...`);

    for (const doc of snapshot.docs) {
        // Ensure it's nested: companies/{cid}/products/{pid}/spareParts/{sid}
        if (!doc.ref.parent.parent || !doc.ref.parent.parent.parent.parent) continue;

        const productId = doc.ref.parent.parent.id;
        const companyId = doc.ref.parent.parent.parent.parent.id;

        const newData = {
            ...doc.data(),
            productId: productId,
            companyId: companyId,
            _migratedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (DRY_RUN) {
             if (totalFound < 2) {
                 console.log(`[DRY RUN] Part would save to: ${PART_TARGET_COLLECTION}/${doc.id}`);
             }
        } else {
            batch.set(db.collection(PART_TARGET_COLLECTION).doc(doc.id), newData, { merge: true });
            opCounter++;
            if (opCounter === BATCH_SIZE) {
                await batch.commit();
                console.log(`⚙️ Committed batch of ${BATCH_SIZE} parts.`);
                batch = db.batch();
                opCounter = 0;
            }
        }
        totalFound++;
    }

    if (!DRY_RUN && opCounter > 0) await batch.commit();
    console.log(`⚙️ Spare part migration finished. Processed: ${totalFound}`);
}

// Main Execution Flow
async function run() {
    console.log(`MODE: ${DRY_RUN ? '🛑 DRY RUN' : '⚠️ REAL MIGRATION'}`);
    console.log(`Migrating Products: ${MIGRATE_PRODUCTS}`);
    console.log(`Migrating Spare Parts: ${MIGRATE_SPARE_PARTS}\n`);
    
    try {
        if (MIGRATE_PRODUCTS) {
            await migrateProducts();
        } else {
            console.log("\n📦 Skipping Product Migration (Flag is set to false)");
        }

        if (MIGRATE_SPARE_PARTS) {
            await migrateSpareParts();
        } else {
            console.log("\n⚙️ Skipping Spare Part Migration (Flag is set to false)");
        }

        console.log("\n🎉 SCRIPT COMPLETE!");
    } catch (e) {
        console.error("❌ Migration failed:", e);
    }
}

run().then(() => process.exit(0));