import { db } from "./firebase";
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";

export const saveRider = async (riderData: any, isEdit: boolean, id?: string): Promise<any> => {
  return await runTransaction(db, async (transaction) => {
    
    // --- MODE: EDITING ---
    if (isEdit && id) {
      const riderRef = doc(db, "riders", id);
      const riderSnap = await transaction.get(riderRef);

      if (!riderSnap.exists()) throw new Error("Rider not found");

      const oldOpn = riderSnap.data().opn;
      const newOpn = riderData.opn || oldOpn; // Keep old OPN unless specifically changed

      // Update the main rider document
      transaction.update(riderRef, {
        ...riderData,
        updatedAt: serverTimestamp(),
      });

      // Update the registry if OPN changed (rare, but good for safety)
      if (newOpn !== oldOpn) {
        const newOpnRef = doc(db, "opn_registry", newOpn.toUpperCase());
        const oldOpnRef = doc(db, "opn_registry", oldOpn.toUpperCase());
        
        transaction.delete(oldOpnRef);
        transaction.set(newOpnRef, { 
          riderId: id, 
          opn: newOpn.toUpperCase(), 
          updatedAt: serverTimestamp() 
        });
      }

      return { success: true, id, opn: newOpn };
    }

   // --- MODE: NEW REGISTRATION ---
// 1. Generate OPN (Prefix-Random-Month-Year)
// Using your existing prefix logic: Accra -> AC, Kumasi -> KU (substring 0,2)
const prefix = riderData.town.substring(0, 2).toUpperCase();
const random = Math.floor(1000 + Math.random() * 9000);
const month = new Date().getMonth() + 1;
const year = "26";
const generatedOpn = `${prefix}-${random}-${month}-${year}`;

const opnRegistryRef = doc(db, "opn_registry", generatedOpn);
const opnSnap = await transaction.get(opnRegistryRef);

if (opnSnap.exists()) {
  throw new Error("OPN_EXISTS_RETRY");
}

const newRiderRef = doc(collection(db, "riders"));

// 5. ATOMIC WRITES (Enhanced for Multi-Tenancy)
transaction.set(opnRegistryRef, { 
  riderId: newRiderRef.id, 
  opn: generatedOpn,
  status: "Active",
  issuedAt: serverTimestamp(),
  // IMPORTANT: Added these for Dashboard filtering
  town: riderData.town, 
  adminName: riderData.adminName || "System" 
});

transaction.set(newRiderRef, {
  ...riderData,
  id: newRiderRef.id,
  opn: generatedOpn,
  status: "Active",
  createdAt: serverTimestamp(),
});

return { 
  success: true, 
  opn: generatedOpn, 
  name: riderData.fullName, 
  id: newRiderRef.id 
};
  });
};