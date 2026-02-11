import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

interface ServiceResponse {
  success: boolean;
  id?: string;
  opn?: string;
}

export const saveRider = async (
    riderData: any,
    isEdit: boolean,
    id?: string,
  ): Promise<ServiceResponse> => {
  const ridersRef = collection(db, "riders");

  // 1. Logic for OPN Generation (Only for new riders)
  // Format: [Prefix]-[Random]-[Month]-[Year]
  const generateOPN = (town: string) => {
    const prefix = town.substring(0, 2).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    const month = new Date().getMonth() + 1;
    const year = "26";
    return `${prefix}-${random}-${month}-${year}`;
  };

  
    try {
      if (isEdit && id) {
        // UPDATE EXISTING RIDER
        const riderDoc = doc(db, "riders", id);
        await updateDoc(riderDoc, {
          ...riderData,
          updatedAt: serverTimestamp(),
        });
        return { success: true, id };
      } else {
        // CREATE NEW RIDER
        const opn = generateOPN(riderData.town);
        const docRef = await addDoc(ridersRef, {
          ...riderData,
          opn: opn,
          status: "Pending", // New riders start as pending
          createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id, opn };
      }
    } catch (error) {
      console.error("Firestore Error:", error);
      throw error;
    }
  };

